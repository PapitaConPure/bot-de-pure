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
const { Puretable, defaultEmote } = require('./localdata/models/puretable.js');

const global = require('./localdata/config.json'); //Propiedades globales
const func = require('./func.js'); //Funciones globales
const cmdex = require('./localdata/cmdExceptions.js');
const guildfunc = require('./localdata/guildFunctions.js');
const dns = require('dns'); //Detectar host
const { registerFont, loadImage } = require('canvas'); //Registrar fuentes al ejecutar Bot
const chalk = require('chalk'); //Consola con formato bonito
const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandOptionsManager, CommandParam } = require('./commands/Commons/cmdOpts.js');
const { promisify } = require('util');
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
    iflags.DIRECT_MESSAGES
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
global.p_drmk = { raw: 'd!', regex: /^[Dd]![\n ]*/g };
global.p_pure = { raw: 'p!', regex: /^[Pp]![\n ]*/g };
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
        const registered = await restGlobal.put(
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

	console.log(chalk.cyanBright('Calculando semilla y horario; iniciando cambios de presencia periódicos...'));
    let stt = Date.now();
    global.startuptime = stt;
    global.lechitauses = stt;
    global.seed = stt / 60000;
    await func.modifyAct(client, 0);

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

    //Cargado de datos de base de datos
    console.log(chalk.yellowBright.italic('Cargando datos de base de datos...'));
    console.log(chalk.gray('Indexando Slots de Puré...'));
    const gds = await Promise.all([
        client.guilds.fetch(global.serverid.slot1),
        client.guilds.fetch(global.serverid.slot2),
        client.guilds.fetch(global.serverid.slot3)
    ]);
    gds.forEach((f, i) => { global.slots[`slot${i + 1}`] = f; });
    const logs = await Promise.all([
        global.slots.slot1.channels.resolve('870347940181471242'),
        global.slots.slot1.channels.resolve('870347965192097812')
    ]);
    global.logch = logs[0];
    global.confch = logs[1];
    console.log(chalk.gray('Conectando a Cluster en la nube'));
    await Mongoose.connect(uri, {
        useUnifiedTopology: true,
        useNewUrlParser: true
    });
    console.log(chalk.gray('Facilitando prefijos'));
    (await prefixpair.find({})).forEach(pp => {
        global.p_pure[pp.guildId] = {
            raw: pp.pure.raw,
            regex: pp.pure.regex
        };
        global.p_drmk[pp.guildId] = {
            raw: pp.drmk.raw,
            regex: pp.drmk.regex
        };
    });
    console.log(chalk.gray('Preparando Tabla de Puré'));
    let puretable = await Puretable.findOne({});
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
        pawn: await loadImage(global.slots.slot3.emojis.cache.find(e => e.name === 'pawn').url),
    };
	confirm();

	console.log(chalk.rgb(158,114,214)('Registrando fuentes...'));
    registerFont('fonts/Alice-Regular.ttf', { family: 'headline' });
    registerFont('fonts/teen bd.ttf', { family: 'cardname' });
    registerFont('fonts/kirsty rg.otf', { family: 'cardclass' });
    registerFont('fonts/cuyabra.otf', { family: 'cardhint' });
    registerFont('fonts/asap-condensed.semibold.ttf', { family: 'cardbody' });
	confirm();

    console.log(chalk.blueBright('Registrando eventos de debug del cliente'));
    //client.on('debug', console.log);
    client.on('warn', console.log);
    confirm();

    await global.logch.send({ embeds: [new Discord.MessageEmbed()
        .setColor('DARK_VIVID_PINK')
        .setAuthor('Mensaje de sistema')
        .setTitle('Bot conectado y funcionando')
        .addField('Host', global.bot_status.host, true)
        .addField('N. de versión', global.bot_status.version.number, true)
        .addField('Fecha', `<t:${Math.floor(Date.now() / 1000)}:f>`, true)
    ]});
    global.maintenance = '';
	console.log(chalk.greenBright.bold('Bot conectado y funcionando.'));
});

