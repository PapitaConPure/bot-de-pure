import chalk from 'chalk';
import { getUnixTime, minutesToMilliseconds } from 'date-fns';
import type { Client, Guild, GuildTextBasedChannel, Message, Snowflake } from 'discord.js';
import { Collection, MessageFlags } from 'discord.js';
import type { AnyBulkWriteOperation } from 'mongoose';
import { ClientNotFoundError, client } from '@/core/client';
import { booruApiKey, booruUserId, globalConfigs } from '@/data/globalProps';
import { isNSFWChannel, paginateRaw } from '@/func';
import GuildConfigs, { type GuildConfigDocument } from '@/models/guildconfigs';
import { Booru, type Post } from '@/systems/booru/boorufetch';
import type { PostFormatData, Suscription } from '@/systems/booru/boorusend';
import { formatBooruPostMessage, notifyUsers } from '@/systems/booru/boorusend';
import { auditAction, auditError } from '@/systems/others/auditor';
import { fetchGuildMembers } from '@/utils/guildratekeeper';
import Logger from '@/utils/logs';

const { debug, warn, error } = Logger('WARN', 'BooruSend');

export interface FeedData extends PostFormatData {
	tags: string;
	lastFetchedAt?: Date;
	faults?: number;
}

//Configuraciones globales de actualización de Feeds
export const feedTagSuscriptionsCache: Map<Snowflake, Map<Snowflake, Array<string>>> = new Map();

/**@description Intervalo base de actualización de feeds.*/
export const FEED_UPDATE_INTERVAL = minutesToMilliseconds(30);
/**@description Máxima cantidad de posts por actualización de cada feed individual.*/
export const FEED_UPDATE_MAX_POST_COUNT = 32;
/**@description Máxima cantidad de feeds por bache de actualización.*/
export const FEED_BATCH_MAX_COUNT = 5;

async function updateBooruFeeds(guilds: Collection<Snowflake, Guild>): Promise<void> {
	const booru = new Booru({ apiKey: booruApiKey, userId: booruUserId });
	const startMs = Date.now();

	try {
		await processFeeds(booru, guilds).catch(console.error);
		Booru.cleanupTagsCache();
	} catch (err) {
		//Solución temporal para atrapar el bug malvado de una vez
		const now = new Date(Date.now());
		const unixNow = getUnixTime(now);
		auditError(err, {
			brief: 'Ocurrió un error crítico y verdaderamente inesperado al procesar Feeds',
			details: `<t:${unixNow}:F> <t:${unixNow}:R>`,
			ping: true,
		});
		error(err, 'Fecha del error:', now);
	}

	const delayMs = Date.now() - startMs;
	setTimeout(updateBooruFeeds, FEED_UPDATE_INTERVAL - delayMs, guilds);
	auditAction('Se procesaron Feeds', { name: 'Servers', value: `${guilds.size}`, inline: true });
}

/**
 * @param booru El Booru a comprobar
 * @param guilds Colección de Guilds a procesar
 */
