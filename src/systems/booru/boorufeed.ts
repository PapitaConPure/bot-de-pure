import type { BooruClient } from '@papitaconpure/booru-client';
import { getUnixTime, minutesToMilliseconds } from 'date-fns';
import type { GuildTextBasedChannel, Snowflake } from 'discord.js';
import { MessageFlags } from 'discord.js';
import type { AnyBulkWriteOperation } from 'mongoose';
import { ClientNotFoundError, client } from '@/core/client';
import { globalConfigs } from '@/data/globalProps';
import { isNSFWChannel } from '@/func';
import { FeedConfigModel, type FeedDocument, type FeedSchemaType } from '@/models/feeds';
import type { PostFormatData, Suscription } from '@/systems/booru/boorusend';
import { formatBooruPostMessage, notifyUsers } from '@/systems/booru/boorusend';
import { auditAction, auditError } from '@/systems/others/auditor';
import { fetchGuildMembers } from '@/utils/guildratekeeper';
import Logger from '@/utils/logs';
import { getMainBooruClient } from './booruclient';

const { debug, info, warn, error, fatal } = Logger('DEBUG', 'BooruFeed');

export interface FeedData extends PostFormatData {
	tags: string;
	lastFetchedAt?: Date;
	faults?: number;
}

/**Global cache for user feed tag subscriptions.*/
export const feedTagSubscriptionsCache: Map<Snowflake, Map<Snowflake, Array<string>>> = new Map();

/**Base update interval for feeds before accounting for chunk subdivision.*/
export const FEED_UPDATE_INTERVAL = minutesToMilliseconds(30);
/**How many Posts can a Feed request from a Booru at a time.*/
export const FEED_UPDATE_MAX_POST_COUNT = 32;
/**Maximum Feed count a chunk can contain before needing a new subdivision.*/
export const FEED_CHUNK_MAX_SIZE = 5;

/**Represents a collection of chunks to be batch-fetched together during Feed updates within a certain time period.*/
export interface FeedChunk {
	feeds: Map<string, FeedDocument>;
	tid: NodeJS.Timeout | null;
	timestamp: Date | null;
}

async function updateBooruFeeds(feedChunk: FeedChunk): Promise<void> {
	const booru = getMainBooruClient();
	const startMs = Date.now();
	debug(`Received a request to update Boorus at ${new Date(startMs)}.`);

	try {
		debug('About to update Boorus.');
		await processFeeds(booru, feedChunk).catch(console.error);
	} catch (err) {
		const now = new Date(Date.now());
		const unixNow = getUnixTime(now);

		auditError(err, {
			brief: 'Error crítico al procesar Feeds',
			details: `<t:${unixNow}:F> <t:${unixNow}:R>`,
			ping: true,
		});

		error(err, 'Feed update crash:', now);
	}

	const delayMs = Date.now() - startMs;
	info(`Concluded a request to update Boorus in ${delayMs}ms (${delayMs / 1000}s).`);

	const nextMs = Math.max(10_000, FEED_UPDATE_INTERVAL - delayMs);
	setTimeout(updateBooruFeeds, nextMs, feedChunk);
	debug(`Next update request should have been programmed at ${new Date(Date.now() + nextMs)}.`);

	auditAction('Feeds procesados', {
		name: 'Feeds',
		value: `${feedChunk.feeds.size}`,
		inline: true,
	});
}

