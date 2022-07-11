//#region Carga de módulos necesarios
console.time('Carga de módulos');
const Discord = require('discord.js'); //Soporte JS de la API de Discord
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs'); //Sistema de archivos
// const envPath = './localenv.json';
const envPath = './remoteenv.json';

//Base de datos
const Mongoose = require('mongoose');
const uri = process.env.MONGODB_URI ?? (require(envPath)?.dburi);
const prefixpair = require('./localdata/models/prefixpair.js');
const { Stats, ChannelStats } = require('./localdata/models/stats.js');
const { Puretable, defaultEmote, pureTableImage } = require('./localdata/models/puretable.js');
const HouraiDB = require('./localdata/models/hourai.js');

const { modifyPresence } = require('./presence.js');
const global = require('./localdata/config.json'); //Propiedades globales
const func = require('./func.js'); //Funciones globales
const cmdex = require('./localdata/cmdExceptions.js');
const globalGuildFunctions = require('./localdata/customization/guildFunctions.js');
const dns = require('dns'); //Detectar host
const { registerFont, loadImage, Canvas } = require('canvas'); //Registrar fuentes al ejecutar Bot
const chalk = require('chalk'); //Consola con formato bonito
const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandOptionsManager } = require('./commands/Commons/cmdOpts.js');
const { promisify } = require('util');
const { updateBooruFeeds } = require('./systems/boorufeed');
const { p_drmk, p_pure } = require('./localdata/customization/prefixes.js');
const { PureVoiceUpdateHandler } = require('./systems/purevoice.js');
const token = process.env.I_LOVE_MEGUMIN ?? (require(envPath).token); //La clave del bot
console.timeEnd('Carga de módulos');
//#endregion

//#region Parámetros Iniciales
console.time('Establecimiento de parámetros iniciales');
const botIntents = new Discord.Intents();
const iflags = Discord.Intents.FLAGS;
botIntents.add(
    iflags.GUILDS,
    iflags.GUILD_MEMBERS,
    iflags.GUILD_EMOJIS_AND_STICKERS,
    iflags.GUILD_INTEGRATIONS,
    iflags.GUILD_PRESENCES,
    iflags.GUILD_MESSAGES,
    iflags.GUILD_MESSAGE_REACTIONS,
    iflags.GUILD_MESSAGE_TYPING,
    iflags.GUILD_VOICE_STATES,
    iflags.DIRECT_MESSAGES,
);
const client = new Discord.Client({
    intents: botIntents,
    fetchAllMembers: true,
    allowedMentions: { parse: [ 'users', 'roles' ], repliedUser: false }
});
const restGlobal = new REST({ version: '9' }).setToken(token);
//Ordenar nombres de funciones de guild, eliminando nombres repetidos
global.p_drmk['0'] = { raw: 'd!', regex: /^[Dd] *![\n ]*/ };
global.p_pure['0'] = { raw: 'p!', regex: /^[Pp] *![\n ]*/ };
console.timeEnd('Establecimiento de parámetros iniciales');
//#endregion

