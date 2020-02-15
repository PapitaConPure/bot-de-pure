const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'm-borrarmsg',
	aliases: [
		'm-borrar',
        'm-deletemsg', 'm-delete',
        'm-del', 'm-d', 
    ],
	execute(message, args) {
		if(message.member.hasPermission('MANAGE_MESSAGES', false, true, true)) {
			message.delete();
			if(!args.length) {
				message.channel.send(':warning: debes especificar el número de mensajes a borrar.');
				return;
			}
			message.channel.bulkDelete(args[0]);
		} else message.channel.send(':warning: necesitas tener el permiso ***ADMINISTRAR MENSAJES** (MANAGE_MESSAGES)* para usar este comando.');
    },
};