import type { BitFieldResolvable, Guild, Message, MessageFlagsString } from 'discord.js';
import { ContainerBuilder, MessageFlags, MessageFlagsBitField } from 'discord.js';
import { Command, CommandOptionSolver, type CommandOptions } from '@/commands/commons';
import { channelIsBlocked, edlDistance, rand } from '@/func';
import { sendConvertedBooruPosts } from '@/systems/converters/boorutato';
import {
	findFirstException,
	generateExceptionEmbed,
	handleAndAuditError,
} from '@/utils/cmdExceptions';
import { addAgentMessageOwner, updateAgentMessageOwners } from '@/utils/discordagent';
import Logger from '@/utils/logs';
import { p_pure } from '@/utils/prefixes';
import { fetchUserCache, type UserCache } from '@/utils/usercache';
import puré from '../core/puréRegistry';
import type { PrefixPair } from '../data/globalProps';
import { tenshiAltColor, tenshiColor } from '../data/globalProps';
import unknownCommandReplies from '../data/unknownCommandReplies.json';
import { Translator } from '../i18n/index';
import { ChannelStatsModel, StatsModel } from '../models/stats';
import UserConfigModel from '../models/userconfigs';
import { sendConvertedTwitterPosts } from '../systems/converters/pureet';
import { sendConvertedPixivPosts } from '../systems/converters/purepix';
import { auditRequest } from '../systems/others/auditor';
import globalGuildFunctions from '../systems/others/guildFunctions';
import { addMessageCascade } from '../systems/others/messageCascades';
import type { ValuesOf } from '../types/util';

const { error } = Logger('WARN', 'Message');

const CommandResults = {
	VOID: 0,
	SUCCEEDED: 1,
	FAILED: 2,
} as const;

export type CommandResult = ValuesOf<typeof CommandResults>;

/**
 *
 * @param {Message<true>} message
 * @returns
 */
async function processGuildPlugins(message: Message<true>) {
	const guildFunctions = globalGuildFunctions[message.guild.id];

	if (!guildFunctions) return;

	return Promise.all(Object.values(guildFunctions).map((fgf) => fgf(message))).catch((error) =>
		handleAndAuditError(error, message, {
			brief: 'Ocurrió un problema al ejecutar una respuesta rápida',
			details: message.content ? `"${message.content}"` : 'Mensaje sin contenido',
		}),
	);
}