//#region Detección de archivos de comandos
console.time('Detección de archivos de comando');
client.ComandosDrawmaku = new Discord.Collection(); //Comandos de Drawmaku
let commandFiles = fs.readdirSync('./commands/Drawmaku').filter(file => file.endsWith('.js')); //Lectura de comandos de bot
for(const file of commandFiles) {
	const command = require(`./commands/Drawmaku/${file}`);
	client.ComandosDrawmaku.set(command.name, command);
}
client.ComandosPure = new Discord.Collection(); //Comandos de Puré
client.SlashPure = new Discord.Collection(); //Comandos Slash de Puré
client.SlashHouraiPure = new Discord.Collection(); //Comandos Slash de Puré
client.EmotesPure = new Discord.Collection(); //Emotes de Puré
commandFiles = fs.readdirSync('./commands/Pure').filter(file => file.endsWith('.js')); //Lectura de comandos de bot
{
    /**@param {String} type*/
    const typeToAddFunctionName = (type) => {
        switch(type) {
            case 'NUMBER':  return 'addNumberOption';
            case 'USER':    return 'addUserOption';
            case 'ROLE':    return 'addRoleOption';
            case 'CHANNEL': return 'addChannelOption';
            case 'ID':      return 'addIntegerOption';
            default:        return 'addStringOption';
        };
    }
    
    for(const file of commandFiles) {
        const command = require(`./commands/Pure/${file}`);
        client.ComandosPure.set(command.name, command);

        if(command.flags?.includes('emote'))
            client.EmotesPure.set(command.name, command);

        if(typeof command.interact === 'function' || command.experimental) {
            const slash = new SlashCommandBuilder()
                .setName(command.name)
                .setDescription(command.brief || command.desc.slice(0, 99));

            /**@type {CommandOptionsManager}*/
            const options = command.options;
            if(options) {
                options.params.forEach(p => {
                    const addFunctionName = typeToAddFunctionName(p._type);
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
                    /**@param {*} opt*/
                    const optionBuilder = (opt) => opt.setName(f._long[0] || f._short[0]).setDescription(f._desc).setRequired(false);
                    if(f._expressive)
                        return slash[typeToAddFunctionName(f._type)](optionBuilder);
                    return slash.addBooleanOption(optionBuilder);
                });
            }

            const jsonData = slash.toJSON();
            if(!command.flags?.includes('hourai'))
                client.SlashPure.set(command.name, jsonData);
            else
                client.SlashHouraiPure.set(command.name, jsonData);
        }
    }
}
console.timeEnd('Detección de archivos de comando');
//#endregion

