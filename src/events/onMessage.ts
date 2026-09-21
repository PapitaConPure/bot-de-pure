import { addHours } from 'date-fns';
import type { Guild, Message } from 'discord.js';
import { Command, CommandOptionSolver, CommandResults, processCommand } from '@/commands/commons';
import UserConfigModel from '@/models/userconfigs';
import { gelbooruConverter } from '@/systems/converters/boorutato';
import { mergeConverterPayloads, processConverter } from '@/systems/converters/pipeline';
import { twitterConverter } from '@/systems/converters/pureet';
import { pixivConverter } from '@/systems/converters/purepix';
import { instagramConverter } from '@/systems/converters/purestagram';
import { processGuildPlugins } from '@/systems/others/guildFunctions';
import { addMessageCascade } from '@/systems/others/messageCascades';
import { countChannelStat, countGlobalStat } from '@/systems/others/statsCount';
import { channelIsBlocked, suppressEmbedsAsSoonAsPossible } from '@/utils/discord';
import { addAgentMessageOwner, updateAgentMessageOwners } from '@/utils/discordagent';
import Logger from '@/utils/logs';
import { fetchUserCache, type UserCache } from '@/utils/usercache';

const { error } = Logger('WARN', 'Message');

export async function onMessage(message: Message) {
	if (!message.inGuild()) return;

	const { author, channel, guild } = message;

	if (author.bot || channelIsBlocked(channel)) return;

	const userCache = await fetchUserCache(author);

	if (userCache.banned) return;

	await processGuildPlugins(message, userCache).then((results) =>
		results?.forEach((result) => {
			if (result.status !== 'rejected') return;
			error(result.reason);
		}),
	);

	countGlobalStat('read');
	countChannelStat(guild.id, channel.id, author.id);

	const commandResult = await processCommand(message);
	switch (commandResult) {
		case CommandResults.SUCCEEDED:
			countGlobalStat('commands.succeeded');
			break;
		case CommandResults.FAILED:
			countGlobalStat('commands.failed');
			break;
		case CommandResults.VOID:
			await processBeginnerHelp(message);
			break;
	}

	//Automatic tasks
	await Promise.allSettled([
		gainPRC(guild, author.id),
		updateAgentMessageOwners(),
		processLinkConverters(message, userCache),
	]);
}

async function gainPRC(guild: Guild, userId: string) {
	if (guild.memberCount < 100) return;

	const userConfigs =
		(await UserConfigModel.findOne({ userId })) || new UserConfigModel({ userId });

	const then = userConfigs.lastDateReceived;
	const today = new Date(Date.now());
	if (
		then.getDate() < today.getDate()
		|| then.getMonth() < today.getMonth()
		|| then.getFullYear() < today.getFullYear()
	) {
		userConfigs.reactionsReceivedToday = 0;
		userConfigs.highlightedToday = false;
		userConfigs.messagesToday = 0;
		userConfigs.lastDateReceived = today;
	}

	userConfigs.messagesToday++;
	userConfigs.prc += 1 / ((userConfigs.messagesToday + 260) / 300);

	return userConfigs.save();
}

async function processLinkConverters(message: Message<true>, userCache: UserCache) {
	const convertersPayload = await mergeConverterPayloads([
		processConverter(pixivConverter, message, userCache.pixivConverter),
		processConverter(twitterConverter, message, userCache.twitterPrefix),
		processConverter(gelbooruConverter, message, userCache.gelbooruConverter),
		processConverter(instagramConverter, message, userCache.instagramConverter),
	]);

	if (!convertersPayload.contentful) return;

	const { content, ...restOfPayload } = convertersPayload;
	const [contentSent, componentsSent] = await Promise.all([
		content ? message.reply({ content }) : undefined,
		restOfPayload.components?.length ? message.reply(restOfPayload) : undefined,
		suppressEmbedsAsSoonAsPossible(message),
	]);

	const expiresAt = addHours(message.createdAt, 4);

	if (contentSent != null)
		await Promise.all([
			addAgentMessageOwner(contentSent, message.author.id),
			addMessageCascade(message.id, contentSent.id, 'contentBased', expiresAt),
		]);

	if (componentsSent != null)
		await Promise.all([
			addAgentMessageOwner(componentsSent, message.author.id),
			addMessageCascade(message.id, componentsSent.id, 'componentsBased', expiresAt),
		]);
}

async function processBeginnerHelp(message: Message<true>) {
	const { content, client } = message;

	if (!content.includes(`${client.user}`)) return;

	const prefixModule = await import('@/commands/instances/prefijo');
	const prefixCommand = prefixModule instanceof Command ? prefixModule : prefixModule.default;
	const request = Command.requestize(message);
	const solver = new CommandOptionSolver(request, [], prefixCommand.options);
	return prefixCommand.execute(request, solver).catch(error);
}
