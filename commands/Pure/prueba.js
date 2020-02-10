const Discord = require('discord.js'); //Integrar discord.js
const Canvas = require('canvas');
let global = require('../../config.json'); //Variables globales

async function dibujarBienvenida(msg) {
    const canvas = Canvas.createCanvas(1200, 750);
    const ctx = canvas.getContext('2d');

    const fondo = await Canvas.loadImage('./fondo.png');
    ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);

    const Texto = msg.author.username/*member*/;
    let fontSize = 72;
	while(ctx.measureText(Texto).width > (canvas.width - 200)) fontSize -= 2;
	ctx.font = `${fontSize}px sans-serif`;
	ctx.fillStyle = '#ffffff';
	ctx.fillText(msg.member.displayName, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), 125 - fontSize / 2);

	ctx.beginPath();
	ctx.arc(canvas.width / 2, 300, 150, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.clip();

    const avatar = await Canvas.loadImage(msg.member.user.displayAvatarURL/*member.user.displayAvatarURL*/);
	ctx.drawImage(avatar, canvas.width / 2 - 150, 150, 300, 300);

    const imagen = new Discord.Attachment(canvas.toBuffer(), 'bienvenida.png');
    msg.channel.send(`Welcome to the server, ${msg.author.username/*member*/}!`, imagen);
}

module.exports = {
	name: 'prueba',
	execute(message, args) {
        if(message.author.id === '423129757954211880') dibujarBienvenida(message);
        else message.channel.send(':closed_lock_with_key: Solo Papita con Puré puede usar este comando.');
    },
};