async function updateChannelMessageCounter(guildId: string, channelId: string, userId: string) {
	const channelQuery = { guildId, channelId };
	const channelStats =
		(await ChannelStatsModel.findOne(channelQuery)) || new ChannelStatsModel(channelQuery);
	channelStats.cnt++;
	channelStats.sub[userId] ??= 0;
	channelStats.sub[userId] += 1;
	channelStats.markModified('sub');
	channelStats.save();
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
	exceptionString?: string,
): Promise<unknown> {
	if (command.permissions) {
		if (!message.member || !command.permissions.isAllowedIn(message.member, message.channel)) {
			const translator = await Translator.from(message.author);
			if (!exceptionString) return;
			return message.channel.send({
				embeds: [
					generateExceptionEmbed(
						{
							title: translator.getText('missingMemberChannelPermissionsTitle'),
							desc: translator.getText('missingMemberChannelPermissionsDescription'),
						},
						{ cmdString: exceptionString },
					).addFields({
						name: translator.getText(
							'missingMemberChannelPermissionsFullRequisitesName',
						),
						value: command.permissions.matrix
							.map(
								(requisite, n) =>
									`${n + 1}. ${requisite.map((p) => `\`${p}\``).join(' **o** ')}`,
							)
							.join('\n'),
					}),
				],
			});
		}

		if (!command.permissions.amAllowedIn(message.channel)) {
			const translator = await Translator.from(message.member);
			if (!exceptionString) return;
			return message.channel.send({
				embeds: [
					generateExceptionEmbed(
						{
							title: translator.getText('missingMemberChannelPermissionsTitle'),
							desc: translator.getText('missingClientChannelPermissionsDescription'),
						},
						{ cmdString: exceptionString },
					).addFields({
						name: translator.getText(
							'missingMemberChannelPermissionsFullRequisitesName',
						),
						value: command.permissions.matrix
							.map(
								(requisite, n) =>
									`${n + 1}. ${requisite.map((p) => `\`${p}\``).join(' **o** ')}`,
							)
							.join('\n'),
					}),
				],
			});
		}
	}

	const exception = await findFirstException(command, message);
	if (exception)
		return (
			exceptionString
			&& message.channel.send({
				embeds: [generateExceptionEmbed(exception, { cmdString: exceptionString })],
			})
		);

	const request = Command.requestize(message);

	if (command.hasOptions()) {
		const solver = new CommandOptionSolver(request, args, command.options, rawArgs);
		await command.execute(request, solver, rawArgs);
	} else if (command.hasNoOptions() /*Inferencia*/) {
		await command.execute(request);
	}
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
	const converterPayloads = await Promise.all([
		sendConvertedPixivPosts(message, userCache.pixivConverter),
		sendConvertedTwitterPosts(message, userCache.twitterPrefix),
		sendConvertedBooruPosts(message, userCache.booruConverters),
	]);

	const contentfulPayloads = converterPayloads.filter((r) => r.contentful === true);

	if (!contentfulPayloads.length) return;

	const mergedFlags = contentfulPayloads
		.map((r) => r.flags)
		.filter((f) => f != null)
		.map((f) => new MessageFlagsBitField(+f))
		.reduce((pf, f) => pf.add(f), new MessageFlagsBitField(0));

	const messageResult = mergedFlags.has(MessageFlags.IsComponentsV2)
		? {
				flags:
					(mergedFlags as BitFieldResolvable<
						Extract<
							MessageFlagsString,
							'SuppressEmbeds' | 'SuppressNotifications' | 'IsComponentsV2'
						>,
						| MessageFlags.SuppressEmbeds
						| MessageFlags.SuppressNotifications
						| MessageFlags.IsComponentsV2
					>) || undefined,
				components:
					contentfulPayloads
						.map((r) => r.components)
						.filter((c) => c != null)
						.flat(1) || undefined,
			}
		: {
				content: `-# ${contentfulPayloads
					.map((r) => r.content)
					.filter((c) => c != null)
					.join(' ')}`,
			};

	const [sent] = await Promise.all([message.reply(messageResult), message.suppressEmbeds(true)]);

	setTimeout(() => {
		if (!message?.embeds) return;
		message.suppressEmbeds(true).catch(() => undefined);
	}, 3000);

	await Promise.all([
		addAgentMessageOwner(sent, message.author.id),
		addMessageCascade(message.id, sent.id, new Date(+message.createdAt + 4 * 60 * 60e3)),
	]);
}

async function processBeginnerHelp(message: Message<true>) {
	const { content, client } = message;

	if (!content.includes(`${client.user}`)) return;

	const prefixModule = await import('../commands/instances/prefijo');
	const prefixCommand = prefixModule instanceof Command ? prefixModule : prefixModule.default;
	const request = Command.requestize(message);
	const solver = new CommandOptionSolver(request, [], prefixCommand.options);
	return prefixCommand.execute(request, solver).catch(error);
}

export async function onMessage(message: Message) {
	if (!message.inGuild()) return;

	const { author, channel, guild } = message;

	if (channelIsBlocked(channel)) return;

	const userCache = await fetchUserCache(author);

	if (userCache?.banned) return;

	await processGuildPlugins(message);

	if (author.bot) return;

	const stats = (await StatsModel.findOne({})) || new StatsModel({ since: Date.now() });
	stats.read++;
	updateChannelMessageCounter(guild.id, channel.id, author.id);

	const commandResult = await processCommand(message);

	if (commandResult === CommandResults.VOID) await processBeginnerHelp(message);

	//#region Trabajos automáticos
	Promise.allSettled([
		gainPRC(guild, author.id),
		updateAgentMessageOwners(),
		userCache && processLinkConverters(message, userCache),
	]);
	//#endregion

	commandResult === CommandResults.SUCCEEDED && stats.commands.succeeded++;
	commandResult === CommandResults.FAILED && stats.commands.failed++;

	stats.markModified('commands');
	stats.save();
}
