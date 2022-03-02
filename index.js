//#region Carga de módulos necesarios
const Discord = require('discord.js'); //Soporte JS de la API de Discord
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs'); //Sistema de archivos

//Base de datos
const Mongoose = require('mongoose');
const uri = (process.env.MONGODB_URI) ? process.env.MONGODB_URI : require('./localenv.json').dburi;
const prefixpair = require('./localdata/models/prefixpair.js');
const { Stats, ChannelStats } = require('./localdata/models/stats.js');
const { Puretable, defaultEmote, pureTableImage } = require('./localdata/models/puretable.js');
const PureVoice = require('./localdata/models/purevoice');
const HouraiDB = require('./localdata/models/hourai.js');

const { modifyPresence } = require('./presence.js');
const global = require('./localdata/config.json'); //Propiedades globales
const func = require('./func.js'); //Funciones globales
const cmdex = require('./localdata/cmdExceptions.js');
const guildfunc = require('./localdata/guildFunctions.js');
const dns = require('dns'); //Detectar host
const { registerFont, loadImage, Canvas } = require('canvas'); //Registrar fuentes al ejecutar Bot
const chalk = require('chalk'); //Consola con formato bonito
const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandOptionsManager } = require('./commands/Commons/cmdOpts.js');
const { promisify } = require('util');
const { updateBooruFeeds } = require('./localdata/boorufeed');
const { p_drmk, p_pure } = require('./localdata/prefixget');
const token = (process.env.I_LOVE_MEGUMIN) ? process.env.I_LOVE_MEGUMIN : require('./localenv.json').token; //La clave del bot
//#endregion

//#region Parámetros Iniciales
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
const fastGuildFunctions = (() => {
    let rtn = [];
    Object.values(guildfunc).map(gfs => Object.values(gfs).map(fgf => fgf.name)).forEach(fgt => rtn = [...rtn, ...fgt]);
    return rtn.sort().filter((fgf, i, arr) => fgf !== arr[i - 1]);
})();
global.p_drmk['0'] = { raw: 'd!', regex: /^[Dd] *![\n ]*/ };
global.p_pure['0'] = { raw: 'p!', regex: /^[Pp] *![\n ]*/ };
//#endregion

