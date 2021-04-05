const Discord = require('discord.js');
const global = require('../../config.json'); //Variables globales
const Canvas = require('canvas');

module.exports = {
	name: 'anarquia',
	aliases: [
		'anarquía', 'a'
	],
	desc: 'Para interactuar con la Tabla de Puré\n' +
		'**Tabla de Puré**: tablero de 16x16 celdas de emotes ingresados por usuarios\n\n' +
		'Puedes ingresar un `<emote>` en una `<posición(x,y)>` o, al no ingresar nada, ver la tabla',
	flags: [
		'common'
	],
	options: [
	  '`<posición(x,y)?>` para especificar una celda a modificar',
	  '`<emote?>` para especificar un emote a agregar'
	],
	callx: '<posición(x,y)?> <emote?>',

	execute(message, args) {
		if(!args.length) {
			const d = async () => {
				//Acción de comando
				//Canvas.registerFont('./TommySoft.otf', { family: 'TommySoft' });
				const canvas = Canvas.createCanvas(864, 960);
				const ctx = canvas.getContext('2d');

				//const fondo = await Canvas.loadImage('./fondo3.png');
				//ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);

				//#region Propiedades de texto
				ctx.textBaseline = 'top';
				ctx.fillStyle = '#ffffff';
				ctx.strokeStyle = '#000000';
				ctx.lineWidth = 10;
				ctx.font = `bold 128px "TommySoft"`;
				//#endregion

				//#region Nombre del usuario
				const Texto = '¡Anarquía!';
				const xcenter = (canvas.width / 2) - (ctx.measureText(Texto).width / 2);
				ctx.fillText(Texto, xcenter, 10);
				ctx.strokeText(Texto, xcenter, 10);
				//#endregion

				let loademotes = {};
				global.puretable.map(arr =>
					arr.sort().filter((item, i, a) => (i > 0)?(item !== a[i - 1]):true).map(item => {
						if(!loademotes.hasOwnProperty(item))
							loademotes[item] = message.client.emojis.cache.get(item).url;
					})
				);
				
				const imagen = new Discord.MessageAttachment(canvas.toBuffer(), 'bienvenida.png');
				//message.channel.send({ files: [imagen] });
				let str = '';
				for(const [id, url] of Object.entries(loademotes)) {
					str += `'${id}': ${url}\n`
				}
				message.channel.send(str);
			};
			d();
		} else {
			let e = {};
			args.map((arg, i) => {
				if((arg.startsWith('<:') || arg.startsWith('<a:')) && arg.endsWith('>')) {
					arg = arg.slice(arg.indexOf(':') + 1, -1);
					arg = arg.slice(arg.indexOf(':') + 1);
					e.id = arg;//message.client.emojis.resolve(arg);
				} else if(!isNaN(arg) && !isNaN(args[i + 1])) {
					e.x = arg;
					e.y = args[i + 1];
				}
			});

			
			if(Object.keys(e).length === 3) {
				global.puretable[e.x][e.y] = e.id;
				message.react('✅');
			} else
				message.channel.send(':warning: Entrada inválida\nUsa `p!ayuda anarquia` para más información');
		}
	}
};