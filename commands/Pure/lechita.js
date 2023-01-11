const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../localdata/config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales
const axios = require('axios');
const Canvas = require('canvas');
const { utils } = require('../../localdata/images.json'); //Funciones globales
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

async function resolverLink(req, linkRes, iSize, isnsfw, isSlash) {
	let iurl;

	const response = await axios.get(linkRes).catch(() => null);

	if(response) {
		const user = req.author ?? req.user;
		//Si se pasó un enlace, comprobar su funcionamiento y devolverlo si es accesible
		if(response.status !== 200) {
			const errorResponse = { content: ':warning: Ocurrió un error al descargar la imagen\n```\n' + response.status + '\n```\nToma cum.' };
			if(isSlash) req.channel.send(errorResponse);
			else req.reply(errorResponse);
			return user.avatarURL({ format: 'png', size: iSize });
		}
		if(isnsfw || (!linkRes.includes('.gif') && !linkRes.includes('.mp4') && (response.data.toString().length / 1024) < 256))
			return linkRes;
		
		const errorResponse = { content: ':warning: La imagen es muy grande (>256KB) o tiene un formato inválido. Toma cum.' };
		if(isSlash) req.channel.send(errorResponse);
		else req.reply(errorResponse);

		return user.avatarURL({ format: 'png', size: iSize });
	}

	//Si no se pasó un enlace u ocurrió un error inesperado, intentar resolver enlace de un emote o usuario
	if((linkRes.startsWith('<:') || linkRes.startsWith('<a:')) && linkRes.endsWith('>')) {
		//Resolver de emote
		linkRes = linkRes.slice(linkRes.lastIndexOf(':') + 1, -1);
		return req.guild.emojis.resolve(linkRes).url;
	}

	//Resolver de usuario
	linkRes = func.fetchUserID(linkRes, req);
	if(linkRes !== undefined)
		return req.client.users.cache.get(linkRes).avatarURL({ format: 'png', size: iSize });

	return iurl;
};

async function dibujarCum(msg, link) {
	cum = await Canvas.loadImage(utils.cum);
	fondo = await Canvas.loadImage(link);
	canvas = Canvas.createCanvas(fondo.width, fondo.height);
	ctx = canvas.getContext('2d');

	ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
	ctx.drawImage(cum, 0, 0, canvas.width, canvas.height);

	const imagen = new Discord.MessageAttachment(canvas.toBuffer(), 'cummies.png');
	return msg.reply({ files: [imagen] });
};

const options = new CommandOptionsManager()
	.addParam('objetivo', { name: 'Texto', expression: [ 'USER', 'EMOTE', 'IMAGE' ] },  'para disparar a un usuario, emote o imagen (<=256KB)', { optional: true });
const flags = new CommandMetaFlagsManager().add(
	'MEME',
	'CHAOS',
);
const command = new CommandManager('lechita', flags)
	.setAliases('leche', 'cum', 'cummies', 'milk', 'milkies')
	.setBriefDescription('Disparo lechita a ti o a quien especifiques. Funciona un poco diferente en canales NSFW')
	.setLongDescription(
		'Disparo leche a ti o a lo que especifiques 😳',
		'**Nota:** en canales marcados como NSFW, el resultado será diferente',
	)
	.setOptions(options)
	.setExecution(async (request, args, isSlash) => {
		const isnsfw = request.channel.isThread()
			? request.channel.parent.nsfw
			: request.channel.nsfw;
		
		const target = isSlash ? (args.getString('objetivo')?.trim() ?? '') : args.join(' ');
		const user = request.author ?? request.user;

		if(isnsfw) {
			let bglink;
			if(args.length) bglink = await resolverLink(request, target, 1024, true, isSlash);
			else bglink = user.avatarURL({ format: 'png', size: 1024 });

			return dibujarCum(request, bglink);
		}

		let bglink;
		if(!target)
			bglink = user.avatarURL({ format: 'png', size: 256 });
		else if(!(target.startsWith('<:') || target.startsWith('<a:')) || !target.endsWith('>'))
			bglink = await resolverLink(request, target, 256, false, isSlash);

		const coomer = [
			'<:wtfchomu:725582341401083967>',
			'<:seyanaSugus:854731350199500810>',
			'<:rember:748621002677944400>',
			'<:reibu:686220828773318663>',
			'<:miyoi:674823039086624808>',
			'<:kogablush:654504689873977347>',
			'<:knoipuais:751176163182772244>',
			'<:keikuwu:725572179101614161>',
			'<:haniwaSmile:659872119995498507>',
			'<:GigaChad:748623625653059584>',
			'<:anzub:704641772399362068>',
		];
		const randcoomer = Math.floor(Math.random() * coomer.length);
		
		if(bglink == undefined)
			return request.reply({ content: `${coomer[randcoomer]} <:lechita:931409943448420433> ${target}` });
			
		const guildTime = Date.now() - global.lechitauses;
		const lastMilked = Math.floor(guildTime / 1000);
		const minSpan = 3;
		
		if(lastMilked <= minSpan) 
			return request.reply({ content: `⛔ Solo puedes crear emotes cada ${minSpan} segundos (compartido globalmente).` });

		global.lechitauses = Date.now();
		const cumote = await request.client.guilds.cache.get(global.serverid.slot2).emojis.create(bglink, user.id)
		return request.reply({ content: `${coomer[randcoomer]} <:lechita:931409943448420433> ${cumote}` })
		.then(() => cumote.delete());
	});

module.exports = command;