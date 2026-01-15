import { puré } from '../core/commandInit';
import { ContainerBuilder, EmbedBuilder, Guild, Message, MessageFlags } from 'discord.js';
import { Command, CommandOptionSolver } from '../commands/Commons/index';

import { Stats, ChannelStats } from '../models/stats';
import { p_pure } from '../utils/prefixes';

import { updateAgentMessageOwners, addAgentMessageOwner } from '../systems/agents/discordagent';
import { channelIsBlocked, rand, edlDistance } from '../func';
import globalGuildFunctions from '../systems/others/guildFunctions';
import { auditRequest } from '../systems/others/auditor';
import { findFirstException, handleAndAuditError, generateExceptionEmbed } from '../utils/cmdExceptions';
import UserConfigs from '../models/userconfigs';
import { sendConvertedPixivPosts } from '../systems/agents/purepix';
import { sendConvertedTwitterPosts } from '../systems/agents/pureet';
import { Translator } from '../i18n/index';
import { fetchUserCache } from '../utils/usercache';
import { addMessageCascade } from '../systems/others/messageCascades';
import { noDataBase, PrefixPair, tenshiAltColor, tenshiColor } from '../data/globalProps';
import Logger from '../utils/logs';
import { ValuesOf } from 'types';

import unknownCommandReplies from '../data/unknownCommandReplies.json';

const { error } = Logger('WARN', 'Message');

const CommandResults = ({
	VOID: 0,
	SUCCEEDED: 1,
	FAILED: 2,
}) as const;

export type CommandResult = ValuesOf<typeof CommandResults>;

/**
 * 
 * @param {Message<true>} message 
 * @returns 
 */
async function processGuildPlugins(message: Message<true>) {
	const guildFunctions = globalGuildFunctions[message.guild.id];

	if(!guildFunctions)
		return;

	return Promise.all(Object.values(guildFunctions).map(fgf => fgf(message)))
	.catch(error => handleAndAuditError(error, message, {
		brief: 'Ocurrió un problema al ejecutar una respuesta rápida',
		details: message.content ? `"${message.content}"` : 'Mensaje sin contenido'
	}));
}

async function updateChannelMessageCounter(guildId: string, channelId: string, userId: string) {
	if(noDataBase) return;

	const channelQuery = { guildId, channelId };
	const channelStats = (await ChannelStats.findOne(channelQuery)) || new ChannelStats(channelQuery);
	channelStats.cnt++;
	channelStats.sub[userId] ??= 0;
	channelStats.sub[userId] += 1;
	channelStats.markModified('sub');
	channelStats.save();
};

async function handleInvalidCommand(message: Message<true>, commandName: string, prefixPair: PrefixPair): Promise<CommandResult> {
	const { text, imageUrl } = unknownCommandReplies[rand(unknownCommandReplies.length)];
	const processedText = text.replaceAll('%COMMAND', commandName);

	async function replyAndDelete() {
		try {
			const notice = await message.reply({
				content: processedText,
			});
			setTimeout(() => notice?.delete().catch(() => undefined), 6000);
		} finally {
			return CommandResults.VOID;
		}
	}

	if(commandName.length < 2)
		return replyAndDelete();

	const allowedGuesses = puré.commands.filter(cmd => !cmd.flags.any('OUTDATED', 'MAINTENANCE'));
	const foundList = [];
	for(const [ cmn, cmd ] of allowedGuesses) {
		const distances = [ cmn, ...(cmd.aliases?.filter(a => a.length > 1) ?? []) ].map(c => ({ n: c, d: edlDistance(commandName, c) }));
		const lowestDistance = Math.min(...(distances.map(d => d.d)));
		if(lowestDistance < 3)
			foundList.push({ command: cmd, distance: lowestDistance });
	}
	const suggestions = foundList.sort((a, b) => a.distance - b.distance).slice(0, 5);
	
	if(!suggestions.length)
		return replyAndDelete();
	
	const mockEmbed = new ContainerBuilder()
		.setAccentColor(tenshiColor)
		.addSectionComponents(section => 
			section
				.addTextDisplayComponents(textDisplay =>
					textDisplay.setContent(processedText)
				)
				.setThumbnailAccessory(thumbnail => 
					thumbnail.setURL(imageUrl)
				)
		);

	const suggestionEmbed = new ContainerBuilder()
		.setAccentColor(tenshiAltColor)
		.addTextDisplayComponents(
			textDisplay => textDisplay.setContent(`### -# Comandos similares a "${commandName}"`),
			textDisplay => textDisplay.setContent(
				suggestions.map(found => `* ${prefixPair.raw}${found.command.name}`).join('\n')
			),
			textDisplay => textDisplay.setContent('-# Basado en nombres y alias de comando'),
		);

	message.reply({
		flags: MessageFlags.IsComponentsV2,
		components: [ mockEmbed, suggestionEmbed ],
	});

	return CommandResults.VOID;
}

