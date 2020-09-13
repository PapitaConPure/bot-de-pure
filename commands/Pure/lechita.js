const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales
const axios = require('axios');
const Canvas = require('canvas'); 

function dibujarCum(msg, link) {
	axios.get(link).then(async function (response, data) {
		if(response.status === 200) {
			const fondo = await Canvas.loadImage(link);
			const cum = await Canvas.loadImage('./cum.png');
			const canvas = Canvas.createCanvas(fondo.width, fondo.height);
			const ctx = canvas.getContext('2d');

			ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
			ctx.drawImage(cum, 0, 0, canvas.width, canvas.height);

			const imagen = new Discord.MessageAttachment(canvas.toBuffer(), 'cummies.png');
			msg.channel.send({files: [imagen]});
		} else
			msg.channel.send(':warning: Ocurrió un error al descargar la imagen\n```\n' + response.status + '\n```')
	}).catch(error => {
		console.error(error);
		//Resolver usuario
		let user = message.author;
		if(args.length) {
			user = func.resolverIDUsuario(link, message.channel.guild, message.client);
			if(user === undefined) {
				msg.channel.send(':warning: ¡Enlace o usuario inválido!');
				return;
			} else user = message.client.users.cache.get(user);
		}

		const fondo = await Canvas.loadImage(user.avatarURL({ format: 'png', size: 1024 }));
		const cum = await Canvas.loadImage('./cum.png');
		const canvas = Canvas.createCanvas(fondo.width, fondo.height);
		const ctx = canvas.getContext('2d');

		ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
		ctx.drawImage(cum, 0, 0, canvas.width, canvas.height);

		const imagen = new Discord.MessageAttachment(canvas.toBuffer(), 'cummies.png');
		msg.channel.send({files: [imagen]});
	});
}

module.exports = {
	name: 'lechita',
	aliases: [
		'leche',
		'cum', 'cummies', 'milk', 'milkies'
	],
	execute(message, args) {
        if(message.channel.nsfw) {
		    if(args.length) dibujarCum(message, args[0]);
		    else dibujarCum(message, message.author.avatarURL({ format: 'png', size: 1024 }));
        } else {
			const tiempoguild = Date.now() - global.lechitauses;
			const lechesec = Math.floor(tiempoguild/1000);
			if(lechesec > 10) {
				global.lechitauses = Date.now();
				const coomer = [
					'<:wtfchomu:725582341401083967>',
					'<:seyanaSugus:749810531518644394>',
					'<:rember:748621002677944400>',
					'<:reibu:686220828773318663>',
					'<:miyoi:674823039086624808>',
					'<:kogablush:654504689873977347>',
					'<:knoipuais:751176163182772244>',
					'<:keikuwu:725572179101614161>',
					'<:haniwaSmile:659872119995498507>',
					'<:GigaChad:748623625653059584>',
					'<:anzub:704641772399362068>'
				];
				const randcoomer = Math.floor(Math.random() * coomer.length);

				//Resolver usuario
				let user = message.author;
				if(args.length) {
					user = func.resolverIDUsuario(args[0], message.channel.guild, message.client);
					if(user === undefined) user = message.author;
					else user = message.client.users.cache.get(user);
				}

				message.client.guilds.cache.get(global.serverid.slot2).emojis.create(user.avatarURL({ format: 'png' }), message.author.id)
					.then(useremo => {
						message.channel.send(`${coomer[randcoomer]} <:lechita:674736445071556618> <:${useremo.name}:${useremo.id}>`)
						.then(() => useremo.delete());
					});
			} else message.channel.send(':no_entry_sign: Solo se puede hacer esto una vez cada 10 segundos para evitar abuso de la Bot API de Discord.');
        }
    },
};