async function processFeeds(booru: BooruClient, feedChunk: FeedChunk) {
	if (client == null) throw new ClientNotFoundError();

	const feeds = [...feedChunk.feeds.values()];
	const bulkOps: AnyBulkWriteOperation<FeedSchemaType>[] = [];

	const guildGroups = new Map<Snowflake, FeedDocument[]>();
	for (const feed of feeds) {
		if (!guildGroups.has(feed.guildId)) guildGroups.set(feed.guildId, []);
		guildGroups.get(feed.guildId)?.push(feed);
	}

	for (const guildId of guildGroups.keys()) {
		const guild = client.guilds.cache.get(guildId);
		if (guild) await fetchGuildMembers(guild);
	}

	await Promise.all(
		feeds.map(async (feed) => {
			debug(`Processing Feed #${feed.channelId}`);

			if (client == null) throw new ClientNotFoundError();

			const guild = client.guilds.cache.get(feed.guildId);
			if (!guild) return;

			const channel = guild.channels.cache.get(feed.channelId) as
				| GuildTextBasedChannel
				| undefined;
			if (!channel) return;

			debug(
				`Identified Feed #${feed.channelId} as belonging to channel "#${channel.name}" in guild "${guild.name}" (${guild.id})`,
			);

			const booruFeed = new BooruFeed(booru, feed.guildId, feed.channelId, feed.searchTags, {
				lastFetchedAt: feed.lastFetchedAt,
				faults: feed.faults,
			});

			if (!booruFeed.isRunning) return;
			debug(`Feed #${feed.channelId} is running.`);

			if (!booruFeed.isProcessable) return;
			debug(`Feed #${feed.channelId} is processable.`);

			const { success, posts, newPosts } = await booruFeed.fetchPosts();
			debug(
				`Feed #${feed.channelId} tried to fetch posts and was ${success ? 'SUCCESSFUL' : 'UNSUCCESSFUL'}.`,
			);

			if (!success) return;
			debug(
				`Feed #${feed.channelId} retrieved ${posts.length} posts, of which ${newPosts.length} were new.`,
			);

			if (!posts.length) {
				debug(
					`Because, no posts were retrieved for Feed #${feed.channelId}, it's processing will conclude as FAULTY for now.`,
				);
				const write = booruFeed.addFault();
				if (write) bulkOps.push(write);
				return;
			}

			const feedSubscriptions: Suscription[] = [];

			debug(`Preparing candidate user Feed tag subscriptions for Feed #${feed.channelId}.`);
			for (const [userId, feedMap] of feedTagSubscriptionsCache) {
				const tags = feedMap.get(feed.channelId);
				if (tags) feedSubscriptions.push({ userId, followedTags: tags });
			}

			let faultedDuringSend = false;

			debug(`Feed #${feed.channelId} is about to send Booru posts to Discord.`);
			for (const post of newPosts) {
				try {
					const container = await formatBooruPostMessage(booru, post, booruFeed);

					const sent = await channel.send({
						flags: MessageFlags.IsComponentsV2,
						components: [container],
					});

					const members = guild.members.cache;
					await notifyUsers(post, sent, members, feedSubscriptions);
				} catch (err) {
					faultedDuringSend = true;
					warn(`Error sending post ${post.id} in ${channel.name}`);
					error(err);

					auditError(err, {
						brief: 'Error enviando post de Feed',
						details: `Post ${post.id} in ${channel.id}`,
					});
				}
			}

			debug(
				`Feed #${feed.channelId} ${faultedDuringSend ? 'FAILED TO SEND' : 'SUCCESSFULLY SENT'} posts to Discord.`,
			);

			if (faultedDuringSend) {
				const write = booruFeed.addFault();
				if (write) bulkOps.push(write);
				return;
			} else bulkOps.push(booruFeed.reduceFaults());

			const update: Partial<FeedData> = {};

			if (booruFeed.faults > 0) update.faults = booruFeed.faults;
			update.lastFetchedAt = booruFeed.lastFetchedAt;

			bulkOps.push({
				updateOne: {
					filter: { channelId: feed.channelId },
					update: { $set: update },
				},
			});
		}),
	);

	debug.dir(bulkOps, { depth: null });

	if (bulkOps.length) {
		await FeedConfigModel.bulkWrite(bulkOps);
	}
}

function getNextBaseDelay(): number {
	const now = new Date();

	let delay =
		FEED_UPDATE_INTERVAL
		- (now.getMinutes() * 60e3 + now.getSeconds() * 1e3 + now.getMilliseconds());

	while (delay <= 0) delay += FEED_UPDATE_INTERVAL;

	delay += 30e3;
	return delay;
}

function getNextChunkDelay(
	feedBaseUpdateDelay: number,
	chunkIndex: number,
	feedChunks: FeedChunk[],
) {
	const chunkCount = feedChunks.length;
	return feedBaseUpdateDelay + (FEED_UPDATE_INTERVAL * chunkIndex) / chunkCount;
}

export async function setupFeedUpdateStack() {
	const feeds = await FeedConfigModel.find({});

	const shortestUpdateDelayMs = rebuildFeedChunks(feeds);
	const feedCount = feeds.length;
	const feedChunks = globalConfigs.feedChunks;
	const chunkCount = feedChunks.length;

	if (!shortestUpdateDelayMs) {
		const err = new Error("Couldn't set up Feed chunks.");
		fatal(err);
		throw err;
	}

	debug.dir({ feedCount, chunkCount, feedChunks, shortestUpdateDelayMs }, { depth: null });

	auditAction(
		'Se prepararon Feeds',
		{
			name: 'Primer Envío',
			value: `<t:${Math.floor((Date.now() + shortestUpdateDelayMs) * 0.001)}:R>`,
			inline: true,
		},
		{ name: 'Intervalo Base', value: `${FEED_UPDATE_INTERVAL / 60e3} minutos`, inline: true },
		{
			name: 'Subdivisiones',
			value: `${chunkCount}\n-# ${feedCount} Feeds en total`,
			inline: true,
		},
	);
}

function rebuildFeedChunks(feeds: Iterable<FeedDocument>) {
	const feedMap = new Map<string, FeedDocument>();

	for (const feed of feeds) feedMap.set(feed.channelId, feed);

	const feedChunks = paginateFeeds(feedMap, FEED_CHUNK_MAX_SIZE);

	const feedUpdateStart = getNextBaseDelay();
	let shortestUpdateDelayMs: number | undefined;

	feedChunks.forEach((feedChunk, i) => {
		const delay = getNextChunkDelay(feedUpdateStart, i, feedChunks);

		if (!shortestUpdateDelayMs || delay < shortestUpdateDelayMs) shortestUpdateDelayMs = delay;

		feedChunk.tid = setTimeout(updateBooruFeeds, delay, feedChunk);
		feedChunk.timestamp = new Date(Date.now() + delay);
	});

	globalConfigs.feedChunks = feedChunks;

	return shortestUpdateDelayMs;
}

