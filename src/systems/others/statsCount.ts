import type { AnyKeys, AnyObject } from 'mongoose';
import { ChannelStatsModel, StatsModel, type StatsSchemaType } from '@/models/stats';
import Logger from '@/utils/logs';

const { error } = Logger('WARN', 'Stats');

const UPDATE_INTERVAL = 5000;

const globalStatUpdates = {
	read: 0,
	'commands.succeeded': 0,
	'commands.failed': 0,
} satisfies AnyKeys<StatsSchemaType> & AnyObject;

interface ChannelStatUpdate {
	cnt: number;
	sub: Map<string, number>;
}

type ChannelStatUpdatesMap = Map<string, ChannelStatUpdate>;
type GuildStatUpdatesMap = Map<string, ChannelStatUpdatesMap>;

/**
 * guildId -> channelId -> { "cnt" -> number | "sub" -> userId -> number }
 *
 * This is actually the worst database schema ever but I can't be bothered to change it, hi.
 */
const guildStatUpdates: GuildStatUpdatesMap = new Map();

let ongoingFlush: Promise<void> | null = null;

export function countGlobalStat(update: keyof typeof globalStatUpdates): void {
	globalStatUpdates[update]++;
}

export function countChannelStat(guildId: string, channelId: string, userId: string): void {
	let guildUpdates = guildStatUpdates.get(guildId);

	if (guildUpdates == null) {
		guildUpdates = new Map();
		guildStatUpdates.set(guildId, guildUpdates);
	}

	let channelUpdates = guildUpdates.get(channelId);

	if (!channelUpdates) {
		channelUpdates = {
			cnt: 0,
			sub: new Map(),
		};
		guildUpdates.set(channelId, channelUpdates);
	}

	channelUpdates.cnt++;
	channelUpdates.sub.set(userId, (channelUpdates.sub.get(userId) ?? 0) + 1);
}

export async function flushStats(): Promise<void> {
	if (ongoingFlush) return ongoingFlush;

	const globalUpdates = Object.fromEntries(
		Object.entries(globalStatUpdates).filter(([, value]) => value !== 0),
	);

	for (const key of Object.keys(globalUpdates) as (keyof typeof globalStatUpdates)[])
		globalStatUpdates[key] -= globalUpdates[key];

	const guildUpdates = consumeGuildStatUpdates();

	if (!Object.keys(globalUpdates).length && !guildUpdates.size) return;

	const innerFlush = async () => {
		try {
			await Promise.all([
				Object.keys(globalUpdates).length
					? StatsModel.updateOne({}, { $inc: globalUpdates }, { upsert: false })
					: undefined,
				guildUpdates.size
					? ChannelStatsModel.bulkWrite(createChannelStatBulkOperations(guildUpdates))
					: undefined,
			]);
		} catch (err) {
			//Retry these next time
			for (const key of Object.keys(globalUpdates) as (keyof typeof globalStatUpdates)[])
				globalStatUpdates[key] += globalUpdates[key];

			for (const [guildId, guildUpdate] of guildUpdates) {
				let existingGuildUpdate = guildStatUpdates.get(guildId);

				if (!existingGuildUpdate) {
					existingGuildUpdate = new Map();
					guildStatUpdates.set(guildId, existingGuildUpdate);
				}

				for (const [channelId, channelUpdate] of guildUpdate) {
					let existingChannelUpdate = existingGuildUpdate.get(channelId);

					if (!existingChannelUpdate) {
						existingChannelUpdate = {
							cnt: 0,
							sub: new Map(),
						};
						existingGuildUpdate.set(channelId, existingChannelUpdate);
					}

					existingChannelUpdate.cnt += channelUpdate.cnt;

					for (const [userId, count] of channelUpdate.sub)
						existingChannelUpdate.sub.set(
							userId,
							(existingChannelUpdate.sub.get(userId) ?? 0) + count,
						);
				}
			}

			throw err;
		}
	};

	ongoingFlush = innerFlush().finally(() => {
		ongoingFlush = null;
	});

	return ongoingFlush;
}

function consumeGuildStatUpdates() {
	const snapshot: GuildStatUpdatesMap = new Map();

	for (const [guildId, guildUpdates] of guildStatUpdates) {
		const guildSnapshot: ChannelStatUpdatesMap = new Map();

		for (const [channelId, channelUpdate] of guildUpdates) {
			guildSnapshot.set(channelId, {
				cnt: channelUpdate.cnt,
				sub: new Map(channelUpdate.sub),
			});
		}

		snapshot.set(guildId, guildSnapshot);
	}

	guildStatUpdates.clear();

	return snapshot;
}

function createChannelStatBulkOperations(guildUpdates: GuildStatUpdatesMap) {
	return [...guildUpdates].flatMap(([guildId, guildUpdate]) =>
		[...guildUpdate].map(([channelId, channelUpdate]) => ({
			updateOne: {
				filter: { guildId, channelId },
				update: {
					$inc: {
						cnt: channelUpdate.cnt,
						...Object.fromEntries(
							[...channelUpdate.sub].map(([userId, count]) => [
								`sub.${userId}`,
								count,
							]),
						),
					},
				},
				upsert: true,
			},
		})),
	);
}

async function flushAndExit(code: number) {
	try {
		await flushStats();
	} catch (error) {
		error('Failed to flush stats before shutdown:', error);
	} finally {
		process.exit(code);
	}
}

const flushInterval = setInterval(() => {
	flushStats().catch(error);
}, UPDATE_INTERVAL);

flushInterval.unref();

process.once('SIGINT', () => flushAndExit(0));
process.once('SIGTERM', () => flushAndExit(0));
