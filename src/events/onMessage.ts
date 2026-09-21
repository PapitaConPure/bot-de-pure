import { addHours } from 'date-fns';
import type { Guild, Message } from 'discord.js';
import { ContainerBuilder, MessageFlags } from 'discord.js';
import { Command, CommandOptionSolver, type CommandOptions } from '@/commands/commons';
import puré from '@/core/puréRegistry';
import type { PrefixPair } from '@/data/globalProps';
import { tenshiAltColor, tenshiColor } from '@/data/globalProps';
import unknownCommandReplies from '@/data/unknownCommandReplies.json';
import { Translator } from '@/i18n/index';
import { ChannelStatsModel } from '@/models/stats';
import UserConfigModel from '@/models/userconfigs';
import { gelbooruConverter } from '@/systems/converters/boorutato';
import { mergeConverterPayloads, processConverter } from '@/systems/converters/pipeline';
import { twitterConverter } from '@/systems/converters/pureet';
import { pixivConverter } from '@/systems/converters/purepix';
import { instagramConverter } from '@/systems/converters/purestagram';
import { auditRequest } from '@/systems/others/auditor';
import globalGuildFunctions from '@/systems/others/guildFunctions';
import { addMessageCascade } from '@/systems/others/messageCascades';
import { countStat } from '@/systems/others/statsCount';
import type { ValuesOf } from '@/types/util';
import {
	findFirstCommandExclusion,
	generateCommandExceptionEmbed,
	handleAndAuditError,
} from '@/utils/cmdExceptions';
import { channelIsBlocked, suppressEmbedsAsSoonAsPossible } from '@/utils/discord';
import { addAgentMessageOwner, updateAgentMessageOwners } from '@/utils/discordagent';
import Logger from '@/utils/logs';
import { edlDistance } from '@/utils/misc';
import { p_pure } from '@/utils/prefixes';
import { rand } from '@/utils/random';
import { fetchUserCache, type UserCache } from '@/utils/usercache';

const { error } = Logger('WARN', 'Message');

const CommandResults = {
	VOID: 0,
	SUCCEEDED: 1,
	FAILED: 2,
} as const satisfies Record<string, number>;

export type CommandResult = ValuesOf<typeof CommandResults>;