async function processFeeds(booru: Booru, guilds: Collection<Snowflake, Guild>) {
	const guildIds = guilds.map((g) => g.id);
	const guildConfigs = await GuildConfigs.find({
		guildId: { $in: guildIds },
		feeds: { $exists: true, $ne: {} },
	});

	const bulkOps: (AnyBulkWriteOperation<GuildConfigDocument> | undefined)[] = [];

	await Promise.all(
		guildConfigs.map(async (gcfg) => {
			const guild = guilds.get(gcfg.guildId);
			if (!guild) return;

			await fetchGuildMembers(guild);
			const members = guild.members.cache;

			await Promise.all(
				Object.entries(gcfg.feeds).map(async ([channelId, feedData]) => {
					const feed = new BooruFeed(booru, guild.id, channelId, feedData.tags, feedData);
					if (!feed.isRunning) return;
					if (!feed.isProcessable)
						return feed.faults < 10 && bulkOps.push(feed.addFault());

					//Recolectar últimas imágenes para el Feed
					const { success, posts, newPosts } = await feed.fetchPosts();
					if (!success) return;
					if (!posts.length) return feed.faults < 10 && bulkOps.push(feed.addFault());
					if (!newPosts.length) return bulkOps.push(feed.reduceFaults());

					const toSave: Partial<FeedData> = {};

					if (feed.faults > 0) toSave.faults = Math.max(0, feed.faults - 2);

					//Preparar suscripciones a Feeds
					const feedSuscriptions: Suscription[] = [];
					for (const [userId, feedSuscription] of feedTagSuscriptionsCache) {
						if (!feedSuscription.has(channelId)) continue;

						const followedTags = feedSuscription.get(channelId);
						if (followedTags) feedSuscriptions.push({ userId, followedTags });
					}

					//Comprobar recolectado en busca de imágenes nuevas
					const channel = feed.channel;
					const messagesToSend: Message<true>[] = [];
					let faultedDuringPostSend = false;

					await Promise.all(
						newPosts.map(async (post) => {
							try {
								if (!feed.channel) {
									faultedDuringPostSend = true;
									return;
								}

								const formattedContainer = await formatBooruPostMessage(
									booru,
									post,
									feed,
								);
								const sent = await feed.channel.send({
									flags: MessageFlags.IsComponentsV2,
									components: [formattedContainer],
								});
								await notifyUsers(post, sent, members, feedSuscriptions);
								messagesToSend.push(sent);
							} catch (err) {
								warn(
									`Ocurrió un error al enviar la imagen de Feed: ${post.source ?? post.id} para ${channel?.name}`,
								);
								error(err);
								auditError(err, {
									brief: 'Ocurrió un error al enviar una imagen de Feed',
									details: `\`Post<"${post.source ?? post.id}">\`\n${channel}`,
								});
							}
						}),
					);

					if (faultedDuringPostSend)
						return feed.faults < 10 && bulkOps.push(feed.addFault());

					//Eliminar aquellos Posts no coincidentes con lo encontrado y guardar
					toSave.lastFetchedAt = feed.lastFetchedAt;

					const $set = {};
					for (const [key, value] of Object.entries(toSave))
						$set[`feeds.${channelId}.${key}`] = value;

					return bulkOps.push({
						updateOne: {
							filter: { guildId: gcfg.guildId },
							update: { $set },
						},
					});
				}),
			);
		}),
	);

	debug.dir(bulkOps, { depth: null });

	if (bulkOps.length) await GuildConfigs.bulkWrite(bulkOps.filter((b) => b != null));
}

function getNextBaseUpdateStart(): number {
	//Encontrar próximo inicio de fracción de hora para actualizar Feeds
	const now = new Date();
	let feedUpdateStart =
		FEED_UPDATE_INTERVAL
		- (now.getMinutes() * 60e3 + now.getSeconds() * 1e3 + now.getMilliseconds());
	while (feedUpdateStart <= 0) feedUpdateStart += FEED_UPDATE_INTERVAL;
	feedUpdateStart += 30e3; //Añadir 30 segundos para dar ventana de tiempo razonable al update de Gelbooru
	return feedUpdateStart;
}

export interface GuildFeedChunk {
	guilds: Array<[Snowflake, Guild]>;
	tid: NodeJS.Timeout | null;
	timestamp: Date | null;
}