//#region Detección de archivos de comandos
client.ComandosDrawmaku = new Discord.Collection(); //Comandos de Drawmaku
let commandFiles = fs.readdirSync('./commands/Drawmaku').filter(file => file.endsWith('.js')); //Lectura de comandos de bot
for(const file of commandFiles) {
	const command = require(`./commands/Drawmaku/${file}`);
	client.ComandosDrawmaku.set(command.name, command);
}
client.ComandosPure = new Discord.Collection(); //Comandos de Puré
client.SlashPure = new Discord.Collection(); //Comandos Slash de Puré
client.EmotesPure = new Discord.Collection(); //Emotes de Puré
commandFiles = fs.readdirSync('./commands/Pure').filter(file => file.endsWith('.js')); //Lectura de comandos de bot
for(const file of commandFiles) {
    const command = require(`./commands/Pure/${file}`);
	client.ComandosPure.set(command.name, command);
    if(typeof command.interact === 'function' || command.experimental) {
        const slash = new SlashCommandBuilder()
            .setName(command.name)
            .setDescription(command.brief || command.desc.slice(0, 99));
        /**@type {CommandOptionsManager}*/
        const options = command.options;
        if(options) {
            options.params.forEach(p => {
                slash.addFunction = (opt) => {};
                switch(p._type) {
                case 'NUMBER':  slash.addFunction = slash.addIntegerOption; break;
                case 'USER':    slash.addFunction = slash.addUserOption;    break;
                case 'ROLE':    slash.addFunction = slash.addRoleOption;    break;
                case 'CHANNEL': slash.addFunction = slash.addChannelOption; break;
                case 'ID':      slash.addFunction = slash.addIntegerOption; break;
                default:        slash.addFunction = slash.addStringOption;  break;
                }
                /**
                 * @param {*} opt
                 * @param {String} name
                 */
                const optionBuilder = (opt, name, fullyOptional = false) => opt.setName(name).setDescription(p._desc).setRequired(!(fullyOptional || p._optional));
                switch(p._poly) {
                case 'SINGLE':
                    slash.addFunction(opt => optionBuilder(opt, p._name));
                    break;
                case 'MULTIPLE':
                    const singlename = p._name.replace(/[Ss]$/, '');
                    slash.addFunction(opt => optionBuilder(opt, `${singlename}_1`));
                    for(let i = 2; i <= p._polymax; i++)
                        slash.addFunction(opt => optionBuilder(opt, `${singlename}_${i}`, true));
                    break;
                default:
                    p._poly.forEach(entry => {
                        slash.addFunction(opt => optionBuilder(opt, `${p._name}_${entry}`));
                    });
                    break;
                }
            });
            options.flags.forEach(f => {
                /**@param {*} opt*/
                const optionBuilder = (opt) => opt.setName(f._long[0] || f._short[0]).setDescription(f._desc).setRequired(false);
                if(f._expressive) {
                    //case '': slash.addBooleanOption(optionBuilder); return;
                } else slash.addBooleanOption(optionBuilder);
            });
        }
        command.data = slash;
	    client.SlashPure.set(command.name, command.data.toJSON());
    }
    if(command.flags && command.flags.includes('emote'))
        client.EmotesPure.set(command.name, command);
}
//#endregion

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
        confirm();
        //console.log('Comandos registrados:', registered.map(scmd => scmd.name));
    } catch (error) {
        console.log(chalk.bold.redBright('Ocurrió un error al intentar cargar los comandos slash'));
        console.error(error);
    }
    //Quitar esto luego ↓
    const cl = global.bot_status.changelog;
    cl[cl.indexOf('PLACEHOLDER_SLASHCMD')] = `Agregando soporte de ***__[/comandos](https://blog.discord.com/slash-commands-are-here-8db0a385d9e6)__*** *(${client.SlashPure.size} comandos listos)*`;

	console.log(chalk.cyan('Semilla y horario calculados'));
    let stt = Date.now();
    global.startuptime = stt;
    global.lechitauses = stt;
    global.seed = stt / 60000;

	console.log(chalk.magenta('Obteniendo información del host...'));
    try {
        const asyncLookupService = promisify(dns.lookupService);
        const host = await asyncLookupService('127.0.0.1', 443);
        global.bot_status.host = `${host.service}://${host.hostname}/`;
        confirm();
    } catch(err) {
        console.log(chalk.red('Fallido.'));
        console.error(err);
    }

    console.log(chalk.magenta('Indexando Slots de Puré...'));
    const gds = await Promise.all([
        client.guilds.fetch(global.serverid.slot1),
        client.guilds.fetch(global.serverid.slot2),
        client.guilds.fetch(global.serverid.slot3),
    ]);
    gds.forEach((f, i) => { global.slots[`slot${i + 1}`] = f; });
    const logs = await Promise.all([
        global.slots.slot1.channels.resolve('870347940181471242'),
        global.slots.slot1.channels.resolve('870347965192097812'),
    ]);
    global.logch = logs[0];
    global.confch = logs[1];
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

    console.log(chalk.blueBright('Registrando eventos de debug del cliente'));
    //client.on('debug', console.log);
    client.on('warn', console.log);
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

    updateBooruFeeds(client);
});

