//#region Inclusión de cabeceras
const fs = require('fs'); //Integrar operaciones sistema de archivos de consola
const Parse = require('parse/node');
const Discord = require('discord.js'); //Integrar discord.js
const { Client, RichEmbed } = require('discord.js'); //Ni idea, la verdad, pero aquí está
const client = new Discord.Client(); //Cliente de bot
const { //Constantes globales
    p_drmk, //prefijo drawmaku
    p_pure, //prefijo puré
} = require('./config.json');
const token = 'NjUxMjUwNjY5MzkwNTI4NTYx.XeXWSg.SFwfEZuCVNIVz8BS-AqFsntG6KY'; //La llave del bot
var global = require('./config.json'); //Variables globales
var func = require('./func.js'); //Funciones globales
const Sequelize = require('sequelize');
const Canvas = require('canvas');
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

client.on('ready', () => { //Confirmación de inicio y cambio de estado
	console.log('Bot conectado y funcionando.');
    client.user.setActivity("UwU 24/7", { type: 'STREAMING', url: 'https://www.youtube.com/watch?v=h_3ULXom6so' });
    global.startuptime = Date.now();
    //func.saveState();//func.reloadState();
});

async function dibujarMillion(msg) { //Dar felicitaciones al desgraciado
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
    const avatar = await Canvas.loadImage(msg.author.avatarURL);
	ctx.drawImage(avatar, canvas.width / 2 - 150, ycenter - 150, 300, 300);
    //#endregion
    //#endregion

    const imagen = new Discord.Attachment(canvas.toBuffer(), 'felicidades.png');

    //#region Imagen y Mensaje extra
    canal.send('', imagen).then(sent => {
        if(msg.channel.guild.id === '654471968200065034') { //Hourai Doll
            canal.send(
                `*Wao, <@${msg.author.id}>, tu mensaje fue seleccionado de entre un millón de otros mensajes. No ganaste nada, pero felicidades <:marx:675439504982671370>*\n` +
                '*Bueno, de hecho, te ganaste esta imagen personalizada para presumir a los demás tu __suerte de uno en un millón__ <:sakiGyate:659872130216755220>*\n' +
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
}

client.on('message', message => { //En caso de recibir un mensaje
    if(global.cansay === 0) { if(message.author.bot) return; } //Hacer que el bot no sea un pelotudo (ignorar mensajes de bots)
    console.log(`[${message.guild.name}→#${message.channel.name}] ${message.author.username}: "${message.content}"`); //Hacer que el bot de hecho sea inteligente (messages log)

    //#region Respuestas rápidas
    //#region Mensajes weones
    if(message.channel.guild.id === '654471968200065034') {
        const msg = message.content.toLowerCase();
        if(msg.indexOf('hourai') !== -1 && msg.indexOf('hourai doll') !== msg.indexOf('hourai') && (msg.indexOf('puré') !== -1 || msg.indexOf('pure') !== -1)) {
            const fuckustr = [
                '***__Recuerden:__ soy objetivamente mejor que Hourai <:haniwaSmile:659872119995498507>***',
                '**Bot > Puré > Papita > Hourai <:okinai:672173297428856862>**',
                'Pero la reputa, dejen de compararme con esa weá <:marx:675439504982671370>',
                '*__Recuerden niñas:__ Hourai come tula 24/7 <:haniwaSmile:659872119995498507>*'
            ];
            message.channel.send(fuckustr[Math.floor(Math.random() * fuckustr.length)]);
        } else if(msg.startsWith('~echo ') || msg.startsWith('$say ')) {
            async function responder(ch) {
                const fuckustr = [
                    'Cállate puta <:haniwaSmile:659872119995498507>',
                    'Tu madre, por si acaso <:haniwaSmile:659872119995498507>',
                    '*Pero no seas puto <:haniwaSmile:659872119995498507>*'
                ];
                ch.send(fuckustr[Math.floor(Math.random() * fuckustr.length)]);
            };
            setTimeout(responder, 800, message.channel);
        } else if(msg.indexOf('hourai') !== -1 && msg.indexOf('hourai doll') !== msg.indexOf('hourai') && msg.indexOf('houraidoll') === -1) {
            const fuckustr = [
                '*¿Pero y a tí quién te invitó? <:mayuwu:654489124413374474>*',
                'Hourai puto <:dedede:675764852106592276>',
                '***No hablen de esa weá <:dedede:675764852106592276>***',
                'Puta que son pesaos con el Hourai <:notlikealice:654489127202586634>',
                '**CSM NO HABLEN DE ESE BOT** <:marx:675439504982671370>'
            ];
            message.channel.send(fuckustr[Math.floor(Math.random() * fuckustr.length)]); 
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
    else return; //Salir si no se encuentra el prefijo

    const args = message.content.slice(p_drmk.length).split(/ +/); //Argumentos ingresados
    const nombrecomando = args.shift().toLowerCase(); //Comando ingresado

    let comando;
    if(pdetect === p_drmk)
        comando = client.ComandosDrawmaku.get(nombrecomando) || client.ComandosDrawmaku.find(cmd => cmd.aliases && cmd.aliases.includes(nombrecomando));
	else if(pdetect === p_pure)
        comando = client.ComandosPure.get(nombrecomando) || client.ComandosPure.find(cmd => cmd.aliases && cmd.aliases.includes(nombrecomando));
    
    if (!comando) {
        message.channel.send(':x: Disculpa, soy estúpido. Tal vez escribiste mal el comando y no te entiendo.');
        return;
    }
    //#endregion

    //#region Ejecución de Comandos
    message.channel.send('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    /*
    try {
        comando.execute(message, args);
    } catch(error) {
        console.log('Ha ocurrido un error al ingresar un comando.');
        console.error(error);
        message.channel.send(
            ':radioactive: :regional_indicator_w: :regional_indicator_a: :regional_indicator_r: :regional_indicator_n: :regional_indicator_i: :regional_indicator_n: :regional_indicator_g: :radioactive: \n' +
            'Ha ocurrido un error inesperado, porfavor reportar a Papita inmediatamente.\n' +
            ':radioactive: :regional_indicator_w: :regional_indicator_a: :regional_indicator_r: :regional_indicator_n: :regional_indicator_i: :regional_indicator_n: :regional_indicator_g: :radioactive:'
        );
    }*/

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
    const canal = servidor.channels.get(servidor.systemChannelID); //Canal de mensajes de sistema
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
    const avatar = await Canvas.loadImage(miembro.user.displayAvatarURL);
	ctx.drawImage(avatar, canvas.width / 2 - 150, ycenter - 150, 300, 300);
    //#endregion
    //#endregion

    const imagen = new Discord.Attachment(canvas.toBuffer(), 'bienvenida.png');

    //#region Imagen y Mensaje extra
    const peoplecnt = 1 + servidor.members.filter(member => !member.user.bot).size;
    canal.send('', imagen).then(sent => {
        if(servidor.id === '654471968200065034') { //Hourai Doll
            canal.send(
                'Wena po conchetumare, como estai. Porfa revisa el canal <#671817759268536320> o te funamos <:HaniwaSmile:659872119995498507>\n' +
                'También si quieres un rol de color revisa <#679150440612626479> y pídele el que te guste a alguno de los enfermos que trabajan aquí <:Mayuwu:654489124413374474>\n' +
                'WENO YA PO CONCHESUMARE. <@&654472238510112799>, vengan a saludar maricones <:marx:675439504982671370>\n' +
                `*Por cierto, ahora hay **${peoplecnt}** aweonaos en el server.*`
            );
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
    canal.stopTyping();
}

async function dibujarDespedida(miembro) { //Dar despedida a ex-miembros de un servidor
    const servidor = miembro.guild;
    const canal = servidor.channels.get(servidor.systemChannelID);
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
    const avatar = await Canvas.loadImage(miembro.user.displayAvatarURL);
	ctx.drawImage(avatar, canvas.width / 2 - 150, ycenter - 150, 300, 300);
    //#endregion
    //#endregion

    const imagen = new Discord.Attachment(canvas.toBuffer(), 'bienvenida.png');

    //#region Imagen y Mensaje extra
    const peoplecnt = 1 + servidor.members.filter(member => !member.user.bot).size;
    canal.send('', imagen).then(sent => {
        if(servidor.id === '654471968200065034') { //Hourai Doll
            canal.send(
                'Nooooo po csm, perdimo otro weón <:GatoSad:669332507942060042>' +
                `*Ahora quedan **${peoplecnt}** aweonaos en el server.*`
            );
        } else { //Otros servidores
            canal.send(
                `*Ahora hay **${peoplecnt}** usuarios en el server.*`
            );
        }
    });
    //#endregion
    canal.stopTyping();
}
 
client.on('guildMemberAdd', member => {
    try {
        if(!member.user.bot) dibujarBienvenida(member);
        else member.guild.channels.get(member.guild.systemChannelID).send(
            'Se acaba de unir un bot.\n' +
            '***Beep boop, boop beep?***'
        );
    } catch(error) {
        console.log('Ha ocurrido un error al dar la bienvenida.');
        console.error(error);
    }
});

client.on('guildMemberRemove', member => {
    try {
        if(!member.user.bot) dibujarDespedida(member);
        else member.guild.channels.get(member.guild.systemChannelID).send(
            `**${member.displayName}** ya no es parte de la pandilla de bots de este servidor :[\n`
        );
    } catch(error) {
        console.log('Ha ocurrido un error al dar la despedida.');
        console.error(error);
    }
});
//#endregion

client.login(token); //Ingresar sesión con el bot