/**@description Inicializa una cadena de actualización de Feeds en todas las Guilds que cuentan con uno.*/
export async function setupGuildFeedUpdateStack(client: Client) {
	const feedUpdateStart = getNextBaseUpdateStart();
	const guildConfigs = await GuildConfigs.find({ feeds: { $exists: true } });

	const feedChunks = paginateRaw(
		client.guilds.cache.filter((guild) =>
			guildConfigs.some((gcfg) => gcfg.guildId === guild.id),
		),
		FEED_BATCH_MAX_COUNT,
	).map((g) => ({ guilds: g, tid: null, timestamp: null }) as GuildFeedChunk);

	const feedCount = guildConfigs
		.filter((gcfg) => gcfg.feeds?.size)
		.map((gcfg) => Object.keys(gcfg.feeds).length)
		.reduce((previous, current) => previous + current, 0);
	const chunkCount = feedChunks.length;

	let shortestTime = 0;
	feedChunks.forEach((chunk, i) => {
		const guilds = new Collection(chunk.guilds);
		let chunkUpdateStart = feedUpdateStart + FEED_UPDATE_INTERVAL * (i / chunkCount);
		if (chunkUpdateStart - FEED_UPDATE_INTERVAL > 0) chunkUpdateStart -= FEED_UPDATE_INTERVAL;
		if (!shortestTime || chunkUpdateStart < shortestTime) shortestTime = chunkUpdateStart;

		feedChunks[i].tid = setTimeout(updateBooruFeeds, chunkUpdateStart, guilds);
		feedChunks[i].timestamp = new Date(Date.now() + chunkUpdateStart);
	});

	globalConfigs.feedGuildChunks = feedChunks;

	debug({ feedChunks, feedCount, chunkCount, shortestTime });

	auditAction(
		'Se prepararon Feeds',
		{
			name: 'Primer Envío',
			value: `<t:${Math.floor((Date.now() + shortestTime) * 0.001)}:R>`,
			inline: true,
		},
		{ name: 'Intervalo Base', value: `${FEED_UPDATE_INTERVAL / 60e3} minutos`, inline: true },
		{ name: 'Subdivisiones', value: `${chunkCount}`, inline: true },
	);

	return;
}

/**
 * @description Añade la Guild actual a la cadena de actualización de Feeds si aún no está en ella
 * @returns La cantidad de milisegundos que faltan para actualizar el Feed añadido por primera vez, ó -1 si no se pudo agregar
 */
export function addGuildToFeedUpdateStack(guild: Guild): number {
	if (!('feedGuildChunks' in globalConfigs)) return -1;

	if (!Array.isArray(globalConfigs.feedGuildChunks)) return -1;

	const guildChunks: GuildFeedChunk[] = globalConfigs.feedGuildChunks;
	const chunkAmount = guildChunks.length;

	//Retornar temprano si la guild ya está integrada al stack
	const chunkIndexWithThisGuild = guildChunks.findIndex((chunk) =>
		chunk.guilds.some((g) => guild.id === g[0]),
	);
	if (chunkIndexWithThisGuild)
		return (
			getNextBaseUpdateStart()
			+ FEED_UPDATE_INTERVAL * (chunkIndexWithThisGuild / chunkAmount)
		);

	//Añadir guild a stack en un chunk nuevo o uno ya definido
	const feedUpdateStart = getNextBaseUpdateStart();
	let newGuildChunkUpdateDelay = 0;
	if (guildChunks[guildChunks.length - 1].guilds.length >= FEED_BATCH_MAX_COUNT) {
		//Subdividir 1 nivel más
		guildChunks.push({ tid: null, guilds: [[guild.id, guild]], timestamp: null });
		const chunkAmount = guildChunks.length;
		let shortestTime = 0;
		guildChunks.forEach((chunk, i) => {
			let chunkUpdateStart = feedUpdateStart + FEED_UPDATE_INTERVAL * (i / chunkAmount);
			if (chunkUpdateStart - FEED_UPDATE_INTERVAL > 0)
				chunkUpdateStart -= FEED_UPDATE_INTERVAL;
			if (!shortestTime || chunkUpdateStart < shortestTime) shortestTime = chunkUpdateStart;

			if (chunk.tid) clearTimeout(chunk.tid);
			guildChunks[i].tid = setTimeout(
				updateBooruFeeds,
				chunkUpdateStart,
				new Collection(chunk.guilds),
			);
			guildChunks[i].timestamp = new Date(Date.now() + chunkUpdateStart);
		});

		newGuildChunkUpdateDelay = +(guildChunks[chunkAmount - 1].timestamp as Date) - Date.now();

		auditAction(
			'Intervalos de Feed Reescritos',
			{
				name: 'Primer Envío',
				value: `<t:${Math.floor((Date.now() + shortestTime) * 0.001)}:R>`,
				inline: true,
			},
			{ name: 'Subdivisiones', value: `${chunkAmount}`, inline: true },
		);
	} else {
		//Añadir a última subdivisión
		guildChunks[guildChunks.length - 1].guilds.push([guild.id, guild]);
		const chunk = guildChunks[guildChunks.length - 1];
		const chunkAmount = guildChunks.length;
		newGuildChunkUpdateDelay =
			feedUpdateStart + (FEED_UPDATE_INTERVAL * (chunkAmount - 1)) / chunkAmount;

		if (chunk.tid) clearTimeout(chunk.tid);
		guildChunks[guildChunks.length - 1].tid = setTimeout(
			updateBooruFeeds,
			newGuildChunkUpdateDelay,
			new Collection(chunk.guilds),
		);
		guildChunks[guildChunks.length - 1].timestamp = new Date(
			Date.now() + newGuildChunkUpdateDelay,
		);
	}

	auditAction(`Guild ${guild.id} Incorporada a Feeds`);
	globalConfigs.feedGuildChunks = guildChunks;
	return newGuildChunkUpdateDelay;
}

