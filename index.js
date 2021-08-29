//#region Carga de módulos necesarios
const fs = require('fs'); //Sistema de archivos
const Discord = require('discord.js'); //Soporte JS de la API de Discord
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
    allowedMentions: { parse: [ 'users', 'roles' ] }
});
const Keyv = require('keyv');
//const keyv = new Keyv('postgresql://sxiejhineqmvsg:d0b53a4f62e2cf77383908ff8d281e4a5d4f7db7736abd02e51f0f27b6fc6264@ec2-35-175-170-131.compute-1.amazonaws.com:5432/da27odtfovvn7n');
//keyv.on('error', err => console.error('Keyv connection error:', err));
const global = require('./localdata/config.json'); //Propiedades globales
const func = require('./func.js'); //Funciones globales
const stats = require('./localdata/stats.json');
const booru = require('./localdata/boorutags.js');
const dns = require('dns'); //Detectar host
const { registerFont } = require('canvas'); //Registrar fuentes al ejecutar Bot
const chalk = require('chalk'); //Consola con formato bonito
const token = (process.env.I_LOVE_MEGUMIN)?process.env.I_LOVE_MEGUMIN:require('./key.json').token; //La clave del bot
//#endregion

//#region Detección de archivos de comandos
client.ComandosDrawmaku = new Discord.Collection(); //Comandos de Drawmaku
let commandFiles = fs.readdirSync('./commands/Drawmaku').filter(file => file.endsWith('.js')); //Lectura de comandos de bot
for(const file of commandFiles) {
	const command = require(`./commands/Drawmaku/${file}`);
	client.ComandosDrawmaku.set(command.name, command);
}
client.ComandosPure = new Discord.Collection(); //Comandos de Pure
commandFiles = fs.readdirSync('./commands/Pure').filter(file => file.endsWith('.js')); //Lectura de comandos de bot
for(const file of commandFiles) {
    command = require(`./commands/Pure/${file}`);
	client.ComandosPure.set(command.name, command);
}
//#endregion

/*client.once('ready', async () => {
    keyv.set();
});*/

client.on('ready', async () => { //Confirmación de inicio y cambio de estado
    const confirm = () => console.log(chalk.green('Hecho.'));
	console.log(chalk.cyanBright('Calculando semilla y horario...'));
    let stt = Date.now();
    global.startuptime = stt;
    global.lechitauses = stt;
    global.seed = stt / 60000;
	confirm();
    
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
    global.logch = global.slots.slot1.channels.resolve('870347940181471242');
    global.confch = global.slots.slot1.channels.resolve('870347965192097812');
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

	console.log(chalk.greenBright.bold('Bot conectado y funcionando.'));
});

