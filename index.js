//#region Carga de módulos necesarios
const Discord = require('discord.js'); //Soporte JS de la API de Discord
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs'); //Sistema de archivos
//const Keyv = require('keyv');
//const keyv = new Keyv('postgresql://sxiejhineqmvsg:d0b53a4f62e2cf77383908ff8d281e4a5d4f7db7736abd02e51f0f27b6fc6264@ec2-35-175-170-131.compute-1.amazonaws.com:5432/da27odtfovvn7n');
//keyv.on('error', err => console.error('Keyv connection error:', err));
const global = require('./localdata/config.json'); //Propiedades globales
const func = require('./func.js'); //Funciones globales
const stats = require('./localdata/stats.json');
const cmdex = require('./localdata/cmdExceptions.js');
const guildfunc = require('./localdata/guildFunctions.js');
const dns = require('dns'); //Detectar host
const { registerFont } = require('canvas'); //Registrar fuentes al ejecutar Bot
const chalk = require('chalk'); //Consola con formato bonito
const { SlashCommandBuilder } = require('@discordjs/builders');
const { promisify } = require('util');
const token = (process.env.I_LOVE_MEGUMIN)?process.env.I_LOVE_MEGUMIN:require('./key.json').token; //La clave del bot
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
commandFiles = fs.readdirSync('./commands/Pure').filter(file => file.endsWith('.js')); //Lectura de comandos de bot
for(const file of commandFiles) {
    const command = require(`./commands/Pure/${file}`);
	client.ComandosPure.set(command.name, command);
    command.data = new SlashCommandBuilder()
        .setName(command.name)
        .setDescription(command.brief || command.desc.slice(0, 99));
    if(typeof command.interact === 'function')
	    client.SlashPure.set(command.name, command.data.toJSON());
}
//#endregion