//Recepción de mensajes
client.on('messageCreate', async message => {
    const { content, author, channel, guild } = message;
    if(func.channelIsBlocked(channel) || author.bot) return;
    const msg = content.toLowerCase();
    const gid = guild ? guild.id : undefined;
    
    //#region Operaciones de proceso e ignorar mensajes privados
    const logembed = new Discord.MessageEmbed().addField(author.tag, content ? content.slice(0, 1023) : '*Mensaje vacío.*');
    if(guild) logembed.setAuthor({
        name: `${guild.name} • ${channel.name} (Click para ver)`,
        iconURL: author.avatarURL({ dynamic: true }),
        url: message.url,
    });
    else {
        logembed.setAuthor({ name: 'Mensaje privado', iconURL: author.avatarURL({ dynamic: true }) });
        channel.send({ content: ':x: Uh... disculpá, no trabajo con mensajes directos.' });
    }
    if(message.attachments.size)
        logembed.addField('Adjuntado:', message.attachments.map(attf => attf.url).join('\n'));

    if(global.logch === undefined || global.confch === undefined)
        console.log(chalk.bold.red('Hay un problema con los canales de log.'));
    else {
        if(msg.startsWith(',confession ')) global.confch.send({ embeds: [logembed] });
        else global.logch.send({ embeds: [logembed] });
    }
    if(!guild) return;
    //#endregion

    //#region Estadísticas
    const chquery = { guildId: gid, channelId: channel.id };
    const stats = (await Stats.findOne({})) || new Stats({ since: Date.now() });
    const chstats = (await ChannelStats.findOne(chquery)) || new ChannelStats(chquery);
    stats.read++;
    chstats.cnt++;
    chstats.sub[author.id] = (chstats.sub[author.id] || 0) + 1;
    chstats.markModified('sub');
    await Promise.all([
        stats.save(),
        chstats.save()
    ]);
    //#endregion

    //#region Respuestas rápidas
    if(guildfunc[gid])
        fastGuildFunctions.forEach(async frf => {
            if(guildfunc[gid][frf]) await guildfunc[gid][frf](message);
        });
    if(message.content.indexOf(`${message.client.user.id}>`) !== -1)
        await require('./commands/Pure/prefijo.js').execute(message, []);
    //#endregion
    
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
        if(ecmd !== -1) {
            const args = words.slice(ecmd + 1);
            ecmd = words[ecmd].toLowerCase().slice(1);
            const command = client.EmotesPure.get(ecmd) || client.EmotesPure.find(cmd => cmd.aliases && cmd.aliases.includes(ecmd)); //Argumentos ingresados
            if(!command || command.experimental) return;
            try {
                //Detectar problemas con el comando basado en flags
                const exception = await cmdex.findFirstException(command.flags, message);
                if(exception) return;
                else await command.execute(message, args);
            } catch(error) {
                console.log(chalk.bold.redBright('Ha ocurrido un error al insertar un emote.'));
                console.error(error);
                const errorembed = new Discord.MessageEmbed()
                    .setColor('#0000ff')
                    .setAuthor({ name: `${guild.name} • ${channel.name} (Click para ver)`, iconURL: author.avatarURL({ dynamic: true }), url: message.url })
                    .addField('Ha ocurrido un error al ingresar un comando', `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\``)
                    .addField('Detalle', `"${message.content.slice(0, 699)}"\n[${ecmd}]`);
                global.logch.send({
                    content: `<@${global.peopleid.papita}>`,
                    embeds: [errorembed]
                });
            }
        }
        //#endregion
        return; //Salir si no se encuentra prefijo de comando ni emote
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
            'Busqué en todo el manual y no encontré el comando que me pediste. Perdóname, PERDÓNAME AAAAAAAAH\nhttps://i.imgur.com/wOxRi72.jpg',
            'No logré encontrar tu comando en mi librito. ¿Lo habrás escrito mal?\nhttps://i.imgur.com/avTSSa4.jpg',
        ];
        const notice = await message.reply({ content: replies[func.randRange(0, replies.length)] });
        setTimeout(() => notice.delete(), 6000);
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
        console.log(chalk.bold.redBright('Ha ocurrido un error al ingresar un comando.'));
        console.error(error);
        const errorembed = new Discord.MessageEmbed()
            .setColor('#0000ff')
            .setAuthor({ name: `${guild.name} • ${channel.name} (Click para ver)`, iconURL: author.avatarURL({ dynamic: true }), url: message.url })
            .addField('Ha ocurrido un error al ingresar un comando', `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\``)
            .addField('Detalle', `"${message.content.slice(0, 699)}"\n[${commandname} :: ${args}]`);
        global.logch.send({
            content: `<@${global.peopleid.papita}>`,
            embeds: [errorembed]
        });
        stats.commands.failed++;
    }
    stats.markModified('commands');
    await stats.save();
    //#endregion
    //#endregion
});

