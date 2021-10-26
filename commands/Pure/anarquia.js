const global = require('../../localdata/config.json'); //Variables globales
const { fetchUserID, fetchFlag } = require('../../func.js');
const { createCanvas, loadImage } = require('canvas');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const { p_pure } = require('../../localdata/prefixget');
const { Puretable, AUser } = require('../../localdata/models/puretable.js');
const { CommandOptionsManager } = require('../Commons/cmdOpts');

const maxexp = 30;
const options = new CommandOptionsManager()
	.addParam('posición', 	   'NUMBER', 'para especificar una celda a modificar', { poly: ['x','y'], optional: true })
	.addParam('emote', 		   'EMOTE',  'para especificar un emote a agregar',    { optional: true })
	.addFlag('h', 'horizontal', 		 'para usar la habilidad de línea horizontal')
	.addFlag('v', 'vertical', 			 'para usar la habilidad de línea vertical');

module.exports = {
	name: 'anarquia',
	aliases: [
		'anarquía', 'a'
	],
	brief: 'Para interactuar con la Tabla de Puré',
	desc: 'Para interactuar con la __Tabla de Puré__\n' +
		'**Tabla de Puré**: tablero de 16x16 celdas de emotes ingresados por usuarios de cualquier server\n\n' +
		'Puedes ingresar un `<emote>` en una `<posición(x,y)>` o, al no ingresar nada, ver la tabla\n' +
		'La `<posicion(x,y)>` se cuenta desde 1x,1y, y el `<emote>` designado debe ser de un server del que yo forme parte~\n\n' +
		'De forma aleatoria, puedes ir desbloqueando habilidades para rellenar líneas completas en `--horizontal` o `--vertical`. La probabilidad inicial es 1% en conjunto, y aumenta +1% por cada __nivel__\n' +
		`**Nivel**: nivel de usuario en minijuego Anarquía. +1 por cada *30 usos*\n\n` +
		'Incluso si usas una habilidad de línea, debes ingresar ambos ejes (`x,y`) en orden\n' +
		`Ingresa únicamente \`p\` para ver tu perfil anárquico`,
	flags: [
		'common',
		'game'
	],
	options,
	callx: '<posición(x,y)?> <emote?>',
	experimental: true,

	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} args
	 * @param {Boolean} isSlash
	 */
	async execute(request, args, isSlash = false) {
		const loademotes = global.loademotes;
		//Ver tabla
		if(!(isSlash ? args.data : args).length) {
			const canvas = createCanvas(864, 960);
			const ctx = canvas.getContext('2d');

			//#region Encabezado
			ctx.textBaseline = 'top';
			ctx.fillStyle = '#ffffff';
			ctx.strokeStyle = '#bd0924';
			ctx.lineWidth = 9;
			ctx.font = `bold 116px "headline"`;
			const Texto = 'Tabla de Puré';
			const xcenter = (canvas.width / 2) - (ctx.measureText(Texto).width / 2);
			ctx.strokeText(Texto, xcenter, 4);
			ctx.fillText(Texto, xcenter, 4);
			//#endregion

			//Dibujar emotes en imagen
			const puretable = (await Puretable.findOne({})).cells;
			const size = 48;
			const tx = canvas.width / 2 - size * puretable.length / 2;
			const ty = ctx.measureText('M').emHeightDescent + 12;
			puretable.map((arr, y) => {
				arr.map((item, x) => {
					ctx.drawImage(loademotes[item], tx + x * size, ty + y * size, size, size)
				});
			});
			
			const imagen = new MessageAttachment(canvas.toBuffer(), 'anarquia.png');
			await request.reply({ files: [imagen] });
			return;
		}

		//Revisar perfil
		if((isSlash ? args.data : args)[0] === 'p') {
			args.shift();
			const search = (args.length) ? args.join(' ') : undefined;
			const aid = (search) ? fetchUserID(search, request) : request.author.id;
			const auser = await AUser.findOne({ userId: aid });
			if(!aid) {
				request.channel.send({ content: `:warning: Usuario **${search}** no encontrado` });
				return;
			}
			const user = request.client.users.cache.get(aid);
			const embed = new MessageEmbed()
				.setColor('#bd0924')
				.setAuthor(user.username, user.avatarURL({ format: 'png', dynamic: true, size: 512 }));
			if(auser)
				embed.setTitle('Perfil anárquico')
					.addField('Inventario', `↔️ x ${auser.skills.h}\n↕ x ${auser.skills.v}`, true)
					.addField('Rango', `Nivel ${Math.floor(auser.exp / 30) + 1} (exp: ${auser.exp % maxexp})`, true);
			else
				embed.setTitle('Perfil inexistente')
					.addField(
						'Este perfil anárquico no existe todavía', `Usa \`${p_pure(request.guildId).raw}anarquia <posición(x,y)> <emote>\` para colocar un emote en la tabla de puré y crearte un perfil anárquico automáticamente\n` +
						`Si tienes más dudas, usa \`${p_pure(request.guildId).raw}ayuda anarquia\``
					);
			await request.channel.send({ embeds: [embed] });
			return;
		}
		
		//Ingresar emotes a tabla
		const author = request.author || request.user;
		const auser = (await AUser.findOne({ userId: author.id }))
			|| new AUser({ userId: author.id });
		//Tiempo de enfriamiento por usuario
		if((Date.now() - auser.last) / 1000 < 3) {
			if(isSlash) request.reply({ content: '⌛ ¡No tan rápido!', ephemeral: true });
			else request.react('⌛');
			return;
		} else auser.last = Date.now();

		//Variables de ingreso
		const h = isSlash ? options.fetchFlag(args, 'horizontal', { callback: (auser.skills.h > 0) }) : fetchFlag(args, { short: ['h'], long: ['horizontal'], callback: (auser.skills.h > 0) });
		const v = isSlash ? options.fetchFlag(args, 'vertical', { callback: (auser.skills.h > 0) }) : fetchFlag(args, { short: ['v'], long: ['vertical'], callback: (auser.skills.v > 0) });
		let e = {};
		let ematch = isSlash
			? args.getString('emote')
			: args.find(arg => arg.match(/^<a*:\w+:[0-9]+>\B/));
		if(ematch) {
			ematch = ematch.slice(ematch.lastIndexOf(':') + 1, -1);
			if(request.client.emojis.cache.has(ematch))
				e.id = ematch;
		}

		if(isSlash) {
			e.x = args.getInteger('posición_x') - 1;
			e.y = args.getInteger('posición_y') - 1;
		} else {
			const axis = args.findIndex((arg, i) => !isNaN(arg) && !isNaN(args[i + 1]));
			if(axis >= 0) {
				e.x = args[axis] - 1;
				e.y = args[axis + 1] - 1;
			}
		}

		if(Object.keys(e).length !== 3 || !e.id || e.x === undefined) {
			const errorcomms = [];
			if(!isSlash)
				errorcomms.push(request.react('⚠️'));
			errorcomms.push(request.reply({
				content:
					'⚠️ Entrada inválida\n' +
					`Usa \`${p_pure(request.guildId).raw}ayuda anarquia\` para más información`,
				ephemeral: true,
			}));
			await Promise.all(errorcomms);
			return;
		}

		//Insertar emote en x,y
		const cells = (await Puretable.findOne({})).cells;
		const stx = e.x, sty = e.y;
		e.x = Math.max(0, Math.min(e.x, cells[0].length - 1));
		e.y = Math.max(0, Math.min(e.y, cells.length - 1));

		//Cargar imagen nueva si no está registrada
		if(!loademotes.hasOwnProperty(e.id))
			loademotes[e.id] = await loadImage(request.client.emojis.cache.get(e.id).url);

		if(!h && !v) cells[e.y][e.x] = e.id;
		else {
			console.log('wasd');
			if(h) { for(let i = 0; i < cells[0].length; i++) cells[e.y][i] = e.id; auser.skills.h--; }
			if(v) { for(let i = 0; i < cells.length; i++)    cells[i][e.x] = e.id; auser.skills.v--; }
			auser.markModified('skills');
			if(isSlash) await request.reply({ content: '⚡ ***¡Habilidad usada!***', ephemeral: true });
			else await request.react('⚡');
		}
		await Puretable.updateOne({}, { cells: cells });

		//Sistema de nivel de jugador y adquisición de habilidades
		const userlevel = Math.floor(auser.exp / maxexp) + 1;
		const r = Math.random();
		if(r < userlevel / 100) {
			if(Math.random() < 0.5) {
				auser.skills.h++;
				if(isSlash) await request.reply({ content: '🌟 ¡Recibiste **1** ↔️ *Habilidad Horizontal*!', ephemeral: true });
				else await request.react('↔️');
			} else {
				auser.skills.v++;
				if(isSlash) await request.reply({ content: '🌟 ¡Recibiste **1** ↕️ *Habilidad Vertical*!', ephemeral: true });
				else await request.react('↕️');
			}
			auser.markModified('skills');
		}
		auser.exp++;
		await auser.save();

		const offlimits = (stx !== e.x || sty !== e.y) ? true : false;
		if(isSlash)
			await request.reply({
				content: (offlimits
					? '☑️ Emote[s] colocado[s] con *posición corregida*'
					: '✅ Emote[s] colocado[s]'
					).replace(/\[s\]/g, (h || v) ? 's' : ''),
				ephemeral: true,
			});
		else await request.react(offlimits ? '☑️' : '✅');

		if((auser.exp % maxexp) == 0)
			await request.reply({ content: `¡**${request.author.username}** subió a nivel **${userlevel + 1}**!` });
	}
};