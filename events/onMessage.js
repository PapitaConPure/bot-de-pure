//#region Carga de módulos necesarios
const Discord = require('discord.js');
const { CommandManager, CommandOptionSolver } = require('../commands/Commons/commands.js');

const { Stats, ChannelStats } = require('../localdata/models/stats.js');
const { p_pure } = require('../localdata/customization/prefixes.js');

const { channelIsBlocked, rand, edlDistance, isUsageBanned } = require('../func.js');
const globalGuildFunctions = require('../localdata/customization/guildFunctions.js');
const { auditRequest } = require('../systems/others/auditor.js');
const { findFirstException, handleAndAuditError, generateExceptionEmbed } = require('../localdata/cmdExceptions.js');
const { sendPixivPostsAsWebhook } = require('../systems/agents/purepix.js');
const { tenshiColor } = require('../localdata/config.json');
const UserConfigs = require('../localdata/models/userconfigs.js');
const { sendTweetsAsWebhook } = require('../systems/agents/pureet.js');
const { fetchUserCache } = require('../usercache.js');

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
        const notice = await message.reply({ content: selectedReply.text }).catch(() => undefined);
        return setTimeout(() => notice?.delete().catch(_ => undefined), 6000);
    }

    if(commandName.length < 2)
        return replyAndDelete();

    // @ts-ignore
    const allowedGuesses = client.ComandosPure.filter(cmd => !cmd.flags.any('OUTDATED', 'MAINTENANCE'));
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
    if(command.permissions && !command.permissions.isAllowed(message.member)) {
        return exceptionString && message.channel.send({ embeds: [
            generateExceptionEmbed({
                tag: undefined,
                isException: undefined,
                title: 'Permisos insuficientes',
                desc: 'Este comando requiere permisos para ejecutarse que no tienes actualmente',
            }, { cmdString: exceptionString })
            .addFields({
                name: 'Requisitos completos',
                value: command.permissions.matrix
                    .map((requisite, n) => `${n + 1}. ${requisite.map(p => `\`${p}\``).join(' **o** ')}`)
                    .join('\n')
            })
        ]});
    }

    const exception = await findFirstException(command, message);
    if(exception)
        return exceptionString && message.channel.send({ embeds: [ generateExceptionEmbed(exception, { cmdString: exceptionString }) ]});

    const complex = CommandManager.requestize(message);
    if(command.experimental) {
        const solver = new CommandOptionSolver(complex, args, command.options, rawArgs);
        // @ts-expect-error
        await command.execute(complex, solver);
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
    // @ts-ignore
    const command = client.EmotesPure.get(commandName) || client.EmotesPure.find(cmd => cmd.aliases?.includes(commandName));
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
    // @ts-ignore
    let command = client.ComandosPure.get(commandName) || client.ComandosPure.find(cmd => cmd.aliases?.includes(commandName));
    
    if(!command)
        return handleInvalidCommand(message, client, commandName, ppure);
    //#endregion

    const rawArgs = content.slice(content.indexOf(commandName) + commandName.length).trim();
    await handleMessageCommand(message, command, stats, args, rawArgs, `${ppure.raw}${commandName}`)
    .catch(error => handleMessageCommandError(error, message, stats, commandName, args));
    stats.markModified('commands');
}

/**@param {String} userId*/
async function gainPRC(userId) {
    const userConfigs = (await UserConfigs.findOne({ userId })) || new UserConfigs({ userId });

    userConfigs.prc += 1;
    
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

    gainPRC(author.id);

    const userCache = await fetchUserCache(author.id);

    const results = await Promise.all([
        sendPixivPostsAsWebhook(message, userCache.convertPixiv).catch(console.error),
        sendTweetsAsWebhook(message, userCache.twitterPrefix).catch(console.error),
    ]);

    if(results.includes(true) && message.deletable)
        message.delete().catch(console.error);
    
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