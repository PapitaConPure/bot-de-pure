const { puré } = require('../core/commandInit.js');
const Discord = require('discord.js');
const { Command, CommandOptionSolver } = require('../commands/Commons/commands.js');

const { Stats, ChannelStats } = require('../models/stats.js');
const { p_pure } = require('../utils/prefixes');

const { updateAgentMessageOwners, addAgentMessageOwner } = require('../systems/agents/discordagent');
const { channelIsBlocked, rand, edlDistance } = require('../func');
const globalGuildFunctions = require('../systems/others/guildFunctions');
const { auditRequest } = require('../systems/others/auditor');
const { findFirstException, handleAndAuditError, generateExceptionEmbed } = require('../utils/cmdExceptions');
const globalConfigs = require('../data/config.json');
const { tenshiColor } = globalConfigs;
const UserConfigs = require('../models/userconfigs').default;
const { sendConvertedPixivPosts } = require('../systems/agents/purepix');
const { sendConvertedTwitterPosts } = require('../systems/agents/pureet');
const { Translator } = require('../i18n');
const { fetchUserCache } = require('../utils/usercache');
const { addMessageCascade } = require('./onMessageDelete');
const Logger = require('../utils/logs').default;

const { error } = Logger('WARN', 'Message');

const CommandResults = /**@type {const}*/({
	VOID: 0,
	SUCCEEDED: 1,
	FAILED: 2,
});
/**@typedef {import('types').ValuesOf<typeof CommandResults>} CommandResult*/

/**
 * 
 * @param {Discord.Message<true>} message 
 * @returns 
 */
async function processGuildPlugins(message) {
	const guildFunctions = globalGuildFunctions[message.guild.id];

	if(!guildFunctions)
		return;

	return Promise.all(Object.values(guildFunctions).map(fgf => fgf(message)))
	.catch(error => handleAndAuditError(error, message, {
		brief: 'Ocurrió un problema al ejecutar una respuesta rápida',
		details: message.content ? `"${message.content}"` : 'Mensaje sin contenido'
	}));
}

/**
 * 
 * @param {string} guildId 
 * @param {string} channelId 
 * @param {string} userId 
 */
async function updateChannelMessageCounter(guildId, channelId, userId) {
	if(globalConfigs.noDataBase) return;

	const channelQuery = { guildId, channelId };
	const channelStats = (await ChannelStats.findOne(channelQuery)) || new ChannelStats(channelQuery);
	channelStats.cnt++;
	channelStats.sub[userId] ??= 0;
	channelStats.sub[userId] += 1;
	channelStats.markModified('sub');
	channelStats.save();
};

/**
 * @param {Discord.Message<true>} message
 * @param {String} commandName
 * @param {import('../utils/prefixes').PrefixPair} prefixPair
 * @returns {Promise<CommandResult>}
 */
async function handleInvalidCommand(message, commandName, prefixPair) {
	const replies = require('../data/unknownCommandReplies.json');
	
	const selectedReply = replies[rand(replies.length)];
	async function replyAndDelete() {
		const content = selectedReply.text.replace('{commandName}', commandName);
		const notice = await message.reply({ content }).catch(() => undefined);
		setTimeout(() => notice?.delete().catch(() => undefined), 6000);
		return CommandResults.VOID;
	}

	if(commandName.length < 2)
		return replyAndDelete();

	const allowedGuesses = puré.commands.filter(cmd => !cmd.flags.any('OUTDATED', 'MAINTENANCE'));
	const foundList = [];
	for(const [ cmn, cmd ] of allowedGuesses) {
		const lDistances = [ cmn, ...(cmd.aliases?.filter(a => a.length > 1) ?? []) ].map(c => ({ n: c, d: edlDistance(commandName, c) }));
		const minorDistance = Math.min(...(lDistances.map(d => d.d)));
		if(minorDistance < 3)
			foundList.push({ command: cmd, distance: minorDistance });
	}
	const suggestions = foundList.sort((a, b) => a.distance - b.distance).slice(0, 5);
	
	if(!suggestions.length)
		return replyAndDelete();
	
	const mockEmbed = new Discord.EmbedBuilder()
		.setColor(tenshiColor)
		.setDescription(selectedReply.text)
		.setImage(selectedReply.imageUrl);
	const suggestionEmbed = new Discord.EmbedBuilder()
		.setColor(0x5070bb)
		.setFooter({ text: 'Basado en nombres y alias de comando' })
		.addFields({
			name: `Comandos similares a "${commandName}"`,
			value: suggestions.map(found => `• ${prefixPair.raw}${found.command.name}`).join('\n'),
		});
	message.reply({ embeds: [ mockEmbed, suggestionEmbed ] });
	return CommandResults.VOID;
}

