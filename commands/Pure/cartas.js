const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales

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
        canal.startTyping();
        Canvas.registerFont('./Alice-Regular.ttf', { family: 'headline' });
        const canvas = Canvas.createCanvas(1275, 825);
        const ctx = canvas.getContext('2d');

        const fondo = await Canvas.loadImage((servidor.id === global.serverid.hourai)?'./fondo4.png':'./fondo.png');
        ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);

        //#region Texto
        //#region Propiedades de texto
        const strokeFactor = 0.09;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        //#endregion

        //#region Nombre del usuario
        ctx.textBaseline = 'top';
        let Texto = `${miembro.displayName}`;
        let fontSize = 100;
        let xcenter;
        ctx.font = `bold ${fontSize}px "headline"`;
        //fontSize = (canvas.width - 100) / ctx.measureText(Texto).width;
        ctx.font = `bold ${fontSize}px "headline"`;
        console.log(fontSize);
        ctx.lineWidth = Math.ceil(fontSize * strokeFactor);
        xcenter = (canvas.width / 2) - (ctx.measureText(Texto).width / 2);
        ctx.strokeText(Texto, xcenter, 15);
        ctx.fillText(Texto, xcenter, 15);
        //#endregion
        
        //#region Texto inferior
        ctx.textBaseline = 'bottom';
        if(servidor.id === global.serverid.ar) Texto = 'Animal Realm!';
        else Texto = `${servidor.name}!`;
        fontSize = 100;
        ctx.font = `bold ${fontSize}px "headline"`;
        ctx.lineWidth = Math.ceil(fontSize * strokeFactor);
        xcenter = (canvas.width / 2) - (ctx.measureText(Texto).width / 2);
        ctx.strokeText(Texto, xcenter, canvas.height - 15);
        ctx.fillText(Texto, xcenter, canvas.height - 15);
        Texto = '¡Bienvenid@ a';
        ctx.lineWidth = Math.ceil(56 * strokeFactor);
        ctx.font = `bold 56px "headline"`;
        xcenter = (canvas.width / 2) - (ctx.measureText(Texto).width / 2);
        ctx.strokeText(Texto, xcenter, canvas.height - fontSize - 20);
        ctx.fillText(Texto, xcenter, canvas.height - fontSize - 20);
        //#endregion
        //#endregion
        
        //#region Foto de Perfil
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
        //#endregion
        
        const imagen = new Discord.MessageAttachment(canvas.toBuffer(), 'bienvenida.png');
        canal.send({files: [imagen]});
        canal.stopTyping(true);
	}
};