//Recepción de interacciones
client.on('interactionCreate', async interaction => {
    const { guild, channel, member } = interaction;
    const stats = (await Stats.findOne({})) || new Stats({ since: Date.now() });

    //Comando Slash
	if(interaction.isCommand()) {
        const { commandName: commandname } = interaction;
        if(func.channelIsBlocked(channel)) return;
        const slash = client.SlashPure.get(commandname);
        if (!slash) return;

        //#region Ejecución de Comandos
        try {
            //Detectar problemas con el comando basado en flags
            const command = client.ComandosPure.get(commandname);
            const exception = await cmdex.findFirstException(command.flags, interaction);
            if(exception)
                return await interaction.reply({ embeds: [ cmdex.createEmbed(exception, { cmdString: `/${commandname}` }) ], ephemeral: true });
            
            if(command.experimental)
                await command.execute(interaction, interaction.options, true);
            else
                await command.interact(interaction, interaction.options);
            stats.commands.succeeded++;
        } catch(error) {
            console.log('Ha ocurrido un error al procesar un comando slash.');
            console.error(error);
            const errorembed = new Discord.MessageEmbed()
                .setColor('#0000ff')
                .setAuthor({ name: `${guild.name} • ${channel.name}`, iconURL: member.user.avatarURL({ dynamic: true }) })
                .addField('Ha ocurrido un error al procesar un comando slash', `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\``);
            global.logch.send({
                content: `<@${global.peopleid.papita}>`,
                embeds: [errorembed]
            });
            stats.commands.failed++;
            await interaction.reply({ content: ':warning: Ocurrió un error al ejecutar el comando', ephemeral: true })
            .catch(err => {
            console.log('Posible interacción no registrada');
            console.error(err);
            });
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
            console.log('Ha ocurrido un error al procesar una acción de botón.');
            console.error(error);
            const errorembed = new Discord.MessageEmbed()
                .setColor('#0000ff')
                .setAuthor({ name: `${guild.name} • ${channel.name}`, iconURL: member.user.avatarURL({ dynamic: true }) })
                .addField('Ha ocurrido un error al procesar una acción de botón', `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\``);
            global.logch.send({
                content: `<@${global.peopleid.papita}>`,
                embeds: [errorembed]
            });
            stats.commands.failed++;
            await interaction.reply({ content: ':warning: Ocurrió un error al ejecutar la acción del botón', ephemeral: true })
            .catch(err => {
            console.log('Posible interacción no registrada');
            console.error(err);
            });
        }
    }
});

