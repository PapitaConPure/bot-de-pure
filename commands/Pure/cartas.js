const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales
const Canvas = require('canvas');

module.exports = {
	name: 'cartas',
	aliases: [
		'18'
	],
	desc: 'Dibuja una presentación de carta al estilo de Touhou 18 con el texto e imagen deseados\n' +
		'La carta es pasiva y cuesta ¥100 por defecto. Si la descripción es muy larga, no se verá completa',
	flags: [
		'common'
	],
	options: [
		'`<desc>` _(texto)_ para describir la carta',
		'`<imagen>` _(imagen/enlace)_ para seleccionar la imagen de la carta',
		'`-c` o `--costo` para establecer el precio de la carta',
		'`-a` o `--activa` para especificar que la carta es activa',
		'`-e` o `--equipada` para especificar que la carta es equipada'
	],
	callx: '<desc> <imagen>',

	async execute(message, args) {
		//Variables de flags


		//Lectura de flags
		let jn = false;
		args = args.map((arg, i) => {
			let ignore = true;
			if(!jn) {
				if(arg.startsWith('--'))
					switch(arg.slice(2)) {
					case 'flag':  break;
					default: ignore = false;
					}
				else if(arg.startsWith('-'))
					for(c of arg.slice(1))
						switch(c) {
						case 'f':  break;
						default: ignore = false;
						}
				else ignore = false;
			} else jn = false;

			if(ignore) return undefined;
			else return arg;
		}).filter(arg => arg !== undefined);

		//Acción de comando
        message.channel.startTyping();
		const xx = 96, yy = 4;
		const ww = 576 * 2;
		const hh = 672 * 2;
        const canvas = Canvas.createCanvas(xx * 2 + ww, yy * 2 + hh);
        const ctx = canvas.getContext('2d');

		//Contorno chido
        ctx.strokeStyle = '#900000';
        ctx.lineWidth = 8;
		ctx.strokeRect(xx, yy, ww, hh);

        //#region Texto
        //#region Propiedades de texto
        const strokeFactor = 0.12;
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#ffffff';
        //#endregion

        //#region Nombre y tipo
        ctx.textBaseline = 'top';
		ctx.textAlign = 'center';
		const xcenter = ww / 2;
        let Texto = `${'La Ley de la Selva'}`;
        let fontSize = 88;
        ctx.font = `${fontSize}px "cardname"`;
        ctx.lineWidth = Math.ceil(fontSize * strokeFactor);
        ctx.strokeText(Texto, xx + ww / 2, yy + 296 * 2);
        ctx.fillText(Texto, xx + ww / 2, yy + 296 * 2);
		Texto = `${'Clase: Carta Pasiva'}`;
        ctx.strokeStyle = '#5fa6c7';
        ctx.font = `${fontSize - 12}px "cardclass"`;
        ctx.lineWidth = Math.ceil(fontSize * strokeFactor);
        ctx.strokeText(Texto, xx + xcenter, yy + 352 * 2);
        ctx.fillText(Texto, xx + xcenter, yy + 352 * 2);
		{
			const txth = fontSize;
			fontSize = 42;
			ctx.strokeStyle = '#3d6658';
			ctx.fillStyle = '#63f7c6';
			ctx.font = `${fontSize}px "cardhint"`;
			ctx.lineWidth = Math.ceil(fontSize * strokeFactor);
			ctx.strokeText(Texto, xx + xcenter, yy + 352 * 2 + txth - 4);
			ctx.fillText(Texto, xx + xcenter, yy + 352 * 2 + txth - 4);
		}
		Texto = `${
			'Posee la habilidad de Saki Kurokoma de potenciar tus propios disparos.\n' +
			'Una habilidad tan eficiente que te otorga una fuerza descomunal incluso al tener poco poder.\n' +
			'Por mucho cerebro que tengas o por los pasos que preveas,\n' +
			'en algún instante, todo el mundo ha de rendirse ante un poder abrumador.\n' +
			'Al final, todo lo que importa es el poder ofensivo.'
		}`;
		fontSize = 40;
		ctx.strokeStyle = '#000000';
		ctx.fillStyle = '#ffffff';
        ctx.font = `${fontSize}px "cardbody"`;
        ctx.lineWidth = Math.ceil(fontSize * strokeFactor);
		Texto.split('\n').map((txt, ln) => {
			ctx.strokeText(txt, xx + ww / 2, yy + 456 * 2 + ln * fontSize * 1.66);
			ctx.fillText(txt, xx + ww / 2, yy + 456 * 2 + ln * fontSize * 1.66);
		});
        //#endregion
        
        /*//#region Foto de Perfil
        //#region Fondo
        const radius = 200;
        const ycenter = (115 + (canvas.height - 115 - 56)) / 2;
        ctx.fillStyle = '#36393f';
        ctx.arc(canvas.width / 2, ycenter, radius, 0, Math.PI * 2, true);
        ctx.fill();
        //#endregion

        //#region Imagen circular
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = radius * 0.33 * strokeFactor;
        ctx.arc(canvas.width / 2, ycenter, radius + ctx.lineWidth, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvas.width / 2, ycenter, radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        const avatar = await Canvas.loadImage(miembro.user.displayAvatarURL({ format: 'png', dynamic: false, size: 1024 }));
        ctx.drawImage(avatar, canvas.width / 2 - radius, ycenter - radius, radius * 2, radius * 2);
        ctx.restore();
        //#endregion
        //#endregion*/
        
        const imagen = new Discord.MessageAttachment(canvas.toBuffer(), 'bienvenida.png');
        message.channel.send({files: [imagen]});
        message.channel.stopTyping(true);
	}
};