console.time('Registro de eventos del cliente');
//Inicialización del cliente
client.on('ready', async () => {
    const confirm = () => console.log(chalk.green('Hecho.'));
    global.maintenance = '1';

    try {
        console.log(chalk.bold.magentaBright('Cargando comandos slash...'));
        await restGlobal.put(
            Routes.applicationCommands(client.application.id),
            { body: client.SlashPure },
        );
        //console.log('Comandos registrados (global):', registeredGlobal.map(scmd => scmd.name));
        const dedicatedServerId = (process.env.I_LOVE_MEGUMIN) ? global.serverid.hourai : global.serverid.slot1;
        await restGlobal.put(
            Routes.applicationGuildCommands(client.application.id, dedicatedServerId),
            { body: client.SlashHouraiPure },
        );
        //console.log('Comandos registrados (hourai):', registeredHourai.map(scmd => scmd.name));
        confirm();
    } catch (error) {
        console.log(chalk.bold.redBright('Ocurrió un error al intentar cargar los comandos slash'));
        console.error(error);
    }
    //Quitar esto luego ↓
    const cl = global.bot_status.changelog;
    cl[cl.indexOf('PLACEHOLDER_SLASHCMD')] = `Agregando soporte de ***__[/comandos](https://blog.discord.com/slash-commands-are-here-8db0a385d9e6)__*** *(${client.SlashPure.size} comandos listos)*`;

	console.log(chalk.cyan('Semilla y horario calculados'));
    let currentTime = Date.now();
    global.startupTime = currentTime;
    global.lechitauses = currentTime;
    global.seed = currentTime / 60000;

	console.log(chalk.magenta('Obteniendo información del host...'));
    try {
        const asyncLookupService = promisify(dns.lookupService);
        const host = await asyncLookupService('127.0.0.1', 443);
        global.bot_status.host = `${host.service}://${host.hostname}/`;
        confirm();
    } catch(err) {
        global.bot_status.host = 'Desconocido';
        console.log(chalk.red('Fallido.'));
        console.error(err);
    }

    console.log(chalk.magenta('Indexando Slots de Puré...'));
    (await Promise.all([
        client.guilds.fetch(global.serverid.slot1),
        client.guilds.fetch(global.serverid.slot2),
        client.guilds.fetch(global.serverid.slot3),
    ])).forEach((guild, i) => { global.slots[`slot${i + 1}`] = guild; });
    [ global.logch, global.confch ] = (await Promise.all([
        global.slots.slot1.channels.resolve('870347940181471242'),
        global.slots.slot1.channels.resolve('870347965192097812'),
    ]));
    confirm();
    
    //Cargado de datos de base de datos
    console.log(chalk.yellowBright.italic('Cargando datos de base de datos...'));
    console.log(chalk.gray('Conectando a Cluster en la nube'));
    await Mongoose.connect(uri, {
        useUnifiedTopology: true,
        useNewUrlParser: true
    });
    console.log(chalk.gray('Iniciando cambios de presencia periódicos...'));
    await modifyPresence(client);
    confirm();
    console.log(chalk.gray('Facilitando prefijos'));
    (await prefixpair.find({})).forEach(pp => {
        console.log(pp.guildId);
        global.p_pure[pp.guildId] = {
            raw: pp.pure.raw,
            regex: pp.pure.regex
        };
        global.p_drmk[pp.guildId] = {
            raw: pp.drmk.raw,
            regex: pp.drmk.regex
        };
    });
    console.table(global.p_pure);
    console.log(chalk.gray('Preparando Infracciones de Hourai'));
    const hourai = (await HouraiDB.findOne({})) || new HouraiDB({});
    {
        const now = Date.now();
        let wasModified = false;
        Object.entries(hourai.userInfractions).forEach(([userId, infractions]) => {
            const previousInfractionsLength = infractions.length;
            console.log(`${userId}:`, infractions);
            infractions = infractions.filter(inf => (now - inf) < (60e3 * 60 * 4)); //Eliminar antiguas
            console.log(`${userId}:`, infractions);

            if(previousInfractionsLength === infractions.length) return;
            wasModified = true;

            if(!infractions.length) {
                hourai.userInfractions[userId] = null;
                delete hourai.userInfractions[userId];
                return;
            }
            
            global.hourai.infr.users[userId] = infractions;
            hourai.userInfractions[userId] = infractions;
        });
        if(wasModified) hourai.markModified('userInfractions');
    }
    await hourai.save();

    console.log(chalk.gray('Preparando Tabla de Puré'));
    let puretable = await Puretable.findOne({});
    global.pureTableImage = await loadImage('https://i.imgur.com/TIL0jPV.png');
    if(!puretable) puretable = new Puretable();
    else //Limpiar emotes eliminados / no accesibles
        puretable.cells = await Promise.all(puretable.cells.map(arr =>
            Promise.all(arr.map(cell => client.emojis.cache.get(cell) ? cell : defaultEmote ))
        ));
    await puretable.save();
    //Volcar en memoria las imágenes necesarias para dibujar la Tabla de Puré
    global.loademotes = {};
    await Promise.all(puretable.cells.map(arr =>
        Promise.all(arr.slice(0).sort().filter((item, i, a) => (i > 0)?(item !== a[i - 1]):true).map(async item => {
            if(!global.loademotes.hasOwnProperty(item))
                global.loademotes[item] = await loadImage(client.emojis.cache.get(item).url);
        }))
    ));
    console.log(chalk.gray('Preparando imágenes extra'));
    global.loademotes['chess'] = {
        WHITE: await loadImage(global.slots.slot3.emojis.cache.find(e => e.name === 'wCell').url),
        BLACK: await loadImage(global.slots.slot3.emojis.cache.find(e => e.name === 'bCell').url),
        pawn:  await loadImage(global.slots.slot3.emojis.cache.find(e => e.name === 'pawn').url),
    };
	confirm();

	console.log(chalk.rgb(158,114,214)('Registrando fuentes...'));
    registerFont('fonts/Alice-Regular.ttf',             { family: 'headline' });
    registerFont('fonts/teen bd.ttf',                   { family: 'cardname' });
    registerFont('fonts/kirsty rg.otf',                 { family: 'cardclass' });
    registerFont('fonts/cuyabra.otf',                   { family: 'cuyabra' });
    registerFont('fonts/asap-condensed.semibold.ttf',   { family: 'cardbody' });
    registerFont('fonts/BebasNeue_1.otf',               { family: 'bebas' });
    registerFont('fonts/DINPro-Cond.otf',               { family: 'dinpro' });
	confirm();

    await global.logch.send({ embeds: [new Discord.MessageEmbed()
        .setColor('DARK_VIVID_PINK')
        .setAuthor({ name: 'Mensaje de sistema' })
        .setTitle('Bot conectado y funcionando')
        .addField('Host', global.bot_status.host, true)
        .addField('N. de versión', global.bot_status.version.number, true)
        .addField('Fecha', `<t:${Math.floor(Date.now() / 1000)}:f>`, true)
    ]});
    global.maintenance = '';
	console.log(chalk.greenBright.bold('Bot conectado y funcionando.'));

    //Encontrar el próximo inicio de media hora (X:00 / X:30) para actualizar Feedsconst now = new Date();
    const now = new Date();
    const feedUpdateDelay = 1000 * 60 * 15;
    let feedUpdateStart = feedUpdateDelay - (
        now.getMinutes() * 1000 * 60 +
        now.getSeconds() * 1000 +
        now.getMilliseconds());
    while(feedUpdateStart <= 0)
        feedUpdateStart += feedUpdateDelay;
    feedUpdateStart += 1000 * 30; //Añadir 30 segundos para dar ventana de tiempo razonable a Gelbooru
    console.log(now.toString(), '\n', new Date(now.getTime() + feedUpdateStart).toString());
    setTimeout(updateBooruFeeds, feedUpdateStart, client);
    // updateBooruFeeds(client);
});

