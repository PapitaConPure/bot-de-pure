//#region Carga de módulos necesarios
const { puré } = require('../commandInit.js');
const Discord = require('discord.js');
const { CommandManager, CommandOptionSolver } = require('../commands/Commons/commands.js');

const { Stats, ChannelStats } = require('../localdata/models/stats.js');
const { p_pure } = require('../localdata/customization/prefixes.js');

const { updateAgentMessageOwners } = require('../systems/agents/discordagent.js');
const { channelIsBlocked, rand, edlDistance, isUsageBanned } = require('../func.js');
const globalGuildFunctions = require('../localdata/customization/guildFunctions.js');
const { auditRequest } = require('../systems/others/auditor.js');
const { findFirstException, handleAndAuditError, generateExceptionEmbed } = require('../localdata/cmdExceptions.js');
const { sendPixivPostsAsWebhook } = require('../systems/agents/purepix.js');
const { tenshiColor } = require('../localdata/config.json');
const UserConfigs = require('../localdata/models/userconfigs.js');
const { sendTweetsAsWebhook } = require('../systems/agents/pureet.js');
const { Translator } = require('../internationalization.js');
const { fetchUserCache } = require('../usercache.js');
//#endregion

/**
 * 
 * @param {String} guildId 
 * @param {String} channelId 
 * @param {String} userId 
 */
async function updateChannelMessageCounter(guildId, channelId, userId) {
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
 * @param {Discord.Client} client
 * @param {String} commandName
 * @param {import('../localdata/customization/prefixes.js').PrefixPair} prefixPair
 */
async function handleInvalidCommand(message, client, commandName, prefixPair) {
	const replies = require('./unknownCommandReplies.json');
	
	const selectedReply = replies[rand(replies.length)];
	async function replyAndDelete() {
		const content = selectedReply.text.replace('{commandName}', commandName);
		const notice = await message.reply({ content }).catch(() => undefined);
		return setTimeout(() => notice?.delete().catch(_ => undefined), 6000);
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
	return message.reply({ embeds: [ mockEmbed, suggestionEmbed ] });
}

/**
 * @param {Discord.Message<true>} message
 * @param {CommandManager} command
 * @param {import('../localdata/models/stats.js').StatsDocument} stats
 * @param {Array<String>} args
 * @param {String} [rawArgs]
 * @param {String} [exceptionString]
 */
async function handleMessageCommand(message, command, stats, args, rawArgs, exceptionString) {
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

	const complex = CommandManager.requestize(message);
	if(command.experimental) {
		const solver = new CommandOptionSolver(complex, args, command.options, rawArgs);
		// @ts-expect-error
		await /**@type {import('../commands/Commons/cmdBuilder.js').ExperimentalExecuteFunction}*/(command.execute)(complex, solver, rawArgs);
	} else
		await command.execute(complex, args, false, rawArgs);
	stats.commands.succeeded++;
}

/**
 * @param {Error} error
 * @param {Discord.Message<true>} message
 * @param {import('../localdata/models/stats.js').StatsDocument} stats
 * @param {String} commandName
 * @param {Array<String>} args
 */
function handleMessageCommandError(error, message, stats, commandName, args) {
	const isPermissionsError = handleAndAuditError(error, message, { details: `"${message.content?.slice(0, 699)}"\n[${commandName} :: ${args}]` });
	if(!isPermissionsError)
		stats.commands.failed++;
}

/**
 * @param {Discord.Message<true>} message
 * @param {Discord.Client} client
 * @param {import('../localdata/models/stats.js').StatsDocument} stats
 */
async function checkEmoteCommand(message, client, stats) {
	const { content } = message;
	const words = content.split(/[\n ]+/);
	const emoteCommandIndex = words.findIndex(word => word.startsWith('&'));
	if(emoteCommandIndex === -1) return;

	auditRequest(message);
	const args = words.slice(emoteCommandIndex + 1);
	const commandName = words[emoteCommandIndex].toLowerCase().slice(1);
	const command = puré.emotes.get(commandName) || puré.emotes.find(cmd => cmd.aliases?.includes(commandName));
	if(!command) return;

	await handleMessageCommand(message, command, stats, args)
	.catch(error => handleMessageCommandError(error, message, stats, commandName, args));
	stats.markModified('commands');
}

/**
 * @param {Discord.Message<true>} message
 * @param {Discord.Client} client
 * @param {import('../localdata/models/stats.js').StatsDocument} stats
 */
async function checkCommand(message, client, stats) {
	const { content, guildId } = message;
	const ppure = p_pure(guildId);

	if(!content.toLowerCase().match(ppure.regex))
		return checkEmoteCommand(message, client, stats);

	auditRequest(message);

	const args = content.replace(ppure.regex, '').split(/[\n ]+/); //Argumentos ingresados
	let commandName = args.shift().toLowerCase(); //Comando ingresado
	let command = puré.commands.get(commandName) || puré.commands.find(cmd => cmd.aliases?.includes(commandName));
	
	if(!command)
		return handleInvalidCommand(message, client, commandName, ppure);
	//#endregion

	const rawArgs = content.slice(content.indexOf(commandName) + commandName.length).trim();
	await handleMessageCommand(message, command, stats, args, rawArgs, `${ppure.raw}${commandName}`)
	.catch(error => handleMessageCommandError(error, message, stats, commandName, args));
	stats.markModified('commands');
}

/**
 * @param {Discord.Guild} guild
 * @param {String} userId
 */
async function gainPRC(guild, userId) {
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
 * @param {Discord.Message} message
 * @param {Discord.Client} client
 */
async function onMessage(message, client) {
	if(!message.inGuild()) return;
	const { content, author, channel, guild } = message;
	if(channelIsBlocked(channel) || (await isUsageBanned(author))) return;

	//Respuestas rápidas
	const guildFunctions = globalGuildFunctions[guild.id];
	if(guildFunctions)
		await Promise.all(Object.values(guildFunctions).map(fgf => fgf(message)))
		.catch(error => handleAndAuditError(error, message, {
			brief: 'Ocurrió un problema al ejecutar una respuesta rápida',
			details: content ? `"${content}"` : 'Mensaje sin contenido'
		}));
	if(author.bot) return;

	gainPRC(guild, author.id);

	const userCache = await fetchUserCache(author.id);

	const results = await Promise.all([
		sendPixivPostsAsWebhook(message, userCache.convertPixiv).catch(console.error),
		sendTweetsAsWebhook(message, userCache.twitterPrefix).catch(console.error),
	]);

	if(results.includes(true) && message?.deletable)
		message.delete().catch(console.error);

	updateAgentMessageOwners().catch(console.error);
	
	//Estadísticas
	const stats = (await Stats.findOne({})) || new Stats({ since: Date.now() });
	stats.read++;
	updateChannelMessageCounter(guild.id, channel.id, author.id);

	//Leer comando
	checkCommand(message, client, stats);
	stats.save();

	//Ayuda para principiantes
	if(content.includes(`${client.user}`)) {
		const complex = CommandManager.requestize(message);
		return require('../commands/Pure/prefijo.js').execute(complex, []);
	}
}

module.exports = {
	onMessage,
}