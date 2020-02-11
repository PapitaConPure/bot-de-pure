const Discord = require('discord.js'); //Integrar discord.js
const Canvas = require('canvas');
let global = require('../../config.json'); //Variables globales

async function dibujarBienvenida(msg) {
    const canvas = Canvas.createCanvas(1200, 750);
    const ctx = canvas.getContext('2d');

    //#region Fondo
    const fondo = await Canvas.loadImage('./fondo.png');
    ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
    //#endregion

    //#region Nombre del usuario
    ctx.shadowOffsetX = shadowOffsetY = 0;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'black';
    const Texto = msg.member.displayName;
    let fontSize = 72;
	while(ctx.measureText(Texto).width > (canvas.width - 200)) fontSize -= 2;
	ctx.font = `${fontSize}px sans-serif`;
	ctx.fillStyle = '#ffffff';
	ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), 125 - fontSize / 2);
    //#endregion

    //#region Dibujar sombra de foto de perfil
    ctx.shadowOffsetX = shadowOffsetY = 8;
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#36393f';
    ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
    ctx.fill();
    //#endregion

    //Dibujar foto de perfil
	ctx.beginPath();
	ctx.arc(canvas.width / 2, 300, 150, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.clip();
    const avatar = await Canvas.loadImage(msg.member.user.displayAvatarURL/*member.user.displayAvatarURL*/);
	ctx.drawImage(avatar, canvas.width / 2 - 150, 150, 300, 300);

    const imagen = new Discord.Attachment(canvas.toBuffer(), 'bienvenida.png');
    msg.channel.send(``, imagen);
}

module.exports = {
	name: 'prueba',
	execute(message, args) {
        if(message.author.id === '423129757954211880') {
            if(message.channel.guild.id === '654471968200065034') message.channel.send('<@&654472238510112799>');
            dibujarBienvenida(message);
        } else message.channel.send(':closed_lock_with_key: Solo Papita con Puré puede usar este comando.');
    },
};