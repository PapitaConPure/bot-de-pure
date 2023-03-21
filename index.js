//#region Carga de módulos necesarios
//Sistemas
const Discord = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandManager, CommandOptionsManager } = require('./commands/Commons/commands.js');
const { PureVoiceUpdateHandler } = require('./systems/purevoice.js');
const fs = require('fs');

//Base de datos
const { Stats, ChannelStats } = require('./localdata/models/stats.js');
const { p_drmk, p_pure } = require('./localdata/customization/prefixes.js');
const envPath = './localenv.json';
// const envPath = './remoteenv.json';
const mongoUri = process.env.MONGODB_URI ?? (require(envPath)?.dburi);
const discordToken = process.env.I_LOVE_MEGUMIN ?? (require(envPath)?.token);
const booruApiKey = process.env.BOORU_APIKEY ?? (require(envPath)?.booruapikey);
const booruUserId = process.env.BOORU_USERID ?? (require(envPath)?.booruuserid);

//Utilidades
const globalConfigs = require('./localdata/config.json');
const { channelIsBlocked, shortenText, dibujarBienvenida, dibujarDespedida, rand, edlDistance } = require('./func.js');
const globalGuildFunctions = require('./localdata/customization/guildFunctions.js');
const { auditRequest } = require('./systems/auditor.js');
const { findFirstException, handleAndAuditError, generateExceptionEmbed } = require('./localdata/cmdExceptions.js');

//Funcionalidad adicional
const chalk = require('chalk');
const { sendPixivPostsAsWebhook } = require('./systems/purepix.js');
const { startup } = require('./events/startup.js');
//#endregion

//#region Parámetros Iniciales
console.time('Establecimiento de parámetros iniciales');
const { IntentsBitField, Partials } = Discord;
const { Flags: intentBits } = IntentsBitField;

const botIntents = new IntentsBitField().add(
    intentBits.Guilds,
    intentBits.GuildMembers,
    intentBits.GuildEmojisAndStickers,
    intentBits.GuildIntegrations,
    intentBits.GuildPresences,
    intentBits.GuildMessages,
    intentBits.GuildMessageReactions,
    intentBits.GuildMessageTyping,
    intentBits.GuildVoiceStates,
    intentBits.DirectMessages,
    intentBits.MessageContent,
);
const botPartials = [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
];
const client = new Discord.Client({
    intents: botIntents,
    partials: botPartials,
    fetchAllMembers: true,
    allowedMentions: {
        parse: [ 'users', 'roles' ],
        repliedUser: false,
    },
});
globalConfigs.p_drmk['0'] = { raw: 'd!', regex: /^[Dd] *![\n ]*/ };
globalConfigs.p_pure['0'] = { raw: 'p!', regex: /^[Pp] *![\n ]*/ };
globalConfigs.booruCredentials.apiKey = booruApiKey;
globalConfigs.booruCredentials.userId = booruUserId;
console.timeEnd('Establecimiento de parámetros iniciales');
//#endregion

const logOptions = {
    commands: false,
    slash: false,
    prefixes: false,
    feedSuscriptions: false,
};