function paginateFeeds(map: Map<string, FeedDocument>, size: number): FeedChunk[] {
	const entries = [...map.entries()];
	const result: FeedChunk[] = [];

	for (let i = 0; i < entries.length; i += size) {
		result.push({
			feeds: new Map(entries.slice(i, i + size)),
			tid: null,
			timestamp: null,
		});
	}

	return result;
}

/**
 * @description Añade la Guild actual a la cadena de actualización de Feeds si aún no está en ella
 * @returns La cantidad de milisegundos que faltan para actualizar el Feed añadido por primera vez, ó -1 si no se pudo agregar
 */
export function addFeedToUpdateStack(feed: FeedDocument): number {
	const feedChunks = globalConfigs.feedChunks;

	if (feedChunks.some((feedChunk) => feedChunk.feeds.has(feed.channelId))) return 0;

	const lastChunk = feedChunks[feedChunks.length - 1];
	const feedUpdateStart = getNextBaseDelay();
	let shortestUpdateDelayMs: number | undefined;

	if (lastChunk.feeds.size < FEED_CHUNK_MAX_SIZE) {
		lastChunk.feeds.set(feed.channelId, feed);
		shortestUpdateDelayMs = +(lastChunk.timestamp ?? 0) - Date.now();
	} else {
		const newChunk: FeedChunk = {
			feeds: new Map([[feed.channelId, feed]]),
			tid: null,
			timestamp: null,
		};
		const delay = getNextChunkDelay(feedUpdateStart, feedChunks.length - 1, feedChunks);

		if (!shortestUpdateDelayMs || delay < shortestUpdateDelayMs) shortestUpdateDelayMs = delay;

		newChunk.tid = setTimeout(updateBooruFeeds, delay, newChunk);
		newChunk.timestamp = new Date(Date.now() + delay);
		feedChunks.push(newChunk);
	}

	auditAction(`Canal ${feed.channelId} incorporado a Feeds`);
	return shortestUpdateDelayMs;
}

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

	if (!feedTagSubscriptionsCache.has(userId)) feedTagSubscriptionsCache.set(userId, new Map());

	const userMap = feedTagSubscriptionsCache.get(userId) as Map<string, string[]>;

	if (!newTags.length) {
		userMap.delete(channelId);
		if (!userMap.size) feedTagSubscriptionsCache.delete(userId);
		return;
	}

	userMap.set(channelId, newTags);
}

export interface FeedOptions {
	lastFetchedAt?: Date | null;
	faults?: number | null;
}

export class BooruFeed {
	readonly booru: BooruClient;
	readonly tags: string;
	readonly channel: GuildTextBasedChannel | null;
	readonly guildId: string;
	readonly channelId: string;

	#lastFetchedAt: Date;
	#faults: number;

	constructor(
		booru: BooruClient,
		guildId: string,
		channelId: string,
		tags: string,
		options?: FeedOptions,
	) {
		if (client == null) throw new ClientNotFoundError();
		const guild = client.guilds.cache.get(guildId);
		const channel = guild?.channels.cache.get(channelId);

		this.booru = booru;
		this.guildId = guildId;
		this.channelId = channelId;
		this.channel = channel?.isTextBased() ? channel : null;
		this.tags = tags;

		this.#lastFetchedAt =
			options?.lastFetchedAt ?? new Date(Date.now() - FEED_UPDATE_INTERVAL / 2);

		this.#faults = options?.faults ?? 0;
	}

	get isProcessable() {
		return !!this.channel && !!this.tags;
	}

	get isRunning() {
		return this.#faults < 10;
	}

	get lastFetchedAt() {
		return this.#lastFetchedAt;
	}

	get faults() {
		return this.#faults;
	}

	get allowNSFW() {
		return this.channel ? isNSFWChannel(this.channel) : false;
	}

	async fetchPosts() {
		try {
			const fetched = await this.booru.search(this.tags, {
				limit: FEED_UPDATE_MAX_POST_COUNT,
			});

			if (!fetched.length) return { success: true, posts: [], newPosts: [] };

			const last = new Date(this.#lastFetchedAt);

			const newPosts = fetched.filter((p) => p.createdAt > last);

			this.#lastFetchedAt = fetched[0].createdAt;

			return { success: true, posts: fetched, newPosts };
		} catch (err) {
			console.error(err);
			return { success: false, posts: [], newPosts: [] };
		}
	}

	addFault(): AnyBulkWriteOperation<FeedSchemaType> | undefined {
		if (this.#faults >= 10) return undefined;

		this.#faults++;

		return {
			updateOne: {
				filter: { channelId: this.channelId },
				update: { $set: { faults: this.#faults } },
			},
		};
	}

	reduceFaults(): AnyBulkWriteOperation<FeedSchemaType> {
		this.#faults = Math.max(0, this.#faults - 2);

		return {
			updateOne: {
				filter: { channelId: this.channelId },
				update: { $set: { faults: this.#faults, lastFetchedAt: this.#lastFetchedAt } },
			},
		};
	}
}
