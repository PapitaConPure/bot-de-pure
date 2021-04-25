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
        const canvas = Canvas.createCanvas(576 * 2, 672 * 2);
        const ctx = canvas.getContext('2d');

        //#region Texto
        //#region Propiedades de texto
        const strokeFactor = 0.1;
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#ffffff';
        //#endregion

        //#region Nombre y tipo
        ctx.textBaseline = 'top';
		ctx.textAlign = 'center';
		const xcenter = canvas.width / 2;
        let Texto = `${'La Ley de la Selva'}`;
        let fontSize = 96;
        ctx.font = `bold ${fontSize}px "cardbody"`;
        ctx.lineWidth = Math.ceil(fontSize * strokeFactor);
        ctx.strokeText(Texto, canvas.width / 2, 296 * 2);
        ctx.fillText(Texto, canvas.width / 2, 296 * 2);
		Texto = `${'Clase: Carta Pasiva'}`;
        ctx.strokeStyle = '#5fa6c7';
        ctx.font = `bold ${fontSize}px "cardclass"`;
        ctx.lineWidth = Math.ceil(fontSize * strokeFactor);
        ctx.strokeText(Texto, xcenter, 352 * 2);
        ctx.fillText(Texto, xcenter, 352 * 2);
		{
			const txth = fontSize;
			fontSize = 56;
			ctx.strokeStyle = '#3d6658';
			ctx.fillStyle = '#63f7c6';
			ctx.font = `bold ${fontSize}px "cardhint"`;
			ctx.lineWidth = Math.ceil(fontSize * strokeFactor);
			ctx.strokeText(Texto,xcenter, 352 * 2 + txth + 4);
			ctx.fillText(Texto, xcenter, 352 * 2 + txth + 4);
		}
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