//#region Detección de archivos de comandos
console.time('Detección de archivos de comando');
client.ComandosDrawmaku = new Discord.Collection(); //Comandos de Drawmaku
client.ComandosPure = new Discord.Collection(); //Comandos de Puré
client.SlashPure = new Discord.Collection(); //Comandos Slash de Puré
client.SlashHouraiPure = new Discord.Collection(); //Comandos Slash de Puré
client.EmotesPure = new Discord.Collection(); //Emotes de Puré
{
    /**@type {Map<import('./commands/Commons/cmdOpts').ParamType, String>} type*/
    const addFunctionNames = new Map()
    addFunctionNames.set('NUMBER',  'addNumberOption')
                    .set('USER',    'addUserOption')
                    .set('MEMBER',  'addUserOption')
                    .set('ROLE',    'addRoleOption')
                    .set('CHANNEL', 'addChannelOption')
                    .set('ID',      'addIntegerOption');
    const defaultAddFunctionName =  'addStringOption';

    //Drawmaku
    let commandFiles = fs.readdirSync('./commands/Drawmaku').filter(file => file.endsWith('.js'));
    for(const file of commandFiles) {
        const command = require(`./commands/Drawmaku/${file}`);
        client.ComandosDrawmaku.set(command.name, command);
    }

    //Puré
    commandFiles = fs.readdirSync('./commands/Pure').filter(file => file.endsWith('.js'));
    const commandTableStack = [];
    for(const file of commandFiles) {
        const commandModule = require(`./commands/Pure/${file}`);
        /**@type {CommandManager}*/
        const command = commandModule;
        client.ComandosPure.set(command.name, command);
        
        commandTableStack.push({
            name: command.name,
            flags: command.flags.values.join(', '),
            tieneEmote: command.flags.has('EMOTE') ? '✅' : '❌',
            tieneMod: command.flags.has('MOD') ? '✅' : '❌',
        });

        if(command.flags.has('EMOTE'))
            client.EmotesPure.set(command.name, command);

        if(!command.flags.any('PAPA', 'OUTDATED', 'MAINTENANCE', 'GUIDE')) {
            const slash = new SlashCommandBuilder()
                .setName(command.name)
                .setDescription(command.brief || shortenText(command.desc, 100))
                .setDMPermission(false);
            
            if(command.flags.has('MOD'))
                slash.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles | PermissionFlagsBits.ManageMessages);

            /**@type {CommandOptionsManager}*/
            const options = command.options;
            if(options) {
                options.params.forEach(p => {
                    const addFunctionName = addFunctionNames.get(p._type) ?? defaultAddFunctionName;
                    const optionBuilder = (opt, name, fullyOptional = false) => opt.setName(name).setDescription(p._desc).setRequired(!(fullyOptional || p._optional));
                    if(p._poly === 'SINGLE')
                        return slash[addFunctionName](opt => optionBuilder(opt, p._name));
                    if(p._poly === 'MULTIPLE') {
                        const singularName = p._name.replace(/[Ss]$/, '');
                        slash[addFunctionName](opt => optionBuilder(opt, `${singularName}_1`));
                        for(let i = 2; i <= p._polymax; i++)
                            slash[addFunctionName](opt => optionBuilder(opt, `${singularName}_${i}`, true));
                        return;
                    }
                    return p._poly.forEach(entry => slash[addFunctionName](opt => optionBuilder(opt, `${p._name}_${entry}`)));
                });
                options.flags.forEach(f => {
                    const addFunctionName = addFunctionNames.get(f._type) ?? defaultAddFunctionName;
                    const optionBuilder = (opt) => opt.setName(f._long[0] || f._short[0]).setDescription(f._desc).setRequired(false);
                    if(f._expressive)
                        return slash[addFunctionName](optionBuilder);
                    return slash.addBooleanOption(optionBuilder);
                });
            }

            const jsonData = slash.toJSON();
            if(!command.flags.has('HOURAI'))
                client.SlashPure.set(command.name, jsonData);
            else
                client.SlashHouraiPure.set(command.name, jsonData);
        }
    }
    logOptions.commands && console.table(commandTableStack);
}
console.timeEnd('Detección de archivos de comando');
//#endregion

console.time('Registro de eventos del cliente');
client.on('ready', () => startup(client, discordToken, logOptions));

async function updateChannelMessageCounter(guildId, channelId, userId) {
    const channelQuery = { guildId, channelId };
    const channelStats = (await ChannelStats.findOne(channelQuery)) || new ChannelStats(channelQuery);
    channelStats.cnt++;
    channelStats.sub[userId] ??= 0;
    channelStats.sub[userId] += 1;
    channelStats.markModified('sub');
    channelStats.save();
};

/**@param {import('./commands/Commons/typings.js').CommandRequest} request*/
function requestize(request) {
    request.user ??= request.author;
    request.userId ??= request.user.id;
}