/**
 * @param {Discord.Message<true>} message
 * @param {Command} command
 * @param {Array<String>} args
 * @param {String} [rawArgs]
 * @param {String} [exceptionString]
 * @returns {Promise<*>}
 */
async function handleMessageCommand(message, command, args, rawArgs, exceptionString) {
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
	if(!command.legacy) {
		const optionSolver = new CommandOptionSolver(completeExtendedRequest, args, command.options, rawArgs);
		await command.execute(completeExtendedRequest, optionSolver, rawArgs);
	} else {
		// @ts-expect-error
		await command.execute(completeExtendedRequest, args, false, rawArgs);
	}
}

/**
 * @param {Error} error
 * @param {Discord.Message<true>} message
 * @param {String} commandName
 * @param {Array<String>} args
 * @returns {CommandResult}
 */
function handleMessageCommandError(error, message, commandName, args) {
	const isPermissionsError = handleAndAuditError(error, message, { details: `"${message.content?.slice(0, 699)}"\n[${commandName} :: ${args}]` });
	return isPermissionsError ? CommandResults.VOID : CommandResults.FAILED;
}

/**
 * @param {Discord.Message<true>} message
 * @returns {Promise<CommandResult>}
 */
async function checkEmoteCommand(message) {
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

/**
 * @param {Discord.Message<true>} message
 * @returns {Promise<CommandResult>}
 */
async function processCommand(message) {
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

/**
 * @param {Discord.Guild} guild
 * @param {String} userId
 */
async function gainPRC(guild, userId) {
	if(globalConfigs.noDataBase) return;
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

/**
 * 
 * @param {Discord.Message<true>} message 
 * @param {import('../utils/usercache').UserCache} userCache 
 */
async function processLinkConverters(message, userCache) {
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

/**
 * 
 * @param {Discord.Message<true>} message 
 * @returns 
 */
function processBeginnerHelp(message) {
	const { content, client } = message;

	if(!content.includes(`${client.user}`))
		return;

	const prefixCommand = require('../commands/Instances/prefijo.js');
	const request = Command.requestize(message);
	const solver = new CommandOptionSolver(request, [], prefixCommand.options);
	return prefixCommand.execute(request, solver).catch(error);
}

/**
 * @param {Discord.Message} message
 */
async function onMessage(message) {
	if(!message.inGuild()) return;

	const { author, channel, guild } = message;

	if(channelIsBlocked(channel)) return;
	
	const userCache = await fetchUserCache(author);

	if(userCache.banned) return;

	await processGuildPlugins(message);

	if(author.bot) return;
	
	const stats = (!globalConfigs.noDataBase && await Stats.findOne({})) || new Stats({ since: Date.now() });
	stats.read++;
	updateChannelMessageCounter(guild.id, channel.id, author.id);

	const commandResult = await processCommand(message);

	if(commandResult === CommandResults.VOID)
		processBeginnerHelp(message);

	//#region Trabajos automáticos
	Promise.allSettled([
		gainPRC(guild, author.id),
		updateAgentMessageOwners(),
		processLinkConverters(message, userCache),
	]);
	//#endregion

	commandResult === CommandResults.SUCCEEDED && stats.commands.succeeded++;
	commandResult === CommandResults.FAILED && stats.commands.failed++;

	if(globalConfigs.noDataBase)
		return;

	stats.markModified('commands');
	stats.save();
}

module.exports = {
	onMessage,
};