/**
 * @description Actualiza el caché de una suscripción de Feed de un usuario con las tags suministradas
 * @param userId La ID del usuario suspcrito
 * @param channelId La ID del canal del Feed al cuál está suscripto el usuario
 * @param newTags Las tags con las cuáles reemplazar las actuales en caché
 */
export function updateFollowedFeedTagsCache(
	userId: Snowflake,
	channelId: Snowflake,
	newTags: Array<string>,
): void {
	if (typeof userId !== 'string')
		throw ReferenceError('Se requiere una ID de usuario de tipo string');
	if (typeof channelId !== 'string')
		throw ReferenceError('Se requiere una ID de canal de tipo string');
	if (!Array.isArray(newTags)) throw TypeError('Las tags a incorporar deben ser un array');

	if (!feedTagSuscriptionsCache.has(userId)) feedTagSuscriptionsCache.set(userId, new Map());

	const userMap = feedTagSuscriptionsCache.get(userId) as Map<string, string[]>;

	if (!newTags.length) {
		userMap.delete(channelId);
		if (!userMap.size) feedTagSuscriptionsCache.delete(userId);
		return;
	}

	userMap.set(channelId, newTags);
}

export interface FeedOptions {
	lastFetchedAt?: Date;
	faults?: number;
	maxTags?: number;
	cornerIcon?: string;
	title?: string;
	subtitle?: string;
	footer?: string;
}

/**@class Representa un Feed programado de imágenes de {@linkcode Booru}.*/
export class BooruFeed {
	booru: Booru;
	channel: GuildTextBasedChannel | null;
	tags: string;

	lastFetchedAt: Date;
	faults: number;
	maxTags: number;
	cornerIcon: string | undefined;
	title: string | undefined;
	subtitle: string | undefined;
	footer: string | undefined;

	#guildId: string;
	#channelId: string;

	/**
	 * @description Crea una representación de un Feed programado de imágenes de {@linkcode Booru}.
	 * @throws {TypeError}
	 */
	constructor(
		booru: Booru,
		guildId: string,
		channelId: string,
		tags: string,
		options?: FeedOptions,
	) {
		if (!client) throw new ClientNotFoundError();

		const guild = client?.guilds.cache.get(guildId);
		const channel = guild?.channels.cache.get(channelId);

		this.booru = booru;
		this.#guildId = guildId;
		this.#channelId = channelId;
		this.channel = channel?.isTextBased() ? channel : null;
		this.tags = tags;

		options ??= {};
		this.lastFetchedAt =
			options.lastFetchedAt ?? new Date(Math.floor(Date.now() - FEED_UPDATE_INTERVAL / 2));
		this.faults = options.faults ?? 0;
		this.maxTags = options.maxTags ?? 20;
		this.cornerIcon = options.cornerIcon ?? undefined;
		this.title = options.title ?? undefined;
		this.subtitle = options.subtitle ?? undefined;
		this.footer = options.footer ?? undefined;
	}

