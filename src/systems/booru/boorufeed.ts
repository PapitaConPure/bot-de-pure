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

const { debug, warn, error } = Logger('DEBUG', 'BooruFeed');

export interface FeedData extends PostFormatData {
	tags: string;
	lastFetchedAt?: Date;
	faults?: number;
}

/** Global cache for user feed tag subscriptions */
export const feedTagSuscriptionsCache: Map<Snowflake, Map<Snowflake, Array<string>>> = new Map();

/** Feed update configuration */
export const FEED_UPDATE_INTERVAL = minutesToMilliseconds(30);
export const FEED_UPDATE_MAX_POST_COUNT = 32;
export const FEED_BATCH_MAX_COUNT = 20;

export interface FeedChunk {
	feeds: Map<string, FeedDocument>;
	tid: NodeJS.Timeout | null;
	timestamp: Date | null;
}

async function updateBooruFeeds(feedChunk: FeedChunk): Promise<void> {
	const booru = getMainBooruClient();
	const startMs = Date.now();

	try {
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

	// reschedule same chunk
	setTimeout(updateBooruFeeds, FEED_UPDATE_INTERVAL - delayMs, feedChunk);

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
			if (client == null) throw new ClientNotFoundError();

			const guild = client.guilds.cache.get(feed.guildId);
			if (!guild) return;

			const channel = guild.channels.cache.get(feed.channelId) as
				| GuildTextBasedChannel
				| undefined;
			if (!channel) return;

			const booruFeed = new BooruFeed(booru, feed.guildId, feed.channelId, feed.searchTags, {
				lastFetchedAt: feed.lastFetchedAt,
				faults: feed.faults,
			});

			if (!booruFeed.isRunning) return;
			if (!booruFeed.isProcessable) return;

			const { success, posts, newPosts } = await booruFeed.fetchPosts();

			if (!success) return;

			if (!posts.length) {
				const write = booruFeed.addFault();
				if (write) bulkOps.push(write);
				return;
			}

			if (!newPosts.length) {
				//FIXME
				bulkOps.push(booruFeed.reduceFaults());
				return;
			}

			const feedSuscriptions: Suscription[] = [];

			for (const [userId, feedMap] of feedTagSuscriptionsCache) {
				const tags = feedMap.get(feed.channelId);
				if (tags) feedSuscriptions.push({ userId, followedTags: tags });
			}

			let faultedDuringSend = false;

			for (const post of newPosts) {
				try {
					const container = await formatBooruPostMessage(booru, post, booruFeed);

					const sent = await channel.send({
						flags: MessageFlags.IsComponentsV2,
						components: [container],
					});

					const members = guild.members.cache;
					await notifyUsers(post, sent, members, feedSuscriptions);
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

			if (faultedDuringSend) {
				const write = booruFeed.addFault();
				if (write) bulkOps.push(write);
				return;
			}

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

function getNextBaseUpdateStart(): number {
	const now = new Date();

	let delay =
		FEED_UPDATE_INTERVAL
		- (now.getMinutes() * 60e3 + now.getSeconds() * 1e3 + now.getMilliseconds());

	while (delay <= 0) delay += FEED_UPDATE_INTERVAL;

	delay += 30e3;
	return delay;
}

export async function setupFeedUpdateStack() {
	const feeds = await FeedConfigModel.find({});

	rebuildFeedChunks(feeds);

	auditAction('Feeds inicializados', {
		name: 'Feeds',
		value: `${feeds.length}`,
		inline: true,
	});
}

function rebuildFeedChunks(feeds: Iterable<FeedDocument>) {
	const feedMap = new Map<string, FeedDocument>();

	for (const feed of feeds) feedMap.set(feed.channelId, feed);

	const feedChunks = paginateFeeds(feedMap, FEED_BATCH_MAX_COUNT);

	const feedUpdateStart = getNextBaseUpdateStart();
	let shortestTime = 0;

	feedChunks.forEach((feedChunk, i) => {
		const delay = feedUpdateStart + FEED_UPDATE_INTERVAL * (i / feedChunks.length);

		if (!shortestTime || delay < shortestTime) shortestTime = delay;

		feedChunk.tid = setTimeout(updateBooruFeeds, delay, feedChunk);
		feedChunk.timestamp = new Date(Date.now() + delay);
	});

	globalConfigs.feedChunks = feedChunks;

	return shortestTime;
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

	const feeds = feedChunks.flatMap((feedChunk) => [...feedChunk.feeds.values()]);

	feeds.push(feed);

	const newUpdateDelay = rebuildFeedChunks(feeds);

	auditAction(`Canal ${feed.channelId} incorporado a Feeds`);
	return newUpdateDelay;
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

	if (!feedTagSuscriptionsCache.has(userId)) feedTagSuscriptionsCache.set(userId, new Map());

	const userMap = feedTagSuscriptionsCache.get(userId);

	if (newTags.length) {
		feedTagSuscriptionsCache.set(userId, new Map([[channelId, newTags]]));
		return;
	}

	if (!userMap) return;

	userMap.delete(channelId);
	if (!userMap.size) feedTagSuscriptionsCache.delete(userId);
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