//Recepción de mensajes
client.on('messageCreate', async message => {
    const { content, author, channel, guild, guildId } = message;
    if(channelIsBlocked(channel) || !guild) return;

    //Respuestas rápidas
    const guildFunctions = globalGuildFunctions[guildId];
    if(guildFunctions)
        await Promise.all(Object.values(guildFunctions).map(fgf => fgf(message)))
        .catch(error => handleAndAuditError(error, message, {
            brief: 'Ocurrió un problema al ejecutar una respuesta rápida',
            details: content ? `"${content}"` : 'Mensaje sin contenido'
        }));
    if(author.bot) return;
    sendPixivPostsAsWebhook(message).catch(console.error);
    
    //Estadísticas
    const stats = (await Stats.findOne({})) || new Stats({ since: Date.now() });
    stats.read++;
    updateChannelMessageCounter(guildId, channel.id, author.id);
    
    //#region Comandos
    const msg = content.toLowerCase();
    (async () => {
        //#region Detección de Comandos
        const pdrmk = p_drmk(guildId);
        const ppure = p_pure(guildId);
        let pdetect;
        if(msg.match(pdrmk.regex)) pdetect = pdrmk;
        else if(msg.match(ppure.regex)) pdetect = ppure;
        else {
            //region Emotes rápidos
            const words = content.split(/[\n ]+/);
            const emoteCommandIndex = words.findIndex(word => word.startsWith('&'));
            if(emoteCommandIndex === -1) return; //Salir si no se encuentra prefijo de comando ni emote

            auditRequest(message);
            const args = words.slice(emoteCommandIndex + 1);
            const emoteCommand = words[emoteCommandIndex].toLowerCase().slice(1);
            const command = client.EmotesPure.get(emoteCommand) || client.EmotesPure.find(cmd => cmd.aliases && cmd.aliases.includes(emoteCommand)); //Argumentos ingresados
            if(!command) return;

            try {
                //Detectar problemas con el comando basado en flags
                const exception = await findFirstException(command.flags, message);
                if(exception) return;
                requestize(message);
                await command.execute(message, args);
                stats.commands.succeeded++;
            } catch(error) {
                const isPermissionsError = handleAndAuditError(error, message, { details: `"${message.content?.slice(0, 699)}"\n[${commandName} :: ${args}]` });
                if(!isPermissionsError)
                    stats.commands.failed++;
            }
            return;
        }

        //Partición de mensaje comando
        auditRequest(message);
        const args = content.replace(pdetect.regex, '').split(/[\n ]+/); //Argumentos ingresados
        let commandName = args.shift().toLowerCase(); //Comando ingresado
        let command;
        /**@type {Discord.Collection<String, CommandManager>}*/
        const commandsPool = (pdetect.raw === pdrmk.raw)
            ? client.ComandosDrawmaku
            : client.ComandosPure;
        
        command = commandsPool.get(commandName) || commandsPool.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        
        if(!command) {
            /**@type {Array<{ text: String, imageUrl: String }>}*/
            const replies = [
                {
                    text: 'Disculpa, soy estúpida. Tal vez escribiste mal el comando y no te entiendo',
                    imageUrl: 'https://i.imgur.com/e4uM3z6.jpg',
                },
                {
                    text: 'No entiendo, ¿quieres usar un comando? Quieres usar uno, ¿verdad?, ¿prueba revisar cómo lo escribes?',
                    imageUrl: 'https://i.imgur.com/uuLuxtj.jpg',
                },
                {
                    text: `La verdad, no tengo ni idea de qué pueda ser **"${commandName}"**, ¿seguro que lo escribiste bien? Recuerda que soy un bot, eh`,
                    imageUrl: 'https://i.imgur.com/AHdc7E2.jpg',
                },
                {
                    text: 'Busqué en todo el manual y no encontré el comando que me pediste. Perdóname, PERDÓNAME WAAAAAAAAH',
                    imageUrl: 'https://i.imgur.com/wOxRi72.jpg',
                },
                {
                    text: 'No logré encontrar tu comando en mi librito. ¿Lo habrás escrito mal?',
                    imageUrl: 'https://i.imgur.com/avTSSa4.jpg',
                },
            ];

            const selectedReply = replies[rand(replies.length)];
            async function replyAndDelete() {
                const notice = await message.reply({ content: selectedReply.text }).catch(() => undefined);
                return setTimeout(() => notice?.delete().catch(_ => undefined), 6000);
            }

            if(commandName.length < 2)
                return replyAndDelete();

            const allowedGuesses = commandsPool.filter(cmd => !cmd.flags.any('OUTDATED', 'MAINTENANCE'));
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
            
            const suggestionEmbed = new Discord.EmbedBuilder()
                .setColor(0x5070bb)
                .setTitle('Sugerencias')
                .setFooter({ text: 'Basado en nombres y alias de comando' })
                .addFields({
                    name: `Comandos similares a "${commandName}"`,
                    value: suggestions.map(found => `• ${pdetect.raw}${found.command.name}`).join('\n'),
                });
            return message.reply({
                content: selectedReply.text,
                files: [selectedReply.imageUrl],
                embeds: [suggestionEmbed],
            });
        }
        //#endregion

        //#region Ejecución de Comandos
        try {
            //Detectar problemas con el comando basado en flags
            const exception = await findFirstException(command.flags, message);
            if(exception)
                return channel.send({ embeds: [ generateExceptionEmbed(exception, { cmdString: `${pdetect.raw}${commandName}` }) ]});
            const rawArgs = content.slice(content.indexOf(commandName) + commandName.length).trim();
            requestize(message);
            await command.execute(message, args, false, rawArgs);
            stats.commands.succeeded++;
        } catch(error) {
            const isPermissionsError = handleAndAuditError(error, message, { details: `"${message.content?.slice(0, 699)}"\n[${commandName} :: ${args}]` });
            if(!isPermissionsError)
                stats.commands.failed++;
        }
        stats.markModified('commands');
        //#endregion
    })();
    //#endregion

    stats.save();

    //Ayuda para principiantes
    if(content.includes(`${client.user}`)) {
        requestize(message);
        require('./commands/Pure/prefijo.js').execute(message, []);
    }
});

