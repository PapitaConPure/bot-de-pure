//#region Carga de módulos necesarios
const Discord = require('discord.js'); //Soporte JS de la API de Discord
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs'); //Sistema de archivos
const Keyv = require('keyv');
//const keyv = new Keyv('postgresql://sxiejhineqmvsg:d0b53a4f62e2cf77383908ff8d281e4a5d4f7db7736abd02e51f0f27b6fc6264@ec2-35-175-170-131.compute-1.amazonaws.com:5432/da27odtfovvn7n');
//keyv.on('error', err => console.error('Keyv connection error:', err));
const global = require('./localdata/config.json'); //Propiedades globales
const func = require('./func.js'); //Funciones globales
const stats = require('./localdata/stats.json');
const booru = require('./localdata/boorutags.js');
const cmdex = require('./localdata/cmdExceptions.js');
const dns = require('dns'); //Detectar host
const { registerFont } = require('canvas'); //Registrar fuentes al ejecutar Bot
const chalk = require('chalk'); //Consola con formato bonito
const { SlashCommandBuilder } = require('@discordjs/builders');
//Objeto cliente
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
const token = (process.env.I_LOVE_MEGUMIN)?process.env.I_LOVE_MEGUMIN:require('./key.json').token; //La clave del bot
const restGlobal = new REST({ version: '9' }).setToken(token);
const clientId = '651250669390528561';
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
        .setDescription(command.desc.slice(0, 99));
    if(typeof command.interact === 'function')
	    client.SlashPure.set(command.name, command.data.toJSON());
}
//#endregion

client.on('ready', async () => { //Confirmación de inicio y cambio de estado
    const confirm = () => console.log(chalk.green('Hecho.'));
    global.maintenance = '1';

    try {
        console.log(chalk.bold.magentaBright('Comienzo de cargado de comandos slash.'));

        await restGlobal.put(
            Routes.applicationCommands(clientId),
            { body: client.SlashPure },
        );

        confirm();
    } catch (error) {
        console.log(chalk.bold.redBright('Ocurrió un error al intentar cargar los comandos slash'));
        console.error(error);
    }

	console.log(chalk.cyanBright('Calculando semilla y horario.'));
    let stt = Date.now();
    global.startuptime = stt;
    global.lechitauses = stt;
    global.seed = stt / 60000;
    
    await func.modifyAct(client, 0);

    console.log(chalk.yellowBright.italic('Cargando datos de base de datos...'));
    global.boorutags = booru.setTags();
    const gds = client.guilds;
    const sts = await Promise.all([
        gds.fetch(global.serverid.slot1),
        gds.fetch(global.serverid.slot2),
        gds.fetch(global.serverid.slot3)
    ]);
    global.slots = {
        'slot1': sts[0],
        'slot2': sts[1],
        'slot3': sts[2]
    };
    const logs = await Promise.all([
        global.slots.slot1.channels.resolve('870347940181471242'),
        global.slots.slot1.channels.resolve('870347965192097812')
    ]);
    global.logch = logs[0];
    global.confch = logs[1];
	confirm();

	console.log(chalk.magenta('Obteniendo información del host...'));
	dns.lookupService('127.0.0.1', 443, (err, hostname, service) => {
        global.bot_status.host = (err === null)?`${service}://${hostname}/`:'[host no detectado]';
    });
	confirm();
    global.puretable = Array(16).fill(null).map(() => Array(16).fill('828736342372253697'));

	console.log(chalk.rgb(158,114,214)('Registrando fuentes...'));
    registerFont('fonts/Alice-Regular.ttf', { family: 'headline' });
    registerFont('fonts/teen bd.ttf', { family: 'cardname' });
    registerFont('fonts/kirsty rg.otf', { family: 'cardclass' });
    registerFont('fonts/cuyabra.otf', { family: 'cardhint' });
    registerFont('fonts/asap-condensed.semibold.ttf', { family: 'cardbody' });
	confirm();

    global.logch.send({ embeds: [new Discord.MessageEmbed()
        .setColor('DARK_VIVID_PINK')
        .setAuthor('Mensaje de sistema')
        .setTitle('Bot conectado y funcionando')
        .addField('Host', (global.bot_status.host === 'https://localhost/') ? 'https://heroku.com/' : 'localhost', true)
        .addField('N. de versión', global.bot_status.version.number, true)
        .addField('Fecha', `<t:${Math.floor(Date.now() / 1000)}:f>`, true)
    ]});
    global.maintenance = '';
	console.log(chalk.greenBright.bold('Bot conectado y funcionando.'));
});