client.on('ready', async () => { //Confirmación de inicio y cambio de estado
    const confirm = () => console.log(chalk.green('Hecho.'));
    global.maintenance = '1';
    try {
        console.log(chalk.bold.magentaBright('Comienzo de cargado de comandos slash...'));
        const registered = await restGlobal.put(
            Routes.applicationCommands(client.application.id),
            { body: client.SlashPure },
        );
        console.log('Comandos registrados:', registered.map(scmd => scmd.name));
        confirm();
    } catch (error) {
        console.log(chalk.bold.redBright('Ocurrió un error al intentar cargar los comandos slash'));
        console.error(error);
    }
    //Quitar esto luego ↓
    const cl = global.bot_status.changelog;
    cl[cl.indexOf('PLACEHOLDER_SLASHCMD')] = `Agregando soporte de ***__[/comandos](https://blog.discord.com/slash-commands-are-here-8db0a385d9e6)__*** *(${client.SlashPure.size} comandos listos)*`;

	console.log(chalk.cyanBright('Calculando semilla y horario.'));
    let stt = Date.now();
    global.startuptime = stt;
    global.lechitauses = stt;
    global.seed = stt / 60000;
    
    await func.modifyAct(client, 0);

    console.log(chalk.yellowBright.italic('Cargando datos de base de datos...'));
    const gds = client.guilds;
    await Promise.all([
        gds.fetch(global.serverid.slot1),
        gds.fetch(global.serverid.slot2),
        gds.fetch(global.serverid.slot3)
    ]).then(fetched => fetched.forEach((f, i) => global.slots[`slot${i + 1}`] = f));
    const logs = await Promise.all([
        global.slots.slot1.channels.resolve('870347940181471242'),
        global.slots.slot1.channels.resolve('870347965192097812')
    ]);
    global.logch = logs[0];
    global.confch = logs[1];
	confirm();

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
    global.puretable = Array(16).fill(null).map(() => Array(16).fill('828736342372253697'));

	console.log(chalk.rgb(158,114,214)('Registrando fuentes...'));
    registerFont('fonts/Alice-Regular.ttf', { family: 'headline' });
    registerFont('fonts/teen bd.ttf', { family: 'cardname' });
    registerFont('fonts/kirsty rg.otf', { family: 'cardclass' });
    registerFont('fonts/cuyabra.otf', { family: 'cardhint' });
    registerFont('fonts/asap-condensed.semibold.ttf', { family: 'cardbody' });
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

client.on('messageCreate', async message => { //En caso de recibir un mensaje
    const { content, author, channel, guild } = message;
    if(func.channelIsBlocked(channel)) return;
    if(global.cansay === 0 && author.bot) return;
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
    (function registerUserMessage(mci = channel.id, mmi = author.id) {
        stats.read++;
        stats[gid] = stats[gid] || {};
        stats[gid][mci] = stats[gid][mci] || {};
        stats[gid][mci].cnt = (stats[gid][mci].cnt || 0) + 1;
        stats[gid][mci].sub = stats[gid][mci].sub || {};
        stats[gid][mci].sub[mmi] = (stats[gid][mci].sub[mmi] || 0) + 1;
    })();
    //#endregion

    //#region Respuestas rápidas
    if(guildfunc[gid])
        fastGuildFunctions.forEach(async frf => {
            if(guildfunc[gid][frf]) await guildfunc[gid][frf](message);
        });
    //#endregion
    
    //#region Comandos
    //#region Detección de Comandos
    let pdetect;
    if(msg.startsWith(global.p_drmk.raw)) pdetect = global.p_drmk;
    else if(msg.startsWith(global.p_pure.raw)) pdetect = global.p_pure;
    else return; //Salir si no se encuentra el prefijo

    //Partición de mensaje comando
    const args = content.replace(pdetect.regex, '').split(/[\n ]+/); //Argumentos ingresados
    let commandname = args.shift().toLowerCase(); //Comando ingresado
    let command;
    
    if(pdetect.raw === global.p_drmk.raw) {
        //command = client.ComandosDrawmaku.get(commandname) || client.ComandosDrawmaku.find(cmd => cmd.aliases && cmd.aliases.includes(commandname));
        channel.send({ content: '<:delete:704612795072774164> Los comandos de Drawmaku estarán deshabilitados por un tiempo indefinido. Se pide disculpas.' });
        return;
    } else if(pdetect.raw === global.p_pure.raw)
        command = client.ComandosPure.get(commandname) || client.ComandosPure.find(cmd => cmd.aliases && cmd.aliases.includes(commandname));
    
    if(!command) {
        const notice = await channel.send({
            reply: { messageReference: message.id },
            content: ':x: Disculpa, soy estúpida. Tal vez escribiste mal el comando y no te entiendo.'
        });
        setTimeout(() => notice.delete(), 4000);
        return;
    }
    //#endregion

    //#region Ejecución de Comandos
    try {
        //Detectar problemas con el comando basado en flags
        let exception = null;
        command.flags.every(flag => {
            const ex = cmdex.findExceptions(flag, message);
            if(ex) { exception = ex; return false; }
            else return true;
        });
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
    
    if(global.cansay > 0) global.cansay--; //Aceptar comandos por 1 tick al ejecutar p!papa-decir
    //#endregion
    //#endregion 
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
    const { commandName: commandname, guild, channel, member } = interaction;
    if(func.channelIsBlocked(channel)) return;
	const slash = client.SlashPure.get(commandname);
	if (!slash) return;

	try {
        const comando = client.ComandosPure.get(commandname);
        //Detectar problemas con el comando basado en flags
        let exception = null;
        comando.flags.forEach(flag => {
            const ex = cmdex.findExceptions(flag, interaction);
            if(ex) { exception = ex; return false; }
            else return true;
        });
        if(exception) {
            await interaction.reply({ embeds: [ cmdex.createEmbed(exception, { cmdString: `/${commandname}` }) ]});
            return;
        } else
            await comando.interact(interaction);
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
});

client.on('guildMemberAdd', member => { //Evento de entrada a servidor
    const { guild, user } = member;
    if(!guild.available) return;
    if(func.channelIsBlocked(guild.systemChannelId)) return;
    console.log('Evento de entrada de usuario a servidor desencadenado.');
    try {
        if(!user.bot) func.dibujarBienvenida(member);
        else guild.channels.cache.get(guild.systemChannelId).send({
            content:
                'Se acaba de unir un bot.\n' +
                '***Beep boop, boop beep?***'
        });
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

client.on('guildMemberRemove', member => { //Evento de salida de servidor
    const guild = member.guild;
    if(!guild.available) return;
    if(global.maintenance.length > 0 && guild.systemChannelId !== global.maintenance) return;
    const user = member.user;
    console.log('Evento de salida de usuario de servidor desencadenado.');
    try {
        if(!user.bot) func.dibujarDespedida(member);
        else guild.channels.cache.get(guild.systemChannelId).send({
            content: `**${member.displayName}** ya no es parte de la pandilla de bots de este servidor :[\n`
        });
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