//Recepción de mensajes
client.on('messageCreate', async message => {
    const { content, author, channel, guild } = message;
    if(func.channelIsBlocked(channel) || author.bot) return;
    const msg = content.toLowerCase();
    const gid = guild ? guild.id : undefined;
    
    //#region Operaciones de proceso e ignorar mensajes privados
    const logembed = new Discord.MessageEmbed().addField(author.tag, content ? content.slice(0, 1023) : '*Mensaje vacío.*');
    if(guild) logembed.setAuthor(`${guild.name} • ${channel.name} (Click para ver)`, author.avatarURL({ dynamic: true }), message.url);
    else {
        logembed.setAuthor('Mensaje privado', author.avatarURL({ dynamic: true }));
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
    if(message.mentions.users.has(message.client.user.id)) {
        await require('./commands/Pure/prefijo.js').execute(message, []);
    }
    //#endregion
    
    //#region Comandos
    //#region Detección de Comandos
    const p_drmk = global.p_drmk[gid] || global.p_drmk;
    const p_pure = global.p_pure[gid] || global.p_pure;
    let pdetect;
    if(msg.startsWith(p_drmk.raw)) pdetect = p_drmk;
    else if(msg.startsWith(p_pure.raw)) pdetect = p_pure;
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
                    .setAuthor(`${guild.name} • ${channel.name} (Click para ver)`, author.avatarURL({ dynamic: true }), message.url)
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
    
    if(pdetect.raw === p_drmk.raw) {
        //command = client.ComandosDrawmaku.get(commandname) || client.ComandosDrawmaku.find(cmd => cmd.aliases && cmd.aliases.includes(commandname));
        channel.send({ content: '<:delete:704612795072774164> Los comandos de Drawmaku estarán deshabilitados por un tiempo indefinido. Se pide disculpas.' });
        return;
    } else if(pdetect.raw === p_pure.raw)
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
            .setAuthor(`${guild.name} • ${channel.name} (Click para ver)`, author.avatarURL({ dynamic: true }), message.url)
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
	if (!interaction.isCommand()) return;
    const { commandName: commandname, guild, channel, member } = interaction;
    if(func.channelIsBlocked(channel)) return;
	const slash = client.SlashPure.get(commandname);
	if (!slash) return;
    
    //#region Estadísticas
    //Los comandos slash no deberían contar como mensajes como tal, así que comento todo lo relacionado a contadores de mensajes
    //const chquery = { guildId: guild.id, channelId: channel.id };
    //const uid = member.user.id;
    const stats = (await Stats.findOne({})) || new Stats({ since: Date.now() });
    /*const chstats = (await ChannelStats.findOne(chquery)) || new ChannelStats(chquery);
    stats.read++;
    chstats.cnt++;
    chstats.sub[uid] = (chstats.sub[uid] || 0) + 1;
    chstats.markModified('sub');
    await Promise.all([
        stats.save(),
        chstats.save()
    ]);*/
    //#endregion

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
            .setAuthor(`${guild.name} • ${channel.name}`, member.user.avatarURL({ dynamic: true }))
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
});

//Evento de entrada a servidor
client.on('guildMemberAdd', member => {
    const { guild, user } = member;
    if(!guild.available || func.channelIsBlocked(guild.systemChannelId)) return;
    console.log('Evento de entrada de usuario a servidor desencadenado.');
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
            .setAuthor(guild.name)
            .setFooter(`gid: ${guild.id} | uid: ${user.id}`)
            .addField('Ha ocurrido un error al dar la bienvenida', `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\``);
        global.logch.send({
            content: `<@${global.peopleid.papita}>`,
            embeds: [errorembed]
        });
    }
});

//Evento de salida de servidor
client.on('guildMemberRemove', member => {
    const guild = member.guild;
    if(!guild.available) return;
    if(global.maintenance.length > 0 && guild.systemChannelId !== global.maintenance) return;
    const user = member.user;
    console.log('Evento de salida de usuario de servidor desencadenado.');
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
            .setAuthor(guild.name)
            .setFooter(`gid: ${guild.id} | uid: ${user.id}`)
            .addField('Ha ocurrido un error al dar la despedida', `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\``);
        global.logch.send({
            content: `<@${global.peopleid.papita}>`,
            embeds: [errorembed]
        });
    }
});

client.login(token); //Ingresar sesión con el bot