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
			for(let i = 0; i < args.length; i++)
				message.channel.fetchMessage(args[i])
				.then(msg => {
					msg.delete();
					console.log('Se ha borrado un mensaje con m-borrarmsg.');
				})
				.catch(err => {
					console.log('Ha ocurrido un error al borrar un mensaje.');
					console.error(err);
				});
		} else message.channel.send(':warning: necesitas tener el permiso ***ADMINISTRAR ROLES** (MANAGE ROLES)* para usar este comando.');
    },
};