	get isProcessable() {
		if (!this.booru || !this.channel || !this.tags) return false;

		return this.channel?.guild?.channels.cache.has(this.channelId);
	}

	get isRunning() {
		return !this.faults || this.faults < 10;
	}

	/**@description Obtiene {@linkcode Post}s que no han sido publicados.*/
	async fetchPosts(): Promise<
		| { success: true; posts: Post[]; newPosts: Post[] }
		| { success: false; posts: []; newPosts: [] }
	> {
		try {
			const fetched = await this.booru.search(this.tags, {
				limit: FEED_UPDATE_MAX_POST_COUNT,
			});
			if (!fetched.length) return { success: true, posts: [], newPosts: [] };

			fetched.reverse();
			const lastFetchedAt = new Date(this.lastFetchedAt);
			const firstPost = fetched[0];
			const lastPost = fetched[fetched.length - 1];
			const mostRecentPost = firstPost.createdAt > lastPost.createdAt ? firstPost : lastPost;
			this.lastFetchedAt = mostRecentPost.createdAt;

			const newPosts = fetched.filter((post) => post.createdAt > lastFetchedAt);

			return { success: true, posts: fetched, newPosts: newPosts };
		} catch (error) {
			console.log(
				chalk.redBright(
					'Ocurrió un problema mientras se esperaban los resultados de búsqueda de un Feed',
				),
			);
			console.log({
				guildName: this.channel?.guild?.name,
				channelId: this.channelId,
				feedTags: this.tags,
			});
			console.error(error);

			return { success: false, posts: [], newPosts: [] };
		}
	}

	/**
	 * @description Aumenta el número de fallas del Feed en pasos de 1.
	 * @returns Una bulkOp de `updateOne` para un modelo {@linkcode GuildConfigs}, o `undefined` si ya se registraron 10 fallas.
	 */
	addFault(): AnyBulkWriteOperation<GuildConfigDocument> | undefined {
		const channel = this.channel;
		const guild = channel?.guild;

		auditAction(
			'Comprobando eliminación de un Feed no disponible',
			{ name: 'Servidor', value: `${guild}`, inline: true },
			{ name: 'Canal', value: `${channel ?? 'No disponible'}`, inline: true },
			{ name: 'Reintentos', value: `${this.faults + 1} / 10`, inline: true },
		);

		if (this.faults >= 10) return undefined;

		this.faults += 1;
		return {
			updateOne: {
				filter: { guildId: this.guildId },
				update: { $set: { [`feeds.${this.channelId}.faults`]: this.faults } },
			},
		};
	}

	/**
	 * @description Reduce progresivamente las fallas detectadas del Feed en pasos de 2.
	 * @returns Una bulkOp de `updateOne` para un modelo {@linkcode GuildConfigs}.
	 */
	reduceFaults(): AnyBulkWriteOperation<GuildConfigDocument> | undefined {
		this.faults = Math.max(0, this.faults - 2);
		this.lastFetchedAt = new Date(Date.now());
		return {
			updateOne: {
				filter: { guildId: this.guildId },
				update: {
					$set: {
						[`feeds.${this.channelId}.faults`]: this.faults,
						[`feeds.${this.channelId}.lastFetchedAt`]: this.lastFetchedAt,
					},
				},
			},
		};
	}

	get allowNSFW() {
		return this.channel ? isNSFWChannel(this.channel) : false;
	}

	get guildId() {
		return this.channel?.guild?.id ?? this.#guildId;
	}

	get channelId() {
		return this.channel?.id ?? this.#channelId;
	}
}
