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
			if(!args.length) {
				message.delete();
				message.channel.send(':warning: debes especificar el número de mensajes a borrar.');
				return;
			}
			const wtf = /*Math.max(2, Math.min(*/args[0]/* + 1, 100))*/;
			message.channel./*bulkDelete*/send(wtf);
		} else message.channel.send(':warning: necesitas tener el permiso ***ADMINISTRAR MENSAJES** (MANAGE_MESSAGES)* para usar este comando.');
    },
};