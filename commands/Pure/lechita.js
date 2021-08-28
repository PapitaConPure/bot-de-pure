const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../localdata/config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales
const axios = require('axios');
const Canvas = require('canvas');
const { utils } = require('../../localdata/images.json'); //Funciones globales

async function resolverLink(msg, linkRes, iSize) {
	let iurl;

	await axios.get(linkRes).then(async function (response, data) {
		//Si se pasó un enlace, comprobar su funcionamiento y devolverlo si es accesible
		if(response.status === 200) {
			if(msg.channel.nsfw || ((linkRes.indexOf('.gif') + linkRes.indexOf('.mp4')) < 0 && (response.data.toString().length / 1024) < 256)) {
				iurl = linkRes;
			} else {
				msg.channel.send({ content: ':warning: La imagen es muy grande (>256KB) o tiene un formato inválido. Toma cum.' });
				iurl = msg.author.avatarURL({ format: 'png', size: iSize });
			}
		} else {
			msg.channel.send({ content: ':warning: Ocurrió un error al descargar la imagen\n```\n' + response.status + '\n```\nToma cum.' });
			iurl = msg.author.avatarURL({ format: 'png', size: iSize });
		}
	}).catch(function (error) {
		//Si no se pasó un enlace u ocurrió un error inesperado, intentar resolver enlace de un emote o usuario
		console.log('No se ha pasado un enlace en comando lechita o este no era válido/accesible.');

		if((linkRes.startsWith('<:') || linkRes.startsWith('<a:')) && linkRes.endsWith('>')) {
			//Resolver de emote
			console.log('Formato de emote detectado. Intentando resolver como emote.');
			linkRes = linkRes.slice(linkRes.indexOf(':') + 1, -1);
			linkRes = linkRes.slice(linkRes.indexOf(':') + 1);
			iurl = msg.guild.emojis.resolve(linkRes).url;
		} else {
			//Resolver de usuario
			console.log('Formato de emote no detectado. Intentando resolver como usuario.');
			linkRes = func.fetchUserID(linkRes, msg.channel.guild, msg.client);
			
			if(linkRes !== undefined)
				iurl = msg.client.users.cache.get(linkRes).avatarURL({ format: 'png', size: iSize });
			else {
				console.log('¡Enlace, emote o usuario inválido!');
				iurl = msg.author.avatarURL({ format: 'png', size: iSize });
			}
		}
	});

	console.log(iurl);
	return iurl;
}

async function dibujarCum(msg, link) {
	cum = await Canvas.loadImage(utils.cum);
	fondo = await Canvas.loadImage(link);
	canvas = Canvas.createCanvas(fondo.width, fondo.height);
	ctx = canvas.getContext('2d');

	ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
	ctx.drawImage(cum, 0, 0, canvas.width, canvas.height);

	const imagen = new Discord.MessageAttachment(canvas.toBuffer(), 'cummies.png');
	msg.channel.send({ files: [imagen] });
}

module.exports = {
	name: 'lechita',
	aliases: [
		'leche',
		'cum', 'cummies', 'milk', 'milkies'
	],
    desc: 'Disparo leche a ti o a lo que especifiques :flushed:\n**Nota:** en canales marcados como NSFW, el resultado será diferente',
    flags: [
        'meme'
    ],
    options: [
		'`<usuario?>` _(mención/texto/id)_ para disparar a un usuario',
		'`<emote?>` _(emote)_ para disparar a un emote',
		'`<imagen?>` _(imagen/enlace)_ para disparar a una imagen (<=256KB)'
    ],
	callx: '[<usuario?>/<emote?>/<imagen?>]',
	
	execute(message, args) {
		async function aaamipija() {
			if(message.channel.nsfw) {
				let bglink;
				if(args.length) bglink = await resolverLink(message, args[0], 1024);
				else bglink = message.author.avatarURL({ format: 'png', size: 1024 });

				dibujarCum(message, bglink);
			} else {
				let bglink;
				if(args.length) {
					if(!(args[0].startsWith('<:') || args[0].startsWith('<a:')) || !args[0].endsWith('>'))
						bglink = await resolverLink(message, args[0], 256);
				} else bglink = message.author.avatarURL({ format: 'png', size: 256 });

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
				
				if(bglink !== undefined) {
					const tiempoguild = Date.now() - global.lechitauses;
					const lechesec = Math.floor(tiempoguild/1000);
					const tiempoespera = 3;
					
					if(lechesec > tiempoespera) {
						global.lechitauses = Date.now();
						message.client.guilds.cache.get(global.serverid.slot2).emojis.create(bglink, message.author.id)
						.then(cumote => {
							message.channel.send({ content: `${coomer[randcoomer]} <:lechita:674736445071556618> ${cumote}` })
							.then(() => cumote.delete());
						});
					} else message.channel.send({ content: `:no_entry_sign: Solo puedes crear emotes cada ${tiempoespera} segundos (compartido globalmente).` });
				} else
					message.channel.send({ content: `${coomer[randcoomer]} <:lechita:674736445071556618> ${args[0]}` })
			}
		}

		aaamipija();
    },
};