client.on('messageCreate', async (message) => { //En caso de recibir un mensaje
    const channel = message.channel;
    if(global.maintenance.length > 0 && channel.id !== global.maintenance) return;
    const author = message.author;
    if(global.cansay === 0 && author.bot) return;
    const msg = message.content.toLowerCase();
    const guild = message.guild;

    //#region Operaciones de proceso e ignorar mensajes privados
    const logembed = new Discord.MessageEmbed()
        .addField(author.tag, '*Mensaje vacío.*');
    if(guild) {
        logembed
            .setAuthor(`${guild.name} • ${channel.name} (Click para ver)`, author.avatarURL({ dynamic: true }), message.url)
            .setFooter(`gid: ${guild.id} | cid: ${channel.id} | uid: ${author.id}`);
        if(msg.length) logembed.fields[0].value = message.content;
    } else {
        logembed
            .setAuthor('Mensaje privado (Click para ver)', author.avatarURL({ dynamic: true }), message.url)
            .setFooter(`uid: ${author.id}`);
        if(msg.length) logembed.fields[0].value = message.content;
        channel.send({ content: ':x: Uh... disculpá, no trabajo con mensajes directos.' });
        return;
    }
    
    if(message.attachments.size > 0)
        logembed.addField('Adjuntado:', message.attachments.map(attf => attf.url).join('\n'));

    if(msg.startsWith(',confession ')) global.confch.send({ embeds: [logembed] });
    else global.logch.send({ embeds: [logembed] });

    const infr = global.hourai.infr;
    const whitech = infr.channels;

    if(guild.id === global.serverid.hourai && !whitech[channel.id]) {
        const uinfr = infr.users;
        const banpf = [ /^p!\w/, /^!\w/, /^->\w/, /^\$\w/, /^\.\w/, /^,(?!confession)\w/, /^,,\w/, /^~\w/, /^\/\w/ ];
        if(banpf.some(bp => msg.match(bp))) {
            const now = Date.now();
            const mui = author.id;
            
            if(!uinfr[mui])
            uinfr[mui] = [];
            
            //Sancionar según total de infracciones cometidas en los últimos 25 minutos
            uinfr[mui] = uinfr[mui].filter(inf => (now - inf) / 1000 < (60 * 25)); //Eliminar antiguas
            const total = uinfr[mui].push(now); //Añade el momento de la infracción actual y retorna el largo del arreglo
            
            switch(total) {
            case 1:
                channel.send({
                    reply: { messageReference: message.id },
                    content: `Detecto... bots fuera de botposteo <:empty:856369841107632129>`
                });
                break;
            case 2:
                channel.send({
                    reply: { messageReference: message.id },
                    allowedMentions: { repliedUser: true },
                    content: `Párale conchetumare, vete a <#${Object.keys(whitech).find(key => whitech[key] === 'botposting')}> <:despair:852764014840905738>`
                });
                break;
            default:
                channel.send({
                    reply: { messageReference: message.id },
                    allowedMentions: { repliedUser: true },
                    content: 'Ahora sí te cagaste ijoelpico <:tenshismug:859874631795736606>'
                });
                const hd = '682629889702363143'; //Hanged Doll
                const gd = channel.guild;
                const member = message.member;
                try {
                    if(!member.roles.cache.some(r => r.id === hd))
                        member.roles.add(hd);
                } catch(err) {
                    channel.send({ content: `<:wtfff:855940251892318238> Ese wn tiene demasia'o ki. Cuélgalo tú po'.\n\`\`\`\n${err.name}` });
                }
                break;
            }
        }
    }
    //#endregion

    //#region Estadísticas
    {
        const mgi = guild.id, mci = channel.id, mmi = author.id;
        stats.read++;
        stats[mgi] = stats[mgi] || {};
        stats[mgi][mci] = stats[mgi][mci] || {};
        stats[mgi][mci].cnt = (stats[mgi][mci].cnt || 0) + 1;
        stats[mgi][mci].sub = stats[mgi][mci].sub || {};
        stats[mgi][mci].sub[mmi] = (stats[mgi][mci].sub[mmi] || 0) + 1;
    }
    //#endregion

    //#region Respuestas rápidas
    //Hourai Doll; "Hourai"
    if(message.channel.guild.id === global.serverid.hourai || message.channel.guild.id === global.serverid.nlp) {
        const hrai = msg.indexOf('hourai');
        const hraipf = global.hourai.replies.ignore.prefix;
        const hraisf = global.hourai.replies.ignore.suffix;
        const hraifound = hrai !== -1 && !(hraipf.some(pf => msg.indexOf(`${pf}hourai`) === (hrai - pf.length)) || hraisf.some(sf => msg.indexOf(`hourai${sf}`) === hrai));
        if(hraifound && message.author.id !== global.peopleid.bern) {
            const fuckustr = (msg.indexOf('puré') !== -1 || msg.indexOf('pure') !== -1)?global.hourai.replies.compare:global.hourai.replies.taunt;
            message.channel.send({ content: fuckustr[Math.floor(Math.random() * fuckustr.length)]});
            //message.channel.send({ content: 'Descanse en paz, mi pana <:pensaki:852779998351458344>' });
        } else if(msg.startsWith('~echo ') || msg.startsWith('$say ')) {
            async function responder(ch) {
                const fuckustr = global.hourai.replies.reply;
                ch.send({ content: fuckustr[Math.floor(Math.random() * fuckustr.length)] });
            };
            setTimeout(responder, 800, message.channel);
        } else if(['q', 'que', 'qué'].some(i => i === msg))
            message.channel.send({ files: ['https://media.discordapp.net/attachments/670865125154095143/834115384927191080/so_epico-1.jpg?width=394&height=700'] });
    }
    
    //Uno en un Millón
    if(func.randRange(0, 1000000) === 0)
        func.dibujarMillion(message);
    //#endregion
    
    //#region Comandos
    //#region Detección de Comandos
    let pdetect;
    if(msg.startsWith(global.p_drmk)) pdetect = global.p_drmk;
    else if(msg.startsWith(global.p_pure)) pdetect = global.p_pure;
    else return; //Salir si no se encuentra el prefijo

    //Partición de mensaje comando
    const args = message.content.replace(/^p![\n ]*/g, '').split(/[\n ]+/); //Argumentos ingresados
    let nombrecomando = args.shift().toLowerCase(); //Comando ingresado
    let comando;
    if(pdetect === global.p_drmk) {
        //comando = client.ComandosDrawmaku.get(nombrecomando) || client.ComandosDrawmaku.find(cmd => cmd.aliases && cmd.aliases.includes(nombrecomando));
        channel.send({ content: '<:delete:704612795072774164> Los comandos de Drawmaku estarán deshabilitados por un tiempo indefinido. Se pide disculpas.' });
        return;
    } else if(pdetect === global.p_pure) 
        comando = client.ComandosPure.get(nombrecomando) || client.ComandosPure.find(cmd => cmd.aliases && cmd.aliases.includes(nombrecomando));
    
    if (!comando) {
        channel.send({ content: ':x: Disculpa, soy estúpida. Tal vez escribiste mal el comando y no te entiendo.' });
        return;
    }
    //#endregion

    //#region Ejecución de Comandos
    try {
        //Detectar problemas con el comando basado en flags
        let exception = null;
        comando.flags.forEach(flag => {
            const ex = cmdex.findExceptions(flag, message)
            if(ex) exception = ex;
        });
        if(exception) {
            channel.send({ embeds: [ cmdex.createEmbed(exception, { cmdString: `${pdetect}${nombrecomando}` }) ]});
            return;
        } else
            await comando.execute(message, args);
        stats.commands.succeeded++;
    } catch(error) {
        console.log(chalk.bold.redBright('Ha ocurrido un error al ingresar un comando.'));
        console.error(error);
        const errorembed = new Discord.MessageEmbed()
            .setColor('#0000ff')
            .setAuthor(`${guild.name} • ${channel.name} (Click para ver)`, author.avatarURL({ dynamic: true }), message.url)
            .setFooter(`gid: ${guild.id} | cid: ${channel.id} | uid: ${author.id}`)
            .addField('Ha ocurrido un error al ingresar un comando', `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\``)
            .addField('Detalle', `"${message.content.slice(0, 699)}"\n[${nombrecomando} :: ${args}]`);
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

	const slash = client.SlashPure.get(interaction.commandName);
	if (!slash) return;
    console.log(slash);

	try {
        const command = client.ComandosPure.get(interaction.commandName);
        console.log(command);
		await command.interact(interaction);
	} catch(error) {
        console.log('Ha ocurrido un error al procesar un comando slash.');
        console.log(`${interaction.commandName} (${interaction.commandId})`);
        console.error(error);
        const errorembed = new Discord.MessageEmbed()
            .setColor('#0000ff')
            .setAuthor(`${interaction.guild.name} • ${interaction.channel.name}`, interaction.member.user.avatarURL({ dynamic: true }))
            .setFooter(`gid: ${interaction.guild.id} | cid: ${interaction.channel.id} | uid: ${interaction.member.user.id}`)
            .addField('Ha ocurrido un error al procesar un comando slash', `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\``);
        global.logch.send({
            content: `<@${global.peopleid.papita}>`,
            embeds: [errorembed]
        });
        stats.commands.failed++;
		await interaction.reply({ content: 'Ocurrió un error al ejecutar el comando', ephemeral: true });
	}
});

client.on('guildMemberAdd', member => { //Evento de entrada a servidor
    const guild = member.guild;
    if(!guild.available) return;
    if(global.maintenance.length > 0 && guild.systemChannelId !== global.maintenance) return;
    console.log('Evento de entrada de usuario a servidor desencadenado.');
    const user = member.user;
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