//Recepción de cambios en canales de voz
client.on('voiceStateUpdate', async (oldState, state) => {
    const { guild, channel, member } = state;
    const guildChannels = guild.channels.cache;
    const pv = await PureVoice.findOne({ guildId: guild.id }).catch(console.error);
    if(!(pv && guildChannels.get(pv.categoryId))) return;
    
    const prematureError = () => console.log('Canal probablemente eliminado prematuramente');

    { //Log de estado
        const userTag = member.user.tag;
        console.log(userTag.slice(userTag.indexOf('#')), '::', oldState.channel ? oldState.channel.name : null, '->', channel ? channel.name : null);
    }

    //#region Comprobar canales inexistentes en base de datos antes de operar
    await Promise.all(pv.sessions.map((session, i) => {
        const textChannel = guildChannels.get(session.textId);
        const voiceChannel = guildChannels.get(session.voiceId);
        const deletions = [];
        if(textChannel && voiceChannel) return Promise.resolve();
        if(textChannel) deletions.push(textChannel.delete().catch(prematureError));
        if(voiceChannel) deletions.push(voiceChannel.delete().catch(prematureError));
        pv.sessions.splice(i, 1);
        pv.markModified('sessions');
        console.log('Eliminando', deletions.length);
        return Promise.all(deletions);
    }));
    await pv.save();
    //#endregion

    //#region Comprobar cambios ajenos a conexiones y desconexiones
    if(oldState.channelId === state.channelId)
        return;
    //#endregion

    //#region Comprobar desconexión
    if(oldState.channelId && oldState.channel) {
        try {
            const oldChannel = oldState.channel;
            console.log('Desconexión del canal', oldChannel.name, 'con', oldChannel.members.filter(member => !member.user.bot).size, 'miembros');
            const channelPairIndex = pv.sessions.findIndex(session => session.voiceId === oldChannel.id);
            const channelPair = pv.sessions[channelPairIndex];
            if(channelPair) {
                const { textId, voiceId } = channelPair;
                if(!oldChannel.members.filter(member => !member.user.bot).size) {
                    pv.sessions.splice(channelPairIndex, 1);
                    pv.markModified('sessions');
                    const tryDeleting = async(id) => {
                        const toDelete = guildChannels.get(id);
                        if(!toDelete) return Promise.resolve();
                        return toDelete.delete();
                    };
                    if(guild.id === global.serverid.hourai) {
                        /**@type {Discord.GuildChannel} */
                        const textChannel = guildChannels.get(textId);
                        global.hourai.infr.channels[textChannel.id] = null;
                        delete global.hourai.infr.channels[textChannel.id];
                    }
                    await Promise.all([
                        tryDeleting(voiceId),
                        tryDeleting(textId),
                        pv.save().then(() => console.log('Sesiones:', pv.sessions)),
                    ]);
                } else {
                    /**@type {Discord.GuildChannel} */
                    const textChannel = guildChannels.get(textId);
                    await textChannel.permissionOverwrites.delete(member, 'Desconexión de miembro de sesión PuréVoice')
                    .catch(console.error);
                }
            }
        } catch(error) {
            //console.log('wawa:', guild.systemChannelId);
            console.error(error);
            if(guild.systemChannelId)
                await guild.systemChannel.send({ content: [
                    '⚠ Ocurrió un problema en un intento de remover una sesión del Sistema PuréVoice del servidor.',
                    'Esto puede deberse a una conexión en una sesión PuréVoice que estaba siendo eliminada.',
                    'Si el par de canales relacionales de la sesión fueron eliminados, puedes ignorar este mensaje',
                ].join('\n') });
            else
                await guild.fetchOwner().then(owner => owner.send({ content: [
                    `⚠ Ocurrió un problema en un intento de remover una sesión del Sistema PuréVoice de tu servidor **${guild.name}**.`,
                    'Esto puede deberse a una conexión en una sesión PuréVoice que estaba siendo eliminada.',
                    'Si el par de canales relacionales de la sesión fueron eliminados, puedes ignorar este mensaje',
                ].join('\n') }));
        }
    }
    //#endregion

    //#region Comprobar conexión
    //console.log('Siguiente...');
    if(channel) {
        if(channel.id === pv.voiceMakerId) {
            try {
                console.log('Conexión al canal', channel.name, 'con', channel.members.size, 'miembros');
                const [ sessionTextChannel, newSession ] = await Promise.all([
                    guild.channels.create(`vc-${member.user.username}`, {
                        type: 'GUILD_TEXT',
                        parent: pv.categoryId,
                    }),
                    guild.channels.create('➕ Nueva Sesión', {
                        type: 'GUILD_VOICE',
                        parent: pv.categoryId,
                        bitrate: 64 * 1000,
                        userLimit: 1,
                        reason: 'Desplegar Canal Automutable PuréVoice'
                    }),
                ]);
                pv.voiceMakerId = newSession.id;
                pv.sessions.push({
                    textId: sessionTextChannel.id,
                    voiceId: channel.id,
                    joinedOnce: [ member.id ],
                    nameChanged: false,
                });
                pv.markModified('sessions');

                await Promise.all([
                    pv.save().then(() => console.log('Sesiones:', pv.sessions)),
                    sessionTextChannel.permissionOverwrites.edit(guild.roles.everyone, { SEND_MESSAGES: false }, { reason: 'Restricción de envío de mensajes en sesión PuréVoice' }).catch(prematureError),
                    sessionTextChannel.permissionOverwrites.edit(guild.me, { SEND_MESSAGES: true }, { reason: 'Envío de mensajes propios en sesión PuréVoice' }).catch(prematureError),
                    sessionTextChannel.permissionOverwrites.edit(member, { SEND_MESSAGES: true }, { reason: 'Inclusión de miembro en sesión PuréVoice' }).catch(prematureError),
                    sessionTextChannel.setTopic(`#️⃣ ${guild.name} » PuréVoice » ${member.user.tag} \n👥 Canal de texto de sesión. ¡Conéctate a <#${channel.id}> para conversar aquí!`).catch(prematureError),
                ]);
                await channel.setName('🔶').catch(prematureError);
                await channel.setUserLimit(0).catch(prematureError);
                await sessionTextChannel.send({
                    content: [
                        `👋 ¡Buenas, ${member}!`,
                        `📣 Puedes usar \`${p_pure(guild.id).raw}voz <Nombre>\` para cambiar el nombre de la Sesión`,
                        `🐴 Añade la bandera \`--emote <Emote>\` o \`-e <Emote>\` al comando para cambiar el emote del canal de voz`,
                        '⏱️ El nombre de la Sesión se cambiará y bloqueará automáticamente luego de 2 minutos'
                    ].join('\n')
                }).catch(prematureError);
                const enforceNaming = async () => {
                    const pv = await PureVoice.findOne({ guildId: guild.id }).catch(console.error);
                    if(!pv) return;
                    const sessionIndex = pv.sessions.findIndex(session => session.voiceId === channel.id);
                    const session = pv.sessions[sessionIndex];
                    if(!session || session.nameChanged) return;
                    pv.sessions[sessionIndex].nameChanged = true;
                    pv.markModified('sessions');
                    return await Promise.all([
                        pv.save(),
                        sessionTextChannel?.send({ content: '🔹 Se asignó un nombre a la Sesión automáticamente' }),
                        sessionTextChannel?.setName(`💠⇒${member.user.username}`).catch(console.error),
                        channel?.setName(`💠【${member.user.username}】`).catch(console.error),
                    ]);
                };
                setTimeout(enforceNaming, 60e3 * 2);
            } catch(error) {
                console.error(error);
                if(guild.systemChannelId)
                    guild.systemChannel.send({ content: [
                        '⚠ Ocurrió un problema al crear una nueva sesión para el Sistema PuréVoice del servidor. Esto puede deberse a una saturación de acciones o a falta de permisos.',
                        'Si el problema persiste, prueben desinstalar y volver a instalar el Sistema',
                    ].join('\n') });
                else
                    await guild.fetchOwner().then(owner => owner.send({ content: [
                        `⚠ Ocurrió un problema al crear una nueva sesión para el Sistema PuréVoice de tu servidor **${guild.name}**. Esto puede deberse a una saturación de acciones o a falta de permisos.`,
                        'Si el problema persiste, desinstala y vuelve a instalar el Sistema',
                    ].join('\n') }));
            }
        } else if(channel.parentId === pv.categoryId) {
            const currentSession = pv.sessions.find(session => session.voiceId === channel.id);
            if(!currentSession) return;
            const sessionTextChannel = guildChannels.get(currentSession.textId);
            if(!sessionTextChannel) return;
            await sessionTextChannel.permissionOverwrites.create(member, { SEND_MESSAGES: true }, { reason: 'Inclusión de miembro en sesión PuréVoice' }).catch(prematureError);
            if(!currentSession.joinedOnce?.includes(member.id)) {
                await sessionTextChannel.send({
                    content: member.user.bot
                        ? `🤖 Bot **${member.user.tag}** anexado`
                        : `📣 ${member}, ¡puedes conversar por aquí!`,
                }).catch(prematureError);
                currentSession.joinedOnce.push(member.id);
                pv.markModified('sessions');
                pv.save();
            }
        }
    }
    //#endregion

    console.log('--- --- --- Fin de paso --- --- ---');
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
    if(global.maintenance.length > 0 && guild.systemChannelId !== global.maintenance) return;
    
    try {
        if(!user.bot) func.dibujarDespedida(member);
        else {
            const sysch = guild.channels.cache.get(guild.systemChannelId);
            if(sysch) sysch.send({ content: `**${member.displayName}** ya no es parte de la pandilla de bots de este servidor :[\n` });
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
    console.log('Se golpeó un pico de ratelimit:', rateLimit);
});

client.login(token); //Ingresar sesión en Bot