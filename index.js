//TRABAJAR CON DISCORD.JS Y HACER USO DE SISTEMAS DE ARCHIVOS
const fs = require('fs'); //Integrar operaciones sistema de archivos de consola
const Discord = require('discord.js'); //Integrar discord.js
const Parse = require('parse/node');
const { Client, RichEmbed } = require('discord.js'); //Ni idea, la verdad, pero aquí está
const { //Constantes globales
    p_drmk, //prefijo drawmaku
    p_pure, //prefijo puré
} = require('./config.json');
const token = 'NjUxMjUwNjY5MzkwNTI4NTYx.XeXWSg.SFwfEZuCVNIVz8BS-AqFsntG6KY'; //La llave del bot
var global = require('./config.json'); //Variables globales
var func = require('./func.js'); //Funciones globales
const client = new Discord.Client(); //Cliente de bot
const Sequelize = require('sequelize');
const Canvas = require('canvas');
//Establecer comandos
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

client.on('ready', () => {
	console.log('Bot conectado y funcionando.');
    client.user.setActivity("UwU 24/7", { type: 'STREAMING', url: 'https://www.youtube.com/watch?v=h_3ULXom6so' });
    //func.saveState();//func.reloadState();
});

client.on('message', message => { //En caso de recibir un mensaje
    if(global.cansay === 0) { if(message.author.bot) return; } 
    console.log(`[${message.guild.name}→#${message.channel.name}] ${message.author.username}: "${message.content}"`);

    if(message.content.toLowerCase().startsWith(`${p_pure}papa-reiniciar`)) {
        if (message.author.id === '423129757954211880') {
            message.channel.send(':arrows_counterclockwise: apagando...\n_Nota: puedes comprobar si el bot se reinició viendo el log del proceso._')
            .then(sent => {
                console.log('Apagando.');
                process.exit();
            }).catch(error => {
                console.error(error);
            });
        } else message.channel.send(':closed_lock_with_key: Solo Papita con Puré puede usar este comando.');
        return;
    }
    
    let pdetect;
    if(message.content.toLowerCase().startsWith(p_drmk)) pdetect = p_drmk;
    else if(message.content.toLowerCase().startsWith(p_pure)) pdetect = p_pure;
    else return; //Salir si no se encuentra el comando

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
    }

    //Empezar cuenta regresiva luego de mod-empezar
    if(global.trest > 0 && !global.empezando) {
        console.log('Ejecutando cuenta regresiva...');
        global.empezando = true;
        setTimeout(func.restarSegundoEmpezar, 1000);
    }

    if(global.cansay > 0) global.cansay--;
});

async function dibujarBienvenida(miembro) {
    const servidor = miembro.guild;
    const canal = servidor.channels.get(servidor.systemChannelID);

    //#region Creación de imagen
    const canvas = Canvas.createCanvas(1275, 825);
    const ctx = canvas.getContext('2d');

    //#region Fondo
    const fondo = await Canvas.loadImage('./fondo.png');
    ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
    //#endregion

    //#region Texto
    ctx.textBaseline = 'bottom';
    ctx.shadowOffsetX = shadowOffsetY = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'black';
    ctx.fillStyle = '#ffffff';
    //Nombre del usuario
    let Texto = miembro.displayName;
    let fontSize = 72;
    while(ctx.measureText(Texto).width > (canvas.width - 200)) fontSize -= 2;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), 80);
    
    //Texto inferior
    Texto = `${miembro.guild}!`;
    fontSize = 120;
    while(ctx.measureText(Texto).width > (canvas.width - 150)) fontSize -= 2;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), canvas.height - 15);
    Texto = '¡Bienvenid@ a';
    ctx.font = `bold 48px sans-serif`;
    ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), canvas.height - fontSize - 30);
    //#endregion

    //#region Dibujar sombra de foto de perfil
    const ycenter = (80 + (canvas.height - fontSize - 48 - 30)) / 2;
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

    const imagen = new Discord.Attachment(canvas.toBuffer(), 'bienvenida.png');
    //#endregion

    //Mandar imagen + mensaje bonito
    const peoplecnt = 1 + servidor.members.filter(member => !member.user.bot).size;
    try {
        canal.send('', imagen).then(sent => {
            /*if(servidor.id === '654471968200065034') {
                canal.send(
                    'Wena po conchetumare, como estai. Porfa revisa el canal <#671817759268536320> o te funamos <:HaniwaSmile:659872119995498507>\n' +
                    'También si quieres un rol de color revisa <#671831878902349824> y pídele el que te guste a alguno de los enfermos que trabajan aquí <:Mayuwu:654489124413374474>\n' +
                    'WENO YA PO CONCHESUMARE. <@&654472238510112799>, vengan a saludar maricones <:marx:675439504982671370>\n' +
                    `*Por cierto, ahora hay **${peoplecnt}** aweonaos en el server.*`
                );
            } else if(servidor.id === '611732083995443210') {*/
                canal.send(
                    `Welcome to the server! **/** ¡Bienvenido/a al server!\n\n` +
                    `**EN:** To fully enjoy the server, don't forget to get 1 of the 5 main roles in the following channel~\n` +
                    '**ES:** Para disfrutar totalmente del servidor, no olvides escoger 1 de los 5 roles principales en el siguiente canal~\n\n' +
                    '→ <#611753608601403393> ←'
                );
            /*} else {
                canal.send(
                    '¡Bienvenido al servidor!\n' +
                    `*Ahora hay **${peoplecnt}** usuarios en el server.*`
                );
            }*/
        });
    } catch(error) {
        console.log('Ha ocurrido un error al dar la bienvenida.');
        console.error(error);
    }
}
 
client.on('guildMemberAdd', member => {
    /*if(!member.user.bot)*/ dibujarBienvenida(member);
    /*else member.guild.channels.get(member.guild.systemChannelID).send(
        'Se acaba de unir un bot.\n' +
        '***Beep boop, boop beep?***'
    );*/
});

client.login(token);