//Recepción de interacciones
client.on('interactionCreate', async interaction => {
    const { guild, channel } = interaction;
    if(!guild) return interaction.reply({ content: ':x: Solo respondo a comandos en servidores' }).catch(console.error);
    if(channelIsBlocked(channel))
        return interaction.reply({
            content: [
                '⛔ Probablemente usaste un comando mientras me reiniciaba. Usa el comando nuevamente en unos segundos y debería funcionar',
                'Si el comando se sigue rechazando, es posible que esté en mantenimiento o que no tenga suficientes permisos en este canal',
                `Si no sabes la causa, puedes notificarle el problema a mi creador: <@${globalConfigs.peopleid.papita}>`,
            ].join('\n'),
            ephemeral: true,
        }).catch(console.error);
    
    auditRequest(interaction);
    const stats = (await Stats.findOne({})) || new Stats({ since: Date.now() });

    //Comando Slash
	if(interaction.isCommand()) {
        const { commandName } = interaction;
        const slash = client.SlashPure.get(commandName) ?? client.SlashHouraiPure.get(commandName);
        if (!slash) return;

        //#region Ejecución de Comandos
        try {
            //Detectar problemas con el comando basado en flags
            const command = client.ComandosPure.get(commandName);
            const exception = await findFirstException(command.flags, interaction);
            if(exception)
                return interaction.reply({ embeds: [ generateExceptionEmbed(exception, { cmdString: `/${commandName}` }) ], ephemeral: true });
            
            requestize(interaction);
            await command.execute(interaction, interaction.options, true);
            stats.commands.succeeded++;
        } catch(error) {
            const isPermissionsError = handleAndAuditError(error, interaction, { details: `/${commandName}` });
            if(!isPermissionsError)
                stats.commands.failed++;
        }
        stats.markModified('commands');
        return stats.save();
        //#endregion
    }

    //Funciones de interacción
    if(interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
        if(!interaction.customId)
            return interaction.reply({
                content: '🍔 Recibí una acción, pero no sé cómo responderla. Esto es un problema... mientras arreglo algunas cosas, toma una hamburguesa',
                ephemeral: true,
            });

        try {
            const funcSeek = interaction.customId.split('_');
            let command = funcSeek.shift();
            const func = funcSeek.shift();
            console.log(command, func, funcSeek);
            if(!command || !func)
                return;

            command = client.ComandosPure.get(command) || client.ComandosPure.find(cmd => cmd.aliases && cmd.aliases.includes(command));
            if(typeof command[func] !== 'function')
                return interaction.reply({
                    content: '☕ Parece que encontraste un botón, menú desplegable o ventana modal sin función. Mientras conecto algunos cables, ten un café',
                    ephemeral: true,
                });

            command[func](interaction, ...funcSeek);
            stats.commands.succeeded++;
        } catch(error) {
            const isPermissionsError = handleAndAuditError(error, interaction, { details: `"${interaction.customId}"` });
            if(!isPermissionsError)
                stats.commands.failed++;
        }

        return;
    }
});