client.on('messageCreate', message => { //En caso de recibir un mensaje
    if(global.maintenance.length > 0 && message.channel.id !== global.maintenance) return;
    const msg = message.content.toLowerCase();

    //#region palta -> aguacate
    if(message.guild && [global.serverid.hourai, global.serverid.usd, global.serverid.nlp].includes(message.guild.id) && msg.indexOf('aguacate') !== -1) {
        let paltastr = msg.replace(/aguacate/g, 'palta');
        let paltaname = message.member.nickname;
        if(!paltaname) paltaname = message.author.username;

        message.channel.send({ content: `**${paltaname}:**\n${paltastr}` });
        message.delete();
    }
    //#endregion
    
    //Ignorar mensajes de bots desde este punto
    if(global.cansay === 0 && message.author.bot) return;

    //#region Operaciones de proceso e ignorar mensajes privados
    const logembed = new Discord.MessageEmbed()
        .addField(message.author.tag, '*Mensaje vacío.*');
    if(message.guild) {
        logembed
            .setAuthor(`${message.guild.name} • ${message.channel.name} (Click para ver)`, message.author.avatarURL({ dynamic: true }), message.url)
            .setFooter(`gid: ${message.guild.id} | cid: ${message.channel.id} | uid: ${message.author.id}`);
        if(message.content.length)
            logembed.fields[0].value = message.content;
    } else {
        logembed
            .setAuthor('Mensaje privado (Click para ver)', message.author.avatarURL({ dynamic: true }), message.url)
            .setFooter(`uid: ${message.author.id}`);
        if(message.content.length)
            logembed.fields[0].value = message.content;
        message.channel.send({ content: ':x: Uh... disculpá, no trabajo con mensajes directos.' });
        return;
    }
    
    if(message.attachments.size > 0)
        logembed.addField('Adjuntado:', message.attachments.map(attf => attf.url).join('\n'));

    if(message.content.startsWith(',confession ')) global.confch.send({ embeds: [logembed] });
    else global.logch.send({ embeds: [logembed] });

    const whitech = [
        '671820448207601684', //botposting          habilitado para uso general
        '662317620699332627', //autómatas           habilitado para testeo
        '813189609911353385', //gachahell           habilitado para gacha
        '813195795318177802', //trata-de-waifus     habilitado para gacha
        '674422177596178437', //muteposting         habilitado para música
        '673353484514492417', //hornyposting        habilitado para NSFW
    ];

    if(message.guild.id === global.serverid.hourai && !whitech.some(bc => message.channel.id == bc)) {
        const banpf = [ /^p!\w/, /^!\w/, /^->\w/, /^\$\w/, /^\.\w/, /^,(?!confession)\w/, /^,,\w/, /^~\w/, /^\/\w/ ];
        if(banpf.some(bp => message.content.toLowerCase().match(bp))) {
            console.log('Detectado uso incorrecto de comando');
            const now = Date.now();
            const mui = message.author.id;
            
            if(!global.hourai.infr[mui])
                global.hourai.infr[mui] = []; //Resentir
            else {
                //Sancionar según total de infracciones cometidas en los últimos 10 minutos
                global.hourai.infr[mui] = global.hourai.infr[mui].filter(inf => (now - inf) / 1000 < (60 * 10)); //Eliminar antiguas
                const total = global.hourai.infr[mui].push(now); //Añade el momento de la infracción actual y retorna el largo del arreglo
                
                switch(total) {
                case 1:
                    message.channel.send({ content: 'Detecto.. bots fuera de botposteo... <:empty:856369841107632129>' });
                    break;
                case 2:
                    message.channel.send({ content: `**${message.author.tag}** párale conchetumare, vete a <#${whitech[0]}> <:despair:852764014840905738>` });
                    break;
                default:
                    message.channel.send({ content: 'Ahora sí te cagaste ijoelpico <:tenshismug:859874631795736606>' });
                    const hd = '682629889702363143'; //Hanged Doll
                    const gd = message.channel.guild;
                    const member = gd.members.cache.get(message.author.id);
                    try {
                        if(!member.roles.cache.some(r => r.id === hd))
                            member.roles.add(hd);
                    } catch(err) {
                        message.channel.send({ content: `<:wtfff:855940251892318238> Ese wn tiene demasia'o ki. Cuélgalo tú po'.\n\`\`\`\n${err.name}` });
                    }
                    break;
                }
            }
        }
    }
    //#endregion

    //#region Estadísticas
    const mgi = message.guild.id, mci = message.channel.id, mmi = message.author.id;
    stats.read++;
    stats[mgi] = stats[mgi] || {};
    stats[mgi][mci] = stats[mgi][mci] || {};
    stats[mgi][mci].cnt = (stats[mgi][mci].cnt || 0) + 1;
    stats[mgi][mci].sub = stats[mgi][mci].sub || {};
    stats[mgi][mci].sub[mmi] = (stats[mgi][mci].sub[mmi] || 0) + 1;
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
    else if(msg.startsWith(global.p_mention)) pdetect = global.p_mention;
    else return; //Salir si no se encuentra el prefijo

    //Partición de mensaje comando
    const args = message.content.slice(pdetect.length).split(/ +/); //Argumentos ingresados
    const nombrecomando = args.shift().toLowerCase(); //Comando ingresado

    let comando;
    if(pdetect === global.p_drmk) {
        //comando = client.ComandosDrawmaku.get(nombrecomando) || client.ComandosDrawmaku.find(cmd => cmd.aliases && cmd.aliases.includes(nombrecomando));
        message.channel.send({ content: '<:delete:704612795072774164> Los comandos de Drawmaku estarán deshabilitados por un tiempo indefinido. Se pide disculpas.' });
        return;
    } else if(pdetect === global.p_pure || pdetect === global.p_mention) 
        comando = client.ComandosPure.get(nombrecomando) || client.ComandosPure.find(cmd => cmd.aliases && cmd.aliases.includes(nombrecomando));
    
    if (!comando) {
        message.channel.send({ content: ':x: Disculpa, soy estúpida. Tal vez escribiste mal el comando y no te entiendo.' });
        return;
    }
    //#endregion

    //#region Ejecución de Comandos
    try {
        //Detectar problemas con el comando basado en flags
        let errtitle, errfield;
        if(comando.flags.some(flag => {
            switch(flag) {
            case 'outdated':
                if(message.author.id === global.peopleid.papita) return false;
                errtitle = 'Comando desactualizado';
                errfield = 'El comando no se encuentra disponible debido a que su función ya no es requerida en absoluto. Espera a que se actualice~';
                return true;

            case 'maintenance':
                if(message.author.id === global.peopleid.papita) return false;
                errtitle = 'Comando en mantenimiento';
                errfield = 'El comando no se encuentra disponible debido a que está en proceso de actualización o reparación en este momento. Espera a que se actualice~';
                return true;
            
            case 'guide':
                errtitle = 'Símbolo de página de guía';
                errfield = `Esto no es un comando, sino que una *página de guía* para buscarse con \`${global.p_pure}ayuda\``;
                return true;

            case 'mod':
                if(message.member.permissions.has('MANAGE_ROLES') || message.member.permissions.has('MANAGE_MESSAGES')) return false;
                errtitle = 'Comando exclusivo para moderación';
                errfield = 'El comando es de uso restringido para moderación.\n**Considero a alguien como moderador cuando** tiene permisos para administrar roles *(MANAGE_ROLES)* o mensajes *(MANAGE_MESSAGES)*';
                return true;
            
            case 'papa':
                if(message.author.id === global.peopleid.papita) return false;
                errtitle = 'Comando exclusivo de Papita con Puré';
                errfield = 'El comando es de uso restringido para el usuario __Papita con Puré#6932__. Esto generalmente se debe a que el comando es usado para pruebas o ajustes globales/significativos/sensibles del Bot';
                return true;

            case 'hourai':
                if(message.author.id === global.peopleid.papita || message.channel.guild.id === global.serverid.hourai) return false;
                errtitle = 'Comando exclusivo de Hourai Doll';
                errfield = 'El comando es de uso restringido para el servidor __Hourai Doll__. Esto generalmente se debe a que cumple funciones que solo funcionan allí';
                return true;
                
            default:
                return false;
            }
        })) {
            //En caso de detectar un problema, enviar embed reportando el estado del comando
            message.channel.send({ embeds: [
                new Discord.MessageEmbed()
                    .setColor('#f01010')
                    .setAuthor('Un momento...')
                    .setTitle(`${errtitle}`)
                    .addField(`${pdetect}${nombrecomando}`, `${errfield}`)
                    .setFooter('¿Dudas? ¿Sugerencias? Contacta con Papita con Puré#6932')
            ]});
            return;
        } else //En cambio, si no se detectan problemas, finalmente ejecutar comando
            comando.execute(message, args);
        stats.commands.succeeded++;
    } catch(error) {
        console.log('Ha ocurrido un error al ingresar un comando.');
        console.log(message.content);
        console.error(error);
        const errorembed = new Discord.MessageEmbed()
            .setColor('#0000ff')
            .setAuthor(`${message.guild.name} • ${message.channel.name} (Click para ver)`, message.author.avatarURL({ dynamic: true }), message.url)
            .setFooter(`gid: ${message.guild.id} | cid: ${message.channel.id} | uid: ${message.author.id}`)
            .addField('Ha ocurrido un error al ingresar un comando', `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\``);
        global.logch.send({
            content: `<@${global.peopleid.papita}>`,
            embeds: [errorembed]
        });
        stats.commands.failed++;
    }

    //Empezar cuenta regresiva luego de mod-empezar
    if(global.trest > 0 && !global.empezando) {
        console.log('Ejecutando cuenta regresiva...');
        global.empezando = true;
        setTimeout(func.restarSegundoEmpezar, 1000);
    }

    //Aceptar comandos por 1 tick al ejecutar p!papa-decir
    if(global.cansay > 0) global.cansay--;
    //#endregion
    //#endregion 
});

client.on('guildMemberAdd', member => { //Evento de entrada a servidor
    if(!member.guild.available) return;
    if(global.maintenance.length > 0 && member.guild.systemChannelId !== global.maintenance) return;
    console.log('Evento de entrada de usuario a servidor desencadenado.');
    try {
        if(!member.user.bot) func.dibujarBienvenida(member);
        else member.guild.channels.cache.get(member.guild.systemChannelId).send({
            content:
                'Se acaba de unir un bot.\n' +
                '***Beep boop, boop beep?***'
        });
    } catch(error) {
        console.log('Ha ocurrido un error al dar la bienvenida.');
        console.error(error);
        const errorembed = new Discord.MessageEmbed()
            .setColor('#0000ff')
            .setAuthor(member.guild.name)
            .setFooter(`gid: ${member.guild.id} | uid: ${member.user.id}`)
            .addField('Ha ocurrido un error al dar la bienvenida', `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\``);
        global.logch.send({
            content: `<@${global.peopleid.papita}>`,
            embeds: [errorembed]
        });
    }
});

client.on('guildMemberRemove', member => { //Evento de salida de servidor
    if(!member.guild.available) return;
    if(global.maintenance.length > 0 && member.guild.systemChannelId !== global.maintenance) return;
    console.log('Evento de salida de usuario de servidor desencadenado.');
    try {
        if(!member.user.bot) func.dibujarDespedida(member);
        else member.guild.channels.cache.get(member.guild.systemChannelId).send({
            content: `**${member.displayName}** ya no es parte de la pandilla de bots de este servidor :[\n`
        });
    } catch(error) {
        console.log('Ha ocurrido un error al dar la despedida.');
        console.error(error);
        const errorembed = new Discord.MessageEmbed()
            .setColor('#0000ff')
            .setAuthor(member.guild.name)
            .setFooter(`gid: ${member.guild.id} | uid: ${member.user.id}`)
            .addField('Ha ocurrido un error al dar la despedida', `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\``);
        global.logch.send({
            content: `<@${global.peopleid.papita}>`,
            embeds: [errorembed]
        });
    }
});

client.login(token); //Ingresar sesión con el bot