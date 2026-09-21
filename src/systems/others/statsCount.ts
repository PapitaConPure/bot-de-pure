import type { AnyKeys, AnyObject } from 'mongoose';
import { ChannelStatsModel, StatsModel, type StatsSchemaType } from '@/models/stats';
import Logger from '@/utils/logs';

const { error } = Logger('WARN', 'Stats');

const UPDATE_INTERVAL = 5000;

const statUpdates = {
	read: 0,
	'commands.succeeded': 0,
	'commands.failed': 0,
} satisfies AnyKeys<StatsSchemaType> & AnyObject;

let ongoingFlush: Promise<void> | null = null;

export function countGlobalStat(update: keyof typeof statUpdates, amount = 1) {
	statUpdates[update] += amount;
}

//TODO: buffer this one too
export async function countChannelStat(
	guildId: string,
	channelId: string,
	userId: string,
): Promise<void> {
	const channelQuery = { guildId, channelId };
	const channelStats =
		(await ChannelStatsModel.findOne(channelQuery)) || new ChannelStatsModel(channelQuery);
	channelStats.cnt++;
	channelStats.sub.set(userId, (channelStats.sub.get(userId) ?? 0) + 1);
	await channelStats.save();
}

export async function flushStats() {
	if (ongoingFlush) return ongoingFlush;

	const innerFlush = async () => {
		const updates = Object.fromEntries(
			Object.entries(statUpdates).filter(([, value]) => value !== 0),
		);

		if (!Object.keys(updates).length) return;

		for (const key of Object.keys(updates) as (keyof typeof statUpdates)[])
			statUpdates[key] -= updates[key];

		try {
			await StatsModel.updateOne({}, { $inc: updates }, { upsert: false });
		} catch (error) {
			//Retry these next time
			for (const key of Object.keys(updates) as (keyof typeof statUpdates)[])
				statUpdates[key] += updates[key];

			throw error;
		}
	};

	ongoingFlush = innerFlush().finally(() => {
		ongoingFlush = null;
	});

	return ongoingFlush;
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