async function handleMessageCommand(message: Message<true>, command: Command, args: string[], rawArgs?: string, exceptionString?: string): Promise<any> {
	if(command.permissions) {
		if(!command.permissions.isAllowedIn(message.member, message.channel)) {
			const translator = await Translator.from(message.member);
			return exceptionString && message.channel.send({ embeds: [
				generateExceptionEmbed({
					title: translator.getText('missingMemberChannelPermissionsTitle'),
					desc: translator.getText('missingMemberChannelPermissionsDescription'),
				}, { cmdString: exceptionString })
				.addFields({
					name: translator.getText('missingMemberChannelPermissionsFullRequisitesName'),
					value: command.permissions.matrix
						.map((requisite, n) => `${n + 1}. ${requisite.map(p => `\`${p}\``).join(' **o** ')}`)
						.join('\n'),
				}),
			]});
		}
		
		if(!command.permissions.amAllowedIn(message.channel)) {
			const translator = await Translator.from(message.member);
			return exceptionString && message.channel.send({ embeds: [
				generateExceptionEmbed({
					title: translator.getText('missingMemberChannelPermissionsTitle'),
					desc: translator.getText('missingClientChannelPermissionsDescription'),
				}, { cmdString: exceptionString })
				.addFields({
					name: translator.getText('missingMemberChannelPermissionsFullRequisitesName'),
					value: command.permissions.matrix
						.map((requisite, n) => `${n + 1}. ${requisite.map(p => `\`${p}\``).join(' **o** ')}`)
						.join('\n'),
				}),
			]});
		}
	}

	const exception = await findFirstException(command, message);
	if(exception)
		return exceptionString && message.channel.send({ embeds: [ generateExceptionEmbed(exception, { cmdString: exceptionString }) ]});

	const completeExtendedRequest = Command.requestize(message);
	const optionSolver = new CommandOptionSolver(completeExtendedRequest, args, command.options, rawArgs);
	await command.execute(completeExtendedRequest, optionSolver, rawArgs);
}

function handleMessageCommandError(error: Error, message: Message<true>, commandName: string, args: string[]): CommandResult {
	const isPermissionsError = handleAndAuditError(error, message, { details: `"${message.content?.slice(0, 699)}"\n[${commandName} :: ${args}]` });
	return isPermissionsError ? CommandResults.VOID : CommandResults.FAILED;
}

async function checkEmoteCommand(message: Message<true>): Promise<CommandResult> {
	const { content } = message;

	const words = content.split(/[\n ]+/);
	const emoteCommandIndex = words.findIndex(word => word.startsWith('&'));
	if(emoteCommandIndex === -1)
		return CommandResults.VOID;

	auditRequest(message);
	
	const args = words.slice(emoteCommandIndex + 1);
	const commandName = words[emoteCommandIndex].toLowerCase().slice(1);
	const command = puré.emotes.get(commandName) || puré.emotes.find(cmd => cmd.aliases?.includes(commandName));
	if(!command)
		return CommandResults.VOID;

	try {
		return handleMessageCommand(message, command, args);
	} catch(error) {
		return handleMessageCommandError(error, message, commandName, args);
	}
}

async function processCommand(message: Message<true>): Promise<CommandResult> {
	const { content, guildId } = message;
	const ppure = p_pure(guildId);

	if(!content.toLowerCase().match(ppure.regex))
		return checkEmoteCommand(message);

	auditRequest(message);

	const args = content.replace(ppure.regex, '').split(/[\n ]+/); //Argumentos ingresados
	let commandName = args.shift().toLowerCase(); //Comando ingresado
	let command = puré.commands.get(commandName) || puré.commands.find(cmd => cmd.aliases?.includes(commandName));
	
	if(!command)
		return handleInvalidCommand(message, commandName, ppure);
	//#endregion

	const rawArgs = content.slice(content.indexOf(commandName) + commandName.length).trim();
	try {
		await handleMessageCommand(message, command, args, rawArgs, `${ppure.raw}${commandName}`);
		return CommandResults.SUCCEEDED;
	} catch(error) {
		handleMessageCommandError(error, message, commandName, args);
		return CommandResults.FAILED;
	}
}

async function gainPRC(guild: Guild, userId: string) {
	if(noDataBase) return;
	if(guild.memberCount < 100) return;

	const userConfigs = (await UserConfigs.findOne({ userId })) || new UserConfigs({ userId });

	const then = userConfigs.lastDateReceived;
	const today = new Date(Date.now());
	if(then.getDate() < today.getDate() || then.getMonth() < today.getMonth() || then.getFullYear() < today.getFullYear()) {
		userConfigs.reactionsReceivedToday = 0;
		userConfigs.highlightedToday = false;
		userConfigs.messagesToday = 0;
		userConfigs.lastDateReceived = today;
	}
	
	userConfigs.messagesToday++;
	userConfigs.prc += 1 / ((userConfigs.messagesToday + 260) / 300);
	
	return userConfigs.save();
}

async function processLinkConverters(message: Message<true>, userCache: import('../utils/usercache').UserCache) {
	const converterPayloads = await Promise.all([
		sendConvertedPixivPosts(message, userCache.pixivConverter),
		sendConvertedTwitterPosts(message, userCache.twitterPrefix),
	]);
	const contentfulPayloads = converterPayloads.filter(r => r.contentful === true);
	if(contentfulPayloads.length) {
		const messageResult = `-# ${contentfulPayloads.map(r => r.content).join(' ')}`;

		const [ sent ] = await Promise.all([
			message.reply(messageResult),
			message.suppressEmbeds(true),
		]);
		
		setTimeout(() => {
			if(!message?.embeds) return;
			message.suppressEmbeds(true).catch(() => undefined);
		}, 3000);
	
		await Promise.all([
			addAgentMessageOwner(sent, message.author.id),
			addMessageCascade(message.id, sent.id, new Date(+message.createdAt + 4 * 60 * 60e3)),
		]);
	}
}

async function processBeginnerHelp(message: Message<true>) {
	const { content, client } = message;

	if(!content.includes(`${client.user}`))
		return;

	const prefixModule = (await import('../commands/Instances/prefijo'));
	const prefixCommand = prefixModule instanceof Command ? prefixModule : prefixModule.default;
	const request = Command.requestize(message);
	const solver = new CommandOptionSolver(request, [], prefixCommand.options);
	return prefixCommand.execute(request, solver).catch(error);
}

export async function onMessage(message: Message) {
	if(!message.inGuild()) return;

	const { author, channel, guild } = message;

	if(channelIsBlocked(channel)) return;
	
	const userCache = await fetchUserCache(author);

	if(userCache.banned) return;

	await processGuildPlugins(message);

	if(author.bot) return;
	
	const stats = (!noDataBase && await Stats.findOne({})) || new Stats({ since: Date.now() });
	stats.read++;
	updateChannelMessageCounter(guild.id, channel.id, author.id);

	const commandResult = await processCommand(message);

	if(commandResult === CommandResults.VOID)
		await processBeginnerHelp(message);

	//#region Trabajos automáticos
	Promise.allSettled([
		gainPRC(guild, author.id),
		updateAgentMessageOwners(),
		processLinkConverters(message, userCache),
	]);
	//#endregion

	commandResult === CommandResults.SUCCEEDED && stats.commands.succeeded++;
	commandResult === CommandResults.FAILED && stats.commands.failed++;

	if(noDataBase)
		return;

	stats.markModified('commands');
	stats.save();
}
