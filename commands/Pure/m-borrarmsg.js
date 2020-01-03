const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'm-borrarmsg',
	aliases: [
		'm-borrar',
        'm-deletemsg', 'm-delete'
    ],
	execute(message, args) {
		if(message.member.hasPermission('MANAGE_ROLES', false, true, true)) {
			message.delete(message.author.lastMessageID);
			message.channel.fetchMessage('99539446449315840')
			.then(msg => msg.delete())
			.catch(err => console.error(err));
		} else message.channel.send(':warning: necesitas tener el permiso ***ADMINISTRAR ROLES** (MANAGE ROLES)* para usar este comando.');
    },
};