//Recepción de mensajes
client.on('messageCreate', async message => {
    const { content, author, channel, guild, guildId: gid } = message;
    if(func.channelIsBlocked(channel) || author.bot) return;
    console.log('--- Mensaje recibido ---');
    console.time('Procesado inicial');
    if(!guild) return;
    const msg = content.toLowerCase();
    
    //Operaciones de proceso
    const logembed = new Discord.MessageEmbed()
        .addField(author.tag, content ? content.slice(0, 1023) : '*Mensaje vacío.*')
        .setAuthor({
            name: `${guild.name} • ${channel.name} (Click para ver)`,
            iconURL: author.avatarURL({ dynamic: true }),
            url: message.url,
        });
    if(message.attachments.size)
        logembed.addField('Adjuntado:', message.attachments.map(attf => attf.url).join('\n'));

    global.logch.send({ embeds: [logembed] }).catch(console.error);
    console.timeEnd('Procesado inicial');

    //Estadísticas
    console.time('Estadísticas');
    const stats = (await Stats.findOne({})) || new Stats({ since: Date.now() });
    stats.read++;
    (async () => {
        const channelQuery = { guildId: gid, channelId: channel.id };
        const chstats = (await ChannelStats.findOne(channelQuery)) || new ChannelStats(channelQuery);
        chstats.cnt++;
        chstats.sub[author.id] = (chstats.sub[author.id] ?? 0) + 1;
        chstats.markModified('sub');
        chstats.save();
    })();
    await stats.save();
    console.timeEnd('Estadísticas');

    //Respuestas rápidas
    console.time('Funciones de Guild')
    const guildFunctions = globalGuildFunctions[gid];
    if(guildFunctions)
        await Promise.all(Object.values(guildFunctions).map(fgf => fgf(message)));
    console.timeEnd('Funciones de Guild')
    
    //#region Comandos
    //#region Detección de Comandos
    const pdrmk = p_drmk(gid);
    const ppure = p_pure(gid);
    let pdetect;
    if(msg.match(pdrmk.regex)) pdetect = pdrmk;
    else if(msg.match(ppure.regex)) pdetect = ppure;
    else {
        //#region Emotes rápidos
        const words = content.split(/[\n ]+/);
        let ecmd = words.findIndex(word => word.startsWith('&'));
        if(ecmd === -1) return; //Salir si no se encuentra prefijo de comando ni emote

        const args = words.slice(ecmd + 1);
        ecmd = words[ecmd].toLowerCase().slice(1);
        const command = client.EmotesPure.get(ecmd) || client.EmotesPure.find(cmd => cmd.aliases && cmd.aliases.includes(ecmd)); //Argumentos ingresados
        if(!command) return;

        try {
            //Detectar problemas con el comando basado en flags
            const exception = await cmdex.findFirstException(command.flags, message);
            if(exception) return;
            else await command.execute(message, args);
        } catch(error) {
            const isPermissionsError = cmdex.handleAndLogError(error, message, { details: `"${message.content?.slice(0, 699)}"\n[${commandname} :: ${args}]` });
            if(!isPermissionsError)
                stats.commands.failed++;
        }
        //#endregion
    }

    //Partición de mensaje comando
    const args = content.replace(pdetect.regex, '').split(/[\n ]+/); //Argumentos ingresados
    let commandname = args.shift().toLowerCase(); //Comando ingresado
    let command;
    
    if(pdetect.raw === pdrmk.raw) {
        //command = client.ComandosDrawmaku.get(commandname) || client.ComandosDrawmaku.find(cmd => cmd.aliases && cmd.aliases.includes(commandname));
        channel.send({ content: '<:delete:704612795072774164> Los comandos de Drawmaku estarán deshabilitados por un tiempo indefinido. Se pide disculpas.' });
        return;
    } else if(pdetect.raw === ppure.raw)
        command = client.ComandosPure.get(commandname) || client.ComandosPure.find(cmd => cmd.aliases && cmd.aliases.includes(commandname));
    
    if(!command) {
        /**@type {Array<String>} */
        const replies = [
            'Disculpa, soy estúpida. Tal vez escribiste mal el comando y no te entiendo\nhttps://i.imgur.com/e4uM3z6.jpg',
            'No entiendo, ¿quieres usar un comando? Quieres usar uno, ¿verdad?, ¿prueba revisar cómo lo escribes?\nhttps://i.imgur.com/uuLuxtj.jpg',
            `La verdad, no tengo ni idea de qué pueda ser **"${commandname}"**, ¿seguro que lo escribiste bien? Recuerda que soy un bot, eh\nhttps://i.imgur.com/AHdc7E2.jpg`,
            'Busqué en todo el manual y no encontré el comando que me pediste. Perdóname, PERDÓNAME WAAAAAAAAH\nhttps://i.imgur.com/wOxRi72.jpg',
            'No logré encontrar tu comando en mi librito. ¿Lo habrás escrito mal?\nhttps://i.imgur.com/avTSSa4.jpg',
        ];
        const notice = await message.reply({ content: replies[func.randRange(0, replies.length)] }).catch(() => undefined);
        setTimeout(() => notice?.delete().catch(console.error), 6000);
        return;
    }
    //#endregion

    //#region Ejecución de Comandos
    try {
        //Detectar problemas con el comando basado en flags
        const exception = await cmdex.findFirstException(command.flags, message);
        if(exception) {
            await channel.send({ embeds: [ cmdex.createEmbed(exception, { cmdString: `${pdetect.raw}${commandname}` }) ]});
            return;
        } else
            await command.execute(message, args);
        stats.commands.succeeded++;
    } catch(error) {
        const isPermissionsError = cmdex.handleAndLogError(error, message, { details: `"${message.content?.slice(0, 699)}"\n[${commandname} :: ${args}]` });
        if(!isPermissionsError)
            stats.commands.failed++;
    }
    stats.markModified('commands');
    await stats.save();
    //#endregion
    //#endregion

    //Ayuda para principiantes
    if(message.content.indexOf(`${message.client.user.id}>`) !== -1)
        (require('./commands/Pure/prefijo.js').execute(message, []));
});