export async function onMessage(message: Message) {
	if (!message.inGuild()) return;

	const { author, channel, guild } = message;

	if (author.bot || channelIsBlocked(channel)) return;

	const userCache = await fetchUserCache(author);

	if (userCache.banned) return;

	await processGuildPlugins(message, userCache);

	countStat('read');
	updateChannelMessageCounter(guild.id, channel.id, author.id);

	const commandResult = await processCommand(message);
	switch (commandResult) {
		case CommandResults.SUCCEEDED:
			countStat('commands.succeeded');
			break;
		case CommandResults.FAILED:
			countStat('commands.failed');
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

async function processGuildPlugins(message: Message<true>, userCache: UserCache) {
	const guildFunctions = globalGuildFunctions[message.guild.id];

	if (!guildFunctions) return;

	return Promise.all(guildFunctions.map((fgf) => fgf(message, userCache))).catch((error) =>
		handleAndAuditError(error, message, {
			brief: 'Ocurrió un problema al ejecutar una respuesta rápida',
			details: message.content ? `"${message.content}"` : 'Mensaje sin contenido',
		}),
	);
}

async function updateChannelMessageCounter(
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

async function processCommand(message: Message<true>): Promise<CommandResult> {
	const { content, guildId } = message;
	const ppure = p_pure(guildId);

	if (!content.toLowerCase().match(ppure.regex)) return CommandResults.VOID;

	auditRequest(message);

	const args = content.replace(ppure.regex, '').split(/[\n ]+/);
	const commandName = args.shift()?.toLowerCase();

	if (!commandName) {
		const translator = await Translator.from(message.author);
		message.reply(translator.getText('invalidEmptyCommandName'));
		return CommandResults.VOID;
	}

	const command =
		puré.commands.get(commandName)
		|| puré.commands.find((cmd) => cmd.aliases?.includes(commandName));

	if (!command) return handleInvalidCommand(message, commandName, ppure);

	const rawArgs = content.slice(content.indexOf(commandName) + commandName.length).trim();
	try {
		await handleMessageCommand(message, command, args, rawArgs, `${ppure.raw}${commandName}`);
		return CommandResults.SUCCEEDED;
	} catch (error) {
		handleMessageCommandError(error, message, commandName, args);
		return CommandResults.FAILED;
	}
}

async function handleInvalidCommand(
	message: Message<true>,
	commandName: string,
	prefixPair: PrefixPair,
): Promise<CommandResult> {
	const { text, imageUrl } = unknownCommandReplies[rand(unknownCommandReplies.length)];
	const processedText = text.replaceAll('%COMMAND', commandName);

	async function replyAndDelete() {
		try {
			const notice = await message.reply({
				content: processedText,
			});
			setTimeout(() => notice?.delete().catch(() => undefined), 6000);
		} catch (err) {
			error(err);
		}

		return CommandResults.VOID;
	}

	if (commandName.length < 2) return replyAndDelete();

	const allowedGuesses = puré.commands.filter((cmd) => !cmd.flags.any('OUTDATED', 'MAINTENANCE'));
	const foundList: { command: Command<CommandOptions | undefined>; distance: number }[] = [];
	for (const [cmn, cmd] of allowedGuesses) {
		const distances = [cmn, ...(cmd.aliases?.filter((a) => a.length > 1) ?? [])].map((c) => ({
			n: c,
			d: edlDistance(commandName, c),
		}));
		const lowestDistance = Math.min(...distances.map((d) => d.d));
		if (lowestDistance < 3) foundList.push({ command: cmd, distance: lowestDistance });
	}

	const translator = await Translator.from(message.author.id);

	const suggestions = [
		...new Map(
			foundList.map((found) => [found.command.localizedNames[translator.locale], found]),
		),
	]
		.map(([, found]) => found)
		.sort((a, b) => a.distance - b.distance)
		.slice(0, 5);

	if (!suggestions.length) return replyAndDelete();

	const mockEmbed = new ContainerBuilder()
		.setAccentColor(tenshiColor)
		.addSectionComponents((section) =>
			section
				.addTextDisplayComponents((textDisplay) => textDisplay.setContent(processedText))
				.setThumbnailAccessory((thumbnail) => thumbnail.setURL(imageUrl)),
		);

	const suggestionEmbed = new ContainerBuilder()
		.setAccentColor(tenshiAltColor)
		.addTextDisplayComponents(
			(textDisplay) => textDisplay.setContent(`### -# Comandos similares a "${commandName}"`),
			(textDisplay) =>
				textDisplay.setContent(
					suggestions
						.map(
							(found) =>
								`* ${prefixPair.raw}${found.command.localizedNames[translator.locale]}`,
						)
						.join('\n'),
				),
			(textDisplay) => textDisplay.setContent('-# Basado en nombres y alias de comando'),
		);

	message.reply({
		flags: MessageFlags.IsComponentsV2,
		components: [mockEmbed, suggestionEmbed],
	});

	return CommandResults.VOID;
}

async function handleMessageCommand(
	message: Message<true>,
	command: Command<CommandOptions | undefined>,
	args: string[],
	rawArgs?: string,
	requestString?: string,
): Promise<unknown> {
	const satisfiesPermissions = await handleCommandPermissions(message, command, requestString);
	if (!satisfiesPermissions) return;

	const satisfiesExceptions = await handleMessageCommandExclusions(
		message,
		command,
		requestString,
	);
	if (!satisfiesExceptions) return;

	const request = Command.requestize(message);

	if (command.hasOptions()) {
		const solver = new CommandOptionSolver(request, args, command.options, rawArgs);
		await command.execute(request, solver, rawArgs);
	} else if (command.hasNoOptions() /*Inferencia*/) {
		await command.execute(request);
	}
}

async function handleCommandPermissions(
	message: Message<true>,
	command: Command<CommandOptions | undefined>,
	requestString?: string,
): Promise<boolean> {
	if (!command.permissions) return true;

	if (!message.member || !command.permissions.isAllowedIn(message.member, message.channel)) {
		if (!requestString) return false;

		const translator = await Translator.from(message.author);
		await message.channel.send({
			embeds: [
				generateCommandExceptionEmbed(
					{
						title: translator.getText('missingMemberChannelPermissionsTitle'),
						desc: translator.getText('missingMemberChannelPermissionsDescription'),
					},
					{ cmdString: requestString },
				).addFields({
					name: translator.getText('missingMemberChannelPermissionsFullRequisitesName'),
					value: command.permissions.matrix
						.map(
							(requisite, n) =>
								`${n + 1}. ${requisite.map((p) => `\`${p}\``).join(' **o** ')}`,
						)
						.join('\n'),
				}),
			],
		});

		return false;
	}

	if (!command.permissions.amAllowedIn(message.channel)) {
		if (!requestString) return false;

		const translator = await Translator.from(message.member);
		message.channel.send({
			embeds: [
				generateCommandExceptionEmbed(
					{
						title: translator.getText('missingMemberChannelPermissionsTitle'),
						desc: translator.getText('missingClientChannelPermissionsDescription'),
					},
					{ cmdString: requestString },
				).addFields({
					name: translator.getText('missingMemberChannelPermissionsFullRequisitesName'),
					value: command.permissions.matrix
						.map(
							(requisite, n) =>
								`${n + 1}. ${requisite.map((p) => `\`${p}\``).join(' **o** ')}`,
						)
						.join('\n'),
				}),
			],
		});

		return false;
	}

	return true;
}

async function handleMessageCommandExclusions(
	message: Message<true>,
	command: Command<CommandOptions | undefined>,
	requestString?: string,
): Promise<boolean> {
	const exception = await findFirstCommandExclusion(command, message);

	if (!exception) return true;

	if (requestString)
		message.channel.send({
			embeds: [generateCommandExceptionEmbed(exception, { cmdString: requestString })],
		});

	return false;
}

function handleMessageCommandError(
	error: Error,
	message: Message<true>,
	commandName: string,
	args: string[],
): CommandResult {
	const isPermissionsError = handleAndAuditError(error, message, {
		details: `"${message.content?.slice(0, 699)}"\n[${commandName} :: ${args}]`,
	});
	return isPermissionsError ? CommandResults.VOID : CommandResults.FAILED;
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
