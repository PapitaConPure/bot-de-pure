const Discord = require('discord.js');
const global = require('../../config.json'); //Variables globales
const uses = require('../../sguses.json'); //Variables globales
const Canvas = require('canvas');

module.exports = {
	name: 'anarquia',
	aliases: [
		'anarquía', 'a'
	],
	desc: 'Para interactuar con la Tabla de Puré\n' +
		'**Tabla de Puré**: tablero de 16x16 celdas de emotes ingresados por usuarios\n' +
		'Puedes ingresar un `<emote>` en una `<posición(x,y)>` o, al no ingresar nada, ver la tabla\n' +
		'La `<posicion(x,y)>` se cuenta desde 1 hasta 16 (*no* desde 0 hasta 15), y el `<emote>` designado debe ser de un server del que yo forme parte~',
	flags: [
		'common'
	],
	options: [
	  '`<posición(x,y)?>` _(número [2])_ para especificar una celda a modificar',
	  '`<emote?>` _(emote)_ para especificar un emote a agregar'
	],
	callx: '<posición(x,y)?> <emote?>',

	execute(message, args) {
		if(!args.length) {
			const d = async () => {
				//Acción de comando
				Canvas.registerFont('./TommySoft.otf', { family: 'TommySoft' });
				const canvas = Canvas.createCanvas(864, 960);
				const ctx = canvas.getContext('2d');

				//#region Propiedades de texto
				ctx.textBaseline = 'top';
				ctx.fillStyle = '#ffffff';
				ctx.strokeStyle = '#bd0924';
				ctx.lineWidth = 9;
				ctx.font = `bold 116px "TommySoft"`;
				//#endregion

				//#region Nombre del usuario
				const Texto = '¡Tabla de Puré!';
				const xcenter = (canvas.width / 2) - (ctx.measureText(Texto).width / 2);
				ctx.fillText(Texto, xcenter, 4);
				ctx.strokeText(Texto, xcenter, 4);
				//#endregion

				let loademotes = {};
				//Conseguir enlaces de emotes
				const retornarEmote = async (arr) => {
					let narr = arr;
					return ;
				};

				const mapearEmotes = async () =>
					Promise.all(global.puretable.map(arr => 
						Promise.all(arr.slice(0).sort().filter((item, i, a) => (i > 0)?(item !== a[i - 1]):true).map(async item => {
							if(!loademotes.hasOwnProperty(item))
								loademotes[item] = await Canvas.loadImage(message.client.emojis.cache.get(item).url);
						}))
					)
				);

				mapearEmotes().then(() => {
					//Dibujar emotes en imagen
					const size = 48;
					const tx = canvas.width / 2 - size * global.puretable.length / 2;
					const ty = ctx.measureText('M').emHeightDescent + 12;
					global.puretable.map((arr, y) => {
						arr.map((item, x) => 
							ctx.drawImage(loademotes[item], tx + x * size, ty + y * size, size, size)
						);
					});
					
					const imagen = new Discord.MessageAttachment(canvas.toBuffer(), 'bienvenida.png');
					message.channel.send({ files: [imagen] });
				});
			};
			d();
		} else {
			//Tiempo de enfriamiento por usuario
			if(uses.anarquia[message.author.id] !== undefined)
				if((Date.now() - uses.anarquia[message.author.id]) / 1000 < 3) {
					message.react('⌛');
					return;
				}

			uses.anarquia[message.author.id] = Date.now();
			
			let e = {};
			args.map((arg, i) => {
				if(Object.keys(e).length < 3)
					if((arg.startsWith('<:') || arg.startsWith('<a:')) && arg.endsWith('>')) {
						arg = arg.slice(arg.indexOf(':') + 1, -1);
						arg = arg.slice(arg.indexOf(':') + 1);
						if(message.client.emojis.cache.get(arg) !== undefined)
							e.id = arg;
						else
							e.id = 'unresolved';
					} else if(e.x === undefined && !isNaN(arg) && !isNaN(args[i + 1])) {
						e.x = arg - 1;
						e.y = args[i + 1] - 1;
					}
			});
			
			if(Object.keys(e).length !== 3)
				message.channel.send(':warning: Entrada inválida\nUsa `p!ayuda anarquia` para más información');
			else if(e.id === 'unresolved')
				message.react('⚠️');
			else {
				const stx = e.x, sty = e.y;
				e.x = Math.max(0, Math.min(e.x, global.puretable.length - 1));
				e.y = Math.max(0, Math.min(e.y, global.puretable[0].length - 1));
				global.puretable[e.y][e.x] = e.id;
				uses.anarquia[message.author.id] = Date.now();
				if(stx !== e.x || sty !== e.y) message.react('☑️');
				else message.react('✅');
			}
		}
	}
};