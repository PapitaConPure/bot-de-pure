const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const axios = require('axios');
const Canvas = require('canvas'); 
const Canvas = require('canvas'); 

async function dibujarBienvenida(miembro, canal) { //Dar bienvenida a un miembro nuevo de un servidor
	const servidor = miembro.guild; //Servidor
	//const canal = servidor.channels.get(servidor.systemChannelID); //Canal de mensajes de sistema
	canal.startTyping();

	//#region Creación de imagen
	const canvas = Canvas.createCanvas(1275, 825);
	const ctx = canvas.getContext('2d');

	const fondo = await Canvas.loadImage('./fondo.png');
	ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
	//#endregion

	//#region Texto
	//#region Propiedades de texto
	ctx.textBaseline = 'bottom';
	ctx.shadowOffsetX = shadowOffsetY = 2;
	ctx.shadowBlur = 10;
	ctx.shadowColor = 'black';
	ctx.fillStyle = '#ffffff';
	//#endregion

	//#region Nombre del usuario
	let Texto = `${miembro.displayName}`;
	let fontSize = 72;
	while(ctx.measureText(Texto).width > (canvas.width - 200)) fontSize -= 2;
	ctx.font = `900 ${fontSize}px typeface-bangers`;
	ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), 80);
	//#endregion
	
	//#region Texto inferior
	if(servidor.id === '611732083995443210') Texto = 'Animal Realm!';
	else Texto = `${servidor.name}!`;
	fontSize = 120;
	while(ctx.measureText(Texto).width > (canvas.width - 150)) fontSize -= 2;
	ctx.font = `900 ${fontSize}px typeface-bangers`;
	ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), canvas.height - 15);
	Texto = '¡Bienvenid@ a';
	ctx.font = `bold 48px typeface-bangers`;
	ctx.fillText(Texto, (canvas.width / 2) - (ctx.measureText(Texto).width / 2), canvas.height - fontSize - 30);
	//#endregion
	//#endregion

	//#region Foto de Perfil
	//#region Sombra
	const ycenter = (80 + (canvas.height - fontSize - 48 - 30)) / 2;
	ctx.shadowOffsetX = shadowOffsetY = 8;
	ctx.shadowBlur = 20;
	ctx.fillStyle = '#36393f';
	ctx.arc(canvas.width / 2, ycenter, 150, 0, Math.PI * 2, true);
	ctx.fill();
	//#endregion

	//#region Imagen circular
	ctx.beginPath();
	ctx.arc(canvas.width / 2, ycenter, 150, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.clip();
	const avatar = await Canvas.loadImage(miembro.user.displayAvatarURL);
	ctx.drawImage(avatar, canvas.width / 2 - 150, ycenter - 150, 300, 300);
	//#endregion
	//#endregion

	const imagen = new Discord.Attachment(canvas.toBuffer(), 'bienvenida.png');

	//#region Imagen y Mensaje extra
	const peoplecnt = servidor.members.filter(member => !member.user.bot).size;
	canal.send('', imagen).then(sent => {
		if(servidor.id === '654471968200065034') { //Hourai Doll
			canal.send(
				`Wena po <@${miembro.user.id}> conchetumare, como estai. Porfa revisa el canal <#671817759268536320> para que no te funemos <:haniwaSmile:659872119995498507> \n` +
				'También elije un rol de color (puedes verlos aquí abajo) y pídele el que te guste a alguno de los enfermos que trabajan aquí <:mayuwu:654489124413374474> \n' +
				'https://imgur.com/D5Z8Itb\n' +
				'Nota: si no lo haces, lo haré por tí, por aweonao <:junkNo:697321858407727224>\n' +
				'WENO YA PO CSM. <@& 654472238510112799 >, vengan a saludar maricones <:venAqui:668644938346659851><:miyoi:674823039086624808><:venAqui2:668644951353065500>\n' +
				`*Por cierto, ahora hay **${peoplecnt}** wnes en el server* <:meguSmile:694324892073721887>`
			);
			setTimeout(func.askForRole, 1000 * 60 * 3, miembro, canal);
		} else if(servidor.id === '611732083995443210') { //Animal Realm
			canal.send(
				`Welcome to the server **${miembro.displayName}**! / ¡Bienvenido/a al server **${miembro.displayName}**!\n\n` +
				`**EN:** To fully enjoy the server, don't forget to get 1 of the 5 main roles in the following channel~\n` +
				'**ES:** Para disfrutar totalmente del servidor, no olvides escoger 1 de los 5 roles principales en el siguiente canal~\n\n' +
				'→ <#611753608601403393> ←\n\n' +
				`*Ahora hay **${peoplecnt}** usuarios en el server.*`
			);
		} else { //Otros servidores
			canal.send(
				`¡Bienvenido al servidor **${miembro.displayName}**!\n` +
				`*Ahora hay **${peoplecnt}** usuarios en el server.*`
			);
		}
	});
	//#endregion
	canal.stopTyping(true);
}

module.exports = {
	name: 'test',
	execute(message, args) {
		//message.channel.send('No se están haciendo pruebas por el momento <:uwu:681935702308552730>');
		
		dibujarBienvenida(message.member, message.channel);
    },
};