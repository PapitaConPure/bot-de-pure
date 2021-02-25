const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'm-borrar',
	aliases: [
		'm-borrarmsg',
        'm-deletemsg', 'm-delete',
        'm-del', 'm-d', 
    ],
    desc: 'Elimina una cierta cantidad de mensajes entre 2 y 100',
    flags: [
        'mod'
    ],
    options: [
		'`cantidad` para especificar la cantidad de mensajes a borrar (sin contar el mensaje del comando)'
    ],
	callx: '<cantidad>',
	
	execute(message, args) {
		if(message.member.hasPermission('MANAGE_MESSAGES', false, true, true)) {
			if(!args.length) {
				message.delete();
				message.channel.send(':warning: debes especificar el número de mensajes a borrar.');
				return;
			}
			if(isNaN(args[0])) {
				message.delete();
				message.channel.send(':warning: la cantidad de mensajes a borrar debe ser un número entre 0 y 100.');
			}
			const wtf = Math.max(2, Math.min(parseInt(args[0]) + 1, 100));
			message.channel.bulkDelete(wtf, true);
		} else message.channel.send(':warning: necesitas tener el permiso ***ADMINISTRAR MENSAJES** (MANAGE_MESSAGES)* para usar este comando.');
    },
};