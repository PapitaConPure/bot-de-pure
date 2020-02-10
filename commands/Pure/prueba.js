const Discord = require('discord.js'); //Integrar discord.js
const Canvas = require('canvas');
let global = require('../../config.json'); //Variables globales

async function dibujarBienvenida(msg) {
    const canvas = Canvas.createCanvas(1000, 750);
    const ctx = canvas.getContext('2d');

    const fondo = await Canvas.loadImage('./fondo.png');
    const avatar = await Canvas.loadImage(msg.member.user.displayAvatarURL/*member.user.displayAvatarURL*/);
    ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
	ctx.drawImage(avatar, 400, 200, 600, 400);

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