//Recepción de interacciones
client.on('interactionCreate', async interaction => {
    const { guild, channel } = interaction;
    if(!guild) return await interaction.reply({ content: ':x: Solo respondo a comandos en servidores' }).catch(console.error);
    const stats = (await Stats.findOne({})) || new Stats({ since: Date.now() });

    //Comando Slash
	if(interaction.isCommand()) {
        const { commandName } = interaction;
        if(func.channelIsBlocked(channel)) return;
        const slash = client.SlashPure.get(commandName);
        if (!slash) return;

        //#region Ejecución de Comandos
        try {
            //Detectar problemas con el comando basado en flags
            const command = client.ComandosPure.get(commandName);
            const exception = await cmdex.findFirstException(command.flags, interaction);
            if(exception)
                return await interaction.reply({ embeds: [ cmdex.createEmbed(exception, { cmdString: `/${commandName}` }) ], ephemeral: true });
            
            if(command.experimental)
                await command.execute(interaction, interaction.options, true);
            else
                await command.interact(interaction, interaction.options);
            stats.commands.succeeded++;
        } catch(error) {
            const isPermissionsError = cmdex.handleAndLogError(error, interaction, { details: commandName });
            if(!isPermissionsError)
                stats.commands.failed++;
        }
        stats.markModified('commands');
        await stats.save();
        //#endregion
    }

    //Click sobre botón
    if(interaction.isButton() || interaction.isSelectMenu()) {
        if(!interaction.customId) return;
        
        try {
            const funcSeek = interaction.customId.split('_');
            let command = funcSeek.shift();
            const func = funcSeek.shift();
            console.log(command, func, funcSeek);
            if(command && func) {
                command = client.ComandosPure.get(command) || client.ComandosPure.find(cmd => cmd.aliases && cmd.aliases.includes(command));
                if(typeof command[func] === 'function')
                    await command[func](interaction, funcSeek);
                else
                    interaction.reply({
                        content: '☕ Parece que encontraste un botón o menú desplegable sin función. Mientras conecto algunos cables, ten un café',
                        ephemeral: true,
                    });
            }
            stats.commands.succeeded++;
        } catch(error) {
            const isPermissionsError = cmdex.handleAndLogError(error, interaction, { details: `${interaction.customId}` });
            if(!isPermissionsError)
                stats.commands.failed++;
        }
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
    console.log('Evento de entrada de miembro a servidor desencadenado.');
    const { guild, user } = member;
    if(!guild.available || func.channelIsBlocked(guild.systemChannelId)) return;

    try {
        if(!user.bot) func.dibujarBienvenida(member);
        else {
            const sysch = guild.channels.cache.get(guild.systemChannelId);
            if(sysch) sysch.send({
                content:
                    'Se acaba de unir un bot.\n' +
                    '***Beep boop, boop beep?***'
            });
        }
    } catch(error) {
        console.log('Ha ocurrido un error al dar la bienvenida.');
        console.error(error);
        const errorembed = new Discord.MessageEmbed()
            .setColor('#0000ff')
            .setAuthor({ name: guild.name })
            .setFooter({ text: `gid: ${guild.id} | uid: ${user.id}` })
            .addField('Ha ocurrido un error al dar la bienvenida', `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\``);
        global.logch.send({
            content: `<@${global.peopleid.papita}>`,
            embeds: [errorembed]
        });
    }
});

//Evento de salida de servidor
client.on('guildMemberRemove', member => {
    console.log('Evento de salida de miembro de servidor desencadenado.');
    const { guild, user } = member;
    if(!guild.available) return;
    if(guild.id === global.serverid.hourai) return;
    if(global.maintenance.length > 0 && guild.systemChannelId !== global.maintenance) return;
    
    try {
        if(!user.bot) func.dibujarDespedida(member);
        else {
            const sysch = guild.channels.cache.get(guild.systemChannelId);
            if(sysch) sysch.send({ content: `**${member.displayName}** ya no es parte de la pandilla de bots de este servidor :[\n` }).catch(console.error);
        }
    } catch(error) {
        console.log('Ha ocurrido un error al dar la despedida.');
        console.error(error);
        const errorembed = new Discord.MessageEmbed()
            .setColor('#0000ff')
            .setAuthor({ name: guild.name })
            .setFooter({ text: `gid: ${guild.id} | uid: ${user.id}` })
            .addField('Ha ocurrido un error al dar la despedida', `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\``);
        global.logch.send({
            content: `<@${global.peopleid.papita}>`,
            embeds: [errorembed],
        });
    }
});

//Evento de Rate Limit
client.on('rateLimit', rateLimit => {
    console.log(
        chalk.redBright('RateLimit'),
        chalk.yellowBright(`(${rateLimit.timeout}ms / global ${rateLimit.global}):`),
        chalk.bgCyanBright.black.bold(`${rateLimit.method} →`), chalk.greenBright(rateLimit.route),
    );
});

//Evento de advertencia
client.on('warn', console.log);

//Evento de error de API
client.on('error', error => {
    console.log(chalk.redBright('Error con la API de Discord'));
    console.error(error);
});

client.login(token); //Ingresar sesión en Bot
console.timeEnd('Registro de eventos del cliente');