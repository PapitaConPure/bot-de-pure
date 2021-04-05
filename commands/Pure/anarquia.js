const Discord = require('discord.js');
const global = require('../../config.json'); //Variables globales
const Canvas = require('canvas');

module.exports = {
	name: 'anarquia',
	aliases: [
		'anarquía'
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

			/*let str = '';
			for(const arr of global.puretable)
				str += arr.join('') + '\n';*/
			let loademotes = [];
			global.puretable.map(arr =>
				arr.sort().filter((item, i, a) => (i > 0)?(item !== a[i - 1]):true).map(item => {
					if(!loademotes.includes(item)) loademotes[loademotes.length] = item;
				})
			);
			
			//const imagen = new Discord.MessageAttachment(canvas.toBuffer(), 'bienvenida.png');
			//message.channel.send({ files: [imagen] });
			message.channel.sedn(loademotes.join(''));
		};
		d();
	}
};