//Recepción de cambios en canales de voz
let availability = {};
client.on('voiceStateUpdate', async (oldState, state) => {
    // const guildName = state.guild?.name?.slice(0, 16);
    // const swapName = `${chalk.bgRedBright.black(oldState.channel?.name?.slice(0, 16))} ${chalk.bgGreenBright.black(state.channel?.name?.slice(0, 16))}`;
    // console.log(chalk.bold.redBright(`⚠ ${guildName} `), swapName);
    
    const guildId = state.guild.id;
    if(availability[guildId]) await availability[guildId];
    availability[guildId] = new Promise(async resolve => {
        const pv = new PureVoiceUpdateHandler(oldState, state);
        await pv.getSystemDocument({ guildId: state.guild.id }).catch(console.error);
        if(!pv.systemIsInstalled()) return resolve();

        try {
            await Promise.all([
                pv.checkFaultySessions(),
                pv.handleDisconnection(),
                pv.handleConnection(),
            ])
            await pv.saveChanges();
        } catch(error) {
            console.log(chalk.redBright('Ocurrió un error mientras se analizaba un cambio de estado en una sesión Purévoice'));
            console.error(error);
        }

        resolve();
    });

    // console.log(chalk.bold.greenBright(`✔ ${guildName} `), swapName);
});

//Evento de entrada a servidor
client.on('guildMemberAdd', member => {
    console.log('Evento de entrada de miembro a servidor desencadenado');
    const { guild, user } = member;
    if(!guild.available) return;
    const systemChannel = guild.channels.cache.get(guild.systemChannelId);
    if(!systemChannel || channelIsBlocked(systemChannel)) return;
    console.log('Evento de entrada de miembro permitido');

    try {
        if(user.bot)
            return systemChannel.send({
                content:
                    'Se acaba de unir un bot.\n' +
                    '***Beep boop, boop beep?***'
            });
        return dibujarBienvenida(member);
    } catch(error) {
        console.log('Ha ocurrido un error al dar la bienvenida.');
        console.error(error);
        const errorembed = new Discord.EmbedBuilder()
            .setColor(0x0000ff)
            .setAuthor({ name: guild.name })
            .setFooter({ text: `gid: ${guild.id} | uid: ${user.id}` })
            .addFields({ name: 'Ha ocurrido un error al dar la bienvenida', value: `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\`` });
        globalConfigs.logch.send({
            content: `<@${globalConfigs.peopleid.papita}>`,
            embeds: [errorembed]
        });
    }
});

//Evento de salida de servidor
client.on('guildMemberRemove', member => {
    console.log('Evento de salida de miembro de servidor desencadenado');
    const { guild, user } = member;
    if(!guild.available) return;
    const systemChannel = guild.channels.cache.get(guild.systemChannelId);
    if(!systemChannel || channelIsBlocked(systemChannel)) return;
    console.log('Evento de salida de miembro permitido');
    
    try {
        if(user.bot)
            return systemChannel.send({ content: `**${member.displayName}** ya no es parte de la pandilla de bots de este servidor :[` }).catch(console.error);
        return dibujarDespedida(member);
    } catch(error) {
        console.log('Ha ocurrido un error al dar la despedida.');
        console.error(error);
        const errorembed = new Discord.EmbedBuilder()
            .setColor(0x0000ff)
            .setAuthor({ name: guild.name })
            .setFooter({ text: `gid: ${guild.id} | uid: ${user.id}` })
            .addFields({ name: 'Ha ocurrido un error al dar la despedida', value: `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\`` });
        globalConfigs.logch.send({
            content: `<@${globalConfigs.peopleid.papita}>`,
            embeds: [errorembed],
        });
    }
});

//Evento de Rate Limit
client.rest.on('rateLimited', rateLimit => {
    console.log(
        chalk.redBright('RateLimit'),
        chalk.yellowBright(`(${rateLimit.timeout}ms / global ${rateLimit.global}):`),
        chalk.bgCyanBright.black.bold(`${rateLimit.method} →`), chalk.greenBright(rateLimit.route),
    );
});

client.login(discordToken); //Ingresar sesión en Bot
console.timeEnd('Registro de eventos del cliente');