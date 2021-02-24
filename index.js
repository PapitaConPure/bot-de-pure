//#region Inclusión de cabeceras
const fs = require('fs'); //Integrar operaciones sistema de archivos de consola
const Discord = require('discord.js'); //Integrar discord.js
const client = new Discord.Client({ fetchAllMembers: true }); //Cliente de bot
const { //Constantes globales
    p_drmk, //prefijo drawmaku
    p_pure, //prefijo puré
    p_mention, //prefijo puré
} = require('./config.json');
const token = 'NjUxMjUwNjY5MzkwNTI4NTYx.XeXWSg.SFwfEZuCVNIVz8BS-AqFsntG6KY'; //La llave del bot
const global = require('./config.json'); //Variables globales
const func = require('./func.js'); //Funciones globales
const Canvas = require('canvas'); 
const { randInt } = require('./func.js');
const presence = require('./presence.json');
module.exports = { Discord };
//#endregion

//#region Establecimiento de Comandos
client.ComandosDrawmaku = new Discord.Collection(); //Comandos de Drawmaku
var commandFiles = fs.readdirSync('./commands/Drawmaku').filter(file => file.endsWith('.js')); //Lectura de comandos de bot
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

function modifyAct(pasuwus) { //Cambio de estado constante; créditos a Imagine Breaker y Sassafras
    //Actualización de actividad
    console.log(`Iniciando cambio de presencia ${pasuwus}...`);
    client.user.setActivity(
        presence.status[randInt(0, presence.status.length)],
        { type: 'STREAMING', url: `https://www.youtube.com/watch?v=${presence.stream[randInt(0, presence.stream.length)]}` }
    );
    console.log('Cambio de presencia finalizado.');
    
    //Programar próxima actualización de actividad
    const stepwait = randInt(30, 70);
    setTimeout(modifyAct, 1000 * 60 * stepwait, pasuwus + 1);
    console.log(`Esperando ciclo ${pasuwus + 1} en ${stepwait} minutos...`);
}

client.on('ready', () => { //Confirmación de inicio y cambio de estado
    let stt = Date.now();
    global.startuptime = stt;
    global.lechitauses = stt;
    global.seed = stt / 60000;
    modifyAct(0);
    //func.saveState();//func.reloadState();
	console.log('Bot conectado y funcionando.');
});

async function dibujarMillion(msg) { //Dar felicitaciones al desgraciado
    console.log('Evento "Uno en un Millón" detonado...')
    const canal = msg.channel; //Canal de mensajes de sistema

    //#region Creación de imagen
    const canvas = Canvas.createCanvas(1500, 750);
    const ctx = canvas.getContext('2d');

    const fondo = await Canvas.loadImage('./fondo3.png');
    ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
    //#endregion

    //#region Texto
    //#region Propiedades de texto
    ctx.textBaseline = 'bottom';
    ctx.shadowOffsetX = shadowOffsetY = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'black';
    ctx.fillStyle = '#ffffff';
    //#endregion

    //#region Nombre del usuario
    let Texto = `${msg.author.username}`;
    let fontSize = 72;
    while(ctx.measureText(Texto).width > (canvas.width - 200)) fontSize -= 2;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), 80);
    //#endregion
    
    //#region Texto inferior
    Texto = 'Uno en Un Millón';
    fontSize = 120;
    while(ctx.measureText(Texto).width > (canvas.width - 150)) fontSize -= 2;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), canvas.height - 15);
    Texto = '¡Felicidades! Tu mensaje es el destacado de';
    ctx.font = `bold 48px sans-serif`;
    ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), canvas.height - fontSize - 30);
    //#endregion
    //#endregion

    //#region Foto de Perfil
    //#region Sombra
    const ycenter = (80 + (canvas.height - fontSize - 48 - 30)) / 2;
    ctx.shadowOffsetX = shadowOffsetY = 8;
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#36393f';
    ctx.arc(canvas.width / 2, ycenter, 150, 0, Math.PI * 2, true);
    ctx.fill();
    //#endregion

    //#region Imagen circular
	ctx.beginPath();
	ctx.arc(canvas.width / 2, ycenter, 150, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.clip();
    const avatar = await Canvas.loadImage(msg.author.avatarURL({ format: 'png', dynamic: false, size: 1024 }));
	ctx.drawImage(avatar, canvas.width / 2 - 150, ycenter - 150, 300, 300);
    //#endregion
    //#endregion

    const imagen = new Discord.MessageAttachment(canvas.toBuffer(), 'felicidades.png');

    //#region Imagen y Mensaje extra
    canal.send('', imagen).then(sent => {
        if(msg.channel.guild.id === '654471968200065034') { //Hourai Doll
            canal.send(
                `*Wao, <@${msg.author.id}>, tu mensaje fue seleccionado de entre un millón de otros mensajes. No ganaste nada, pero felicidades <:meguSmile:694324892073721887>*\n` +
                '*Bueno, de hecho, te ganaste esta imagen personalizada para presumir a los demás tu __suerte de uno en un millón__ <:merry:670116052788838420>*\n' +
                '```\n' +
                `${msg.content}` +
                '```\n'
            );
        } else { //Animal Realm
            canal.send(
                `***ES:** ¡WOAH, FELICIDADES <@${msg.author.id}>! ¡Este mensaje fue nominado como uno en un millón!*\n` +
                '*Realmente no ganaste nada. Pero hey, ¡ahora tienes esta imagen personalizada para presumir tu __suerte de uno en un millón__!*\n\n' +
                `***EN:** WOAH, CONGRATZ <@${msg.author.id}>! This message has been nominated as one in a million!*\n` +
                `*You really didn't win anything. But hey, now you have this customized image to show off your __one in a million luck__!*\n\n` +
                '```\n' +
                `${msg.content}` +
                '```\n'
            );
        }
    });
    //#endregion

    console.log('Evento "Uno en un Millón" finalizado.');
}

client.on('message', message => { //En caso de recibir un mensaje
    const msg = message.content.toLowerCase();

    if(msg.indexOf('aguacate') !== -1) {
        let paltastr = msg.replace(/aguacate/g, 'palta');
        let paltaname = message.member.nickname;
        if(paltaname === undefined || paltaname === null) paltaname = message.author.username;

        message.channel.send(`**${paltaname}:**\n` + paltastr);
        message.delete();
    }

    //Dulce Victoria(tm)
    //Escuchar mensajes en canal de gacha
    if(message.channel.id === '813189609911353385' || message.channel.id === '739513729649082490')
        //Si se detecta un embed y tiene nombre de autor "Megumin", proceder con el plan
        if(message.embeds.length > 0) {
            if(message.embeds.some(embed => (embed.author === null)?false:(embed.author.name.indexOf('Megumin') !== -1))) {
                //Dar rol para gacha: 813194804161806436
                //message.react('💖');
                message.channel.guild.members.cache.get('423129757954211880').roles.add('813194804161806436');

                //Notificar
                const thingyembed = new Discord.MessageEmbed()
                    .setTitle(`Megumin po ${message.author.username}`)
                    .setColor('#dc143c')
                    .setAuthor('Un weón que se ve así', message.author.avatarURL({ format: 'png', dynamic: true, size: 1024 }))
                    .addField('Mensaje', `"${message.content}"`)
                    .addField('URL', `${message.url}`);
                client.users.cache.get('423129757954211880').send(thingyembed);
            }
        }
    
    if(global.cansay === 0) { if(message.author.bot) return; } //Hacer que el bot no sea un pelotudo (ignorar mensajes de bots)
    
    //Hacer que el bot de hecho sea inteligente (messages log)
    if(message.guild) {
        console.log(`[${message.guild.name.substr(0,12)}::${message.guild.id} → #${message.channel.name.substr(0,8)}::${message.channel.id}] ${message.author.username}: "${message.content}"`);
        if(message.attachments.size > 0)
            console.log(`[[${message.attachments.map(attf => attf.url).join(', ')}]]`);
    } else {
        console.log(`[DM→@${message.author.id}] ${message.author.username}: "${message.content}"`);
        message.channel.send(':x: Uh... disculpá, no trabajo con mensajes directos.');
        return;
    }

    //#region Respuestas rápidas
    //#region Mensajes weones
    if(message.channel.guild.id === global.serverid.hourai || message.channel.guild.id === global.serverid.slot2) {
        const hrai = msg.indexOf('hourai');
        const hraipf = [
            'elixir ',
            'muñeca '
        ];
        const hraisf = [
            'doll',
            ' doll',
            ' victim',
            ' elixir',
            ' ningyou',
            'san'
        ];
        const hraifound = hrai !== -1 && !(hraipf.some(pf => msg.indexOf(`${pf}hourai`) === (hrai - pf.length)) || hraisf.some(sf => msg.indexOf(`hourai${sf}`) === hrai));
        if(hraifound) {
            let fuckustr = [];
            if(msg.indexOf('puré') !== -1 || msg.indexOf('pure') !== -1)
                fuckustr = [
                    '***__Recuerden:__ soy objetivamente mejor que Hourai <:haniwaSmile:659872119995498507>***',
                    '**Bot > Puré > Papita > Hourai <:miyoi:674823039086624808>**',
                    'Pero la reputa, dejen de compararme con esa weá <:meguDerp:708064265092726834>',
                    '*__Recuerden niñas:__ Hourai come tula 24/7 <:haniwaSmile:659872119995498507>*',
                    'Ah, te hacei el gracioso conchetumare? <:yoom:749728988137652365>',
                    'Disculpa cuál es tu problema? <:perropistola:748626491457273966>'
                ];
            else
                fuckustr = [
                    '*¿Pero y a ti quién te invitó? <:mayuwu:654489124413374474>*',
                    'Oe qliao creo que se te cayó la tula <:pepe:697320983106945054>',
                    'Hourai puto <:knoipuais:751176163182772244>',
                    '***No hablen de esa weá <:aruStare:697497314884845658>***',
                    'Cierra el osiko tonto qliao <:yumou:708158159180660748>',
                    '¿Pero por qué no me xupai el pico mejor, así altiro? Aweonao <:junkNo:697321858407727224>',
                    'Pero no digai tantas weás po <:koipwaise:657346542847524875>',
                    'Puta que son pesaos con el Hourai <:notlikealice:654489127202586634>',
                    '**CSM NO HABLEN DE HOURAI** <:poutSumi:698658511474786364>'
                ];
            message.channel.send(fuckustr[Math.floor(Math.random() * fuckustr.length)]);
        } else if(msg.startsWith('~echo ') || msg.startsWith('$say ')) {
            async function responder(ch) {
                const fuckustr = [
                    'Cállate puta <:haniwaSmile:659872119995498507>',
                    'Tu madre, por si acaso <:haniwaSmile:659872119995498507>',
                    '*Pero no seas puto <:haniwaSmile:659872119995498507>*',
                    'Qué decí? <:yuyuthink:722516632345247834>',
                    'Ahhh, el culiao bravo eh? Vení que te rajo '
                ];
                ch.send(fuckustr[Math.floor(Math.random() * fuckustr.length)]);
            };
            setTimeout(responder, 800, message.channel);
        }
    }
    //#endregion

    //#region Uno en un millón
    const millionchance = Math.floor(Math.random() * 1000000);
    if(millionchance === 0) {
        message.channel.startTyping();
        dibujarMillion(message);
        message.channel.stopTyping(true);
    }
    //#endregion
    //#endregion

    //#region papa-reiniciar
    if(message.content.toLowerCase().startsWith(`${p_pure}papa-reiniciar`)) {
        if (message.author.id === '423129757954211880') {
            message.channel.send(':arrows_counterclockwise: apagando...\n_Nota: puedes comprobar si el bot se reinició viendo el log del proceso._')
            .then(sent => {
                console.log('Apagando.');
                message.channel.stopTyping(true);
                process.exit();
            }).catch(error => {
                console.error(error);
            });
        } else message.channel.send(':closed_lock_with_key: Solo Papita con Puré puede usar este comando.');
        return;
    }
    //#endregion
    
    //#region Comandos
    //#region Detección de Comandos
    let pdetect;
    if(message.content.toLowerCase().startsWith(p_drmk)) pdetect = p_drmk;
    else if(message.content.toLowerCase().startsWith(p_pure)) pdetect = p_pure;
    else if(message.content.toLowerCase().startsWith(p_mention)) pdetect = p_mention;
    else return; //Salir si no se encuentra el prefijo

    const args = message.content.slice(pdetect.length).split(/ +/); //Argumentos ingresados
    const nombrecomando = args.shift().toLowerCase(); //Comando ingresado

    let comando;
    if(pdetect === p_drmk) {
        //comando = client.ComandosDrawmaku.get(nombrecomando) || client.ComandosDrawmaku.find(cmd => cmd.aliases && cmd.aliases.includes(nombrecomando));
        message.channel.send('<:delete:704612795072774164> Los comandos de Drawmaku estarán deshabilitados por un tiempo indefinido. Se pide disculpas.');
        return;
    } else if(pdetect === p_pure || pdetect === p_mention) 
        comando = client.ComandosPure.get(nombrecomando) || client.ComandosPure.find(cmd => cmd.aliases && cmd.aliases.includes(nombrecomando));
    
    if (!comando) {
        message.channel.send(':x: Disculpa, soy estúpido. Tal vez escribiste mal el comando y no te entiendo.');
        return;
    }
    //#endregion

    //#region Ejecución de Comandos
    try {
        comando.execute(message, args);
    } catch(error) {
        console.log('Ha ocurrido un error al ingresar un comando.');
        console.error(error);
        message.channel.send(
            `\`\`\`js\n${error}\n\`\`\`` +
            '<@!423129757954211880>\n');
    }

    //Empezar cuenta regresiva luego de mod-empezar
    if(global.trest > 0 && !global.empezando) {
        console.log('Ejecutando cuenta regresiva...');
        global.empezando = true;
        setTimeout(func.restarSegundoEmpezar, 1000);
    }
    //#endregion

    if(global.cansay > 0) global.cansay--; //Hacer que el bot sea incluso menos pelotudo (aceptar comandos de sí mismo si fueron escritos con p!papa-decir)
    //#endregion 
});

//#region Mensajes de sistema
async function dibujarBienvenida(miembro) { //Dar bienvenida a un miembro nuevo de un servidor
    const servidor = miembro.guild; //Servidor
    const canal = servidor.channels.cache.get(servidor.systemChannelID); //Canal de mensajes de sistema

    if(typeof canal === 'undefined') {
        console.log('El servidor no tiene canal de mensajes de sistema.');
        servidor.owner.user.send(
            '¡Hola, soy Bot de Puré!\n' +
            `¡Un nuevo miembro, **<@${miembro.id}> (${miembro.id})**, ha entrado a tu servidor **${servidor.name}**!\n\n` +
            '*Si deseas que envíe una bienvenida a los miembros nuevos en lugar de enviarte un mensaje privado, selecciona un canal de mensajes de sistema en tu servidor.*\n' +
            '*__Nota:__ Bot de Puré no opera con mensajes privados.*'
        );
        return;
    }

    console.log(`Un usuario ha entrado a ${servidor.name}...`);
    if(!servidor.me.permissionsIn(canal).has(['SEND_MESSAGES', 'VIEW_CHANNEL'])) {
        console.log('No se puede enviar un mensaje de bienvenida en este canal.');
        return;
    }
    canal.startTyping();
    
    //#region Creación de imagen
    const canvas = Canvas.createCanvas(1275, 825);
    const ctx = canvas.getContext('2d');

    const fondo = await Canvas.loadImage('./fondo.png');
    ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
    //#endregion

	
    //#region Texto
    //#region Propiedades de texto
    ctx.textBaseline = 'bottom';
    ctx.shadowOffsetX = shadowOffsetY = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'black';
    ctx.fillStyle = '#ffffff';
    //#endregion

    //#region Nombre del usuario
    let Texto = `${miembro.displayName}`;
    let fontSize = 72;
    while(ctx.measureText(Texto).width > (canvas.width - 200)) fontSize -= 2;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), 80);
    //#endregion
    
    //#region Texto inferior
    if(servidor.id === '611732083995443210') Texto = 'Animal Realm!';
    else Texto = `${servidor.name}!`;
    fontSize = 120;
    while(ctx.measureText(Texto).width > (canvas.width - 150)) fontSize -= 2;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), canvas.height - 15);
    Texto = '¡Bienvenid@ a';
    ctx.font = `bold 48px sans-serif`;
    ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), canvas.height - fontSize - 30);
    //#endregion
    //#endregion
	

    //#region Foto de Perfil
    //#region Sombra
    const ycenter = (80 + (canvas.height - 10/*fontSize*/ - 48 - 30)) / 2;
    ctx.shadowOffsetX = shadowOffsetY = 8;
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#36393f';
    ctx.arc(canvas.width / 2, ycenter, 150, 0, Math.PI * 2, true);
    ctx.fill();
    //#endregion

    //#region Imagen circular
    ctx.beginPath();
    ctx.arc(canvas.width / 2, ycenter, 150, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    const avatar = await Canvas.loadImage(miembro.user.displayAvatarURL({ format: 'png', dynamic: false, size: 1024 }));
    ctx.drawImage(avatar, canvas.width / 2 - 150, ycenter - 150, 300, 300);
    //#endregion
    //#endregion
	
    const imagen = new Discord.MessageAttachment(canvas.toBuffer(), 'bienvenida.png');

    //#region Imagen y Mensaje extra
    const peoplecnt = servidor.members.cache.filter(member => !member.user.bot).size;
    canal.send({files: [imagen]}).then(sent => {
        if(servidor.id === '654471968200065034') { //Hourai Doll
            canal.send(
                `Wena po <@${miembro.user.id}> conchetumare, como estai. Porfa revisa el canal <#671817759268536320> para que no te funemos <:haniwaSmile:659872119995498507> \n` +
                'También elige un rol de color (debajo de este mensaje) y pídele el que te guste a alguno de los enfermos que trabajan aquí <:mayuwu:654489124413374474> \n' +
                'Nota: si no lo haces, lo haré por ti, por aweonao <:junkNo:697321858407727224>\n' +
                'WENO YA PO CSM. <@&654472238510112799>, vengan a saludar maricones <:venAqui:668644938346659851><:miyoi:674823039086624808><:venAqui2:668644951353065500>\n' +
                `*Por cierto, ahora hay **${peoplecnt}** wnes en el server* <:meguSmile:694324892073721887>\n` +
                'https://imgur.com/D5Z8Itb'
            );
            setTimeout(func.askForRole, 1000 * 60 * 5, miembro, canal);
            console.log('Esperando evento personalizado de Hourai Doll en unos minutos...');
        } else if(servidor.id === '611732083995443210') { //Animal Realm
            canal.send(
                `Welcome to the server **${miembro.displayName}**! / ¡Bienvenido/a al server **${miembro.displayName}**!\n\n` +
                `**EN:** To fully enjoy the server, don't forget to get 1 of the 5 main roles in the following channel~\n` +
                '**ES:** Para disfrutar totalmente del servidor, no olvides escoger 1 de los 5 roles principales en el siguiente canal~\n\n' +
                '→ <#611753608601403393> ←\n\n' +
                `*Ahora hay **${peoplecnt}** usuarios en el server.*`
            );
        } else { //Otros servidores
            canal.send(
                `¡Bienvenido al servidor **${miembro.displayName}**!\n` +
                `*Ahora hay **${peoplecnt}** usuarios en el server.*`
            );
        }
    });
    //#endregion
    console.log('Bienvenida finalizada.');
    canal.stopTyping(true);
}

async function dibujarDespedida(miembro) { //Dar despedida a ex-miembros de un servidor
    const servidor = miembro.guild;
    const canal = servidor.channels.cache.get(servidor.systemChannelID);

    if(typeof canal === 'undefined') {
        console.log('El servidor no tiene canal de mensajes de sistema.');
        return;
    }

    if(servidor.id === global.serverid.hourai) {
        const inadvertidos = [
            '225701598272290827', //Orphen
            '190681032935211008', //Sheep
            '632011537413963777', //Hikari
            //'212311832281612289', //Chise
            //'537080207580987402', //Aerza
            '263163573843263509' //Recycle
        ];

        if(inadvertidos.includes(miembro.id)) {
            servidor.owner.user.send(
                '¡Hola, soy Bot de Puré!\n' +
                `El miembro **<@${miembro.id}> (${miembro.id})** ha salido de tu servidor **${servidor.name}**...\n` +
                `¡Shhh! Si bien tienes un canal de mensajes de sistema establecido, este miembro se encuentra en una lista negra de despedidas.\n\n` +
                '*Si piensas que el usuario no debería estar en dicha lista negra, comunícate con mi creador~*\n' +
                '*__Nota:__ Bot de Puré no opera con mensajes privados.*'
            );
            console.log('Se ha inadvertido el usuario.');
            return;
        }

        /*servidor.owner.user.send(
            '¡Hola, soy Bot de Puré!\n' +
            `El miembro **<@${miembro.id}> (${miembro.id})** ha salido de tu servidor **${servidor.name}**...\n` +
            '*__Nota:__ Bot de Puré no opera con mensajes privados.*'
        );
        
        return;*/
    }

    console.log(`Un usuario ha salido de ${servidor.name}...`);
    if(!servidor.me.permissionsIn(canal).has(['SEND_MESSAGES', 'VIEW_CHANNEL'])) {
        console.log('No se puede enviar un mensaje de despedida en este canal.');
        return;
    }
    canal.startTyping();
    
    //#region Creación de imagen
    const canvas = Canvas.createCanvas(1500, 900);
    const ctx = canvas.getContext('2d');

    const fondo = await Canvas.loadImage('./fondo2.png');
    ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
    //#endregion

    //#region Texto
    //#region Propiedades de Texto
    ctx.textBaseline = 'bottom';
    ctx.shadowOffsetX = shadowOffsetY = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'black';
    ctx.fillStyle = '#ffffff';
    //#endregion

    //#region Nombre del usuario
    let Texto = `Adiós, ${miembro.displayName}`;
    let fontSize = 72;
    while(ctx.measureText(Texto).width > (canvas.width - 200)) fontSize -= 2;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), canvas.height - 40);
    //#endregion
    //#endregion

    //#region Foto de Perfil
    //#region Sombra
    const ycenter = 40 + 150;
    ctx.shadowOffsetX = shadowOffsetY = 8;
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#36393f';
    ctx.arc(canvas.width / 2, ycenter, 150, 0, Math.PI * 2, true);
    ctx.fill();
    //#endregion

    //#region Dibujar foto de perfil
	ctx.beginPath();
	ctx.arc(canvas.width / 2, ycenter, 150, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.clip();
    const avatar = await Canvas.loadImage(miembro.user.displayAvatarURL({ format: 'png', dynamic: false, size: 1024 }));
	ctx.drawImage(avatar, canvas.width / 2 - 150, ycenter - 150, 300, 300);
    //#endregion
    //#endregion

    const imagen = new Discord.MessageAttachment(canvas.toBuffer(), 'bienvenida.png');

    //#region Imagen y Mensaje extra
    const peoplecnt = servidor.members.cache.filter(member => !member.user.bot).size;
    canal.send({files: [imagen]}).then(sent => {
        if(servidor.id === '654471968200065034') { //Hourai Doll
            canal.send(
                'Nooooo po csm, perdimo otro weón \<:meguDerp:708064265092726834>' +
                `*Ahora quedan **${peoplecnt}** aweonaos en el server.*`
            );
        } else { //Otros servidores
            canal.send(
                `*Ahora hay **${peoplecnt}** usuarios en el server.*`
            );
        }
    });
    //#endregion
    console.log('Despedida finalizada.');
    canal.stopTyping();
}
 
client.on('guildMemberAdd', member => {
    console.log('Evento de entrada de usuario a servidor desencadenado.');
    try {
        if(!member.user.bot) dibujarBienvenida(member);
        else member.guild.channels.cache.get(member.guild.systemChannelID).send(
            'Se acaba de unir un bot.\n' +
            '***Beep boop, boop beep?***'
        );
    } catch(error) {
        console.log('Ha ocurrido un error al dar la bienvenida.');
        console.error(error);
    }
});

client.on('guildMemberRemove', member => {
    console.log('Evento de salida de usuario de servidor desencadenado.');
    try {
        if(!member.user.bot) dibujarDespedida(member);
        else member.guild.channels.cache.get(member.guild.systemChannelID).send(
            `**${member.displayName}** ya no es parte de la pandilla de bots de este servidor :[\n`
        );
    } catch(error) {
        console.log('Ha ocurrido un error al dar la despedida.');
        console.error(error);
    }
});
//#endregion

client.login(token); //Ingresar sesión con el bot