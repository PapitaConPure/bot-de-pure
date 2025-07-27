const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../localdata/config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales
const { default: axios } = require('axios');
const Canvas = require('canvas');
const { utils } = require('../../localdata/images.json'); //Funciones globales
const { CommandOptions, CommandTags, CommandManager, CommandOptionSolver } = require('../Commons/commands');
const { isThread } = require('../../func.js');

/**
 * 
 * @param {import('../Commons/typings').ComplexCommandRequest} request 
 * @param {String} linkRes 
 * @param {Discord.ImageURLOptions['size']} iSize 
 * @param {Boolean} isnsfw 
 * @param {CommandOptionSolver} args 
 */
async function resolverLink(request, linkRes, iSize, isnsfw, args) {
	let iurl;

	const reply = async (/**@type {String | Discord.MessagePayload | Discord.MessageCreateOptions | Discord.MessageReplyOptions}*/responseBody) => {
		return args.isInteractionSolver()
			? request.channel.send(responseBody)
			: request.reply(responseBody);
	}

	const response = await axios.get(linkRes).catch(() => null);

	if(response) {
		const user = request.user;
		//Si se pasó un enlace, comprobar su funcionamiento y devolverlo si es accesible
		if(response.status !== 200) {
			reply({ content: '⚠️ Ocurrió un error al descargar la imagen\n```\n' + response.status + '\n```\nToma cum.' });
			return user.avatarURL({ extension: 'png', size: iSize });
		}
		if(isnsfw || (!linkRes.includes('.gif') && !linkRes.includes('.mp4') && (response.data.toString().length / 1024) < 256))
			return linkRes;
		
		reply({ content: '⚠️ La imagen es muy grande (>256KB) o tiene un formato inválido. Toma cum.' });

		return user.avatarURL({ extension: 'png', size: iSize });
	}

	//Si no se pasó un enlace u ocurrió un error inesperado, intentar resolver enlace de un emote o usuario
	if((linkRes.startsWith('<:') || linkRes.startsWith('<a:')) && linkRes.endsWith('>')) {
		//Resolver de emote
		linkRes = linkRes.slice(linkRes.lastIndexOf(':') + 1, -1);
		return request.guild.emojis.resolve(linkRes).url;
	}

	//Resolver de usuario
	linkRes = await func.fetchUserID(linkRes, request);
	if(linkRes !== undefined)
		return request.client.users.cache.get(linkRes).avatarURL({ extension: 'png', size: iSize });

	return iurl;
};

async function dibujarCum(msg, link) {
	const cum = await Canvas.loadImage(utils.cum);
	const fondo = await Canvas.loadImage(link);
	const canvas = Canvas.createCanvas(fondo.width, fondo.height);
	const ctx = canvas.getContext('2d');

	ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
	ctx.drawImage(cum, 0, 0, canvas.width, canvas.height);

	const imagen = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: 'cummies.png' });
	return msg.reply({ files: [imagen] });
};

const options = new CommandOptions()
	.addParam('objetivo', { name: 'Texto', expression: [ 'USER', 'EMOTE', 'IMAGE' ] },  'para disparar a un usuario, emote o imagen (<=256KB)', { optional: true });

const flags = new CommandTags().add(
	'MEME',
	'CHAOS',
);
const command = new CommandManager('leche', flags)
	.setAliases('lechita', 'cum', 'cummies', 'milk', 'milkies')
	.setBriefDescription('Disparo lechita a ti o a quien especifiques. Funciona un poco diferente en canales NSFW')
	.setLongDescription(
		'Disparo leche a ti o a lo que especifiques 😳',
		'**Nota:** en canales marcados como NSFW, el resultado será diferente',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const isnsfw = isThread(request.channel)
			? request.channel.parent.nsfw
			: request.channel.nsfw;
		
		const target = args.getString('objetivo');
		const user = request.user;

		if(isnsfw) {
			let bglink;
			if(!args.empty) bglink = await resolverLink(request, target, 1024, true, args);
			else bglink = user.avatarURL({ extension: 'png', size: 1024 });

			return dibujarCum(request, bglink);
		}

		let bglink;
		if(!target)
			bglink = user.avatarURL({ extension: 'png', size: 256 });
		else if(!(target.startsWith('<:') || target.startsWith('<a:')) || !target.endsWith('>'))
			bglink = await resolverLink(request, target, 256, false, args);

		const coomer = [
			'<:merryawaise:1108320072491073576>',
			'<:seyanaSugus:854731350199500810>',
			'<:rember:1107843499946160219>',
			'<:reibu:1107876018171162705>',
			'<:reibu:1107876018171162705>',
			'<:kogaBlush:1108605873326141500>',
			'<:knoipuais:1108537934363250780>',
			'<:keikuwu:1107847996013551716> ',
			'<:haniwaSmile:1107847987201318944>',
			'<:bobBueno:1107847975205609503>',
			'<:tenshiJuguito:1107843487891734588>',
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
		const cumote = await request.client.guilds.cache.get(global.serverid.slot2).emojis.create({ attachment: bglink, name: user.id })
		return request.reply({ content: `${coomer[randcoomer]} <:lechita:931409943448420433> ${cumote}` })
		.then(() => cumote.delete());
	});

module.exports = command;