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
			if(!args.length) {
				message.channel.send(':warning: debes especificar al menos una ID de un mensaje enviado por mí.');
			}
			for(let i = 0; i < args.length; i++)
				message.channel.fetchMessage(args[i])
				.then(msg => {
					if(msg.author.id === '651250669390528561') {
						msg.delete();
						console.log('Se ha borrado un mensaje con m-borrarmsg.');
					} else {
						message.channel.send(':warning: solo se pueden borrar mis mensajes con este comando.');
						console.log('Se ha rechazado la petición para borrar mensaje con m-borrarmsg porque el mensaje no era del bot.');
					}
				})
				.catch(err => {
					console.log(':warning: ha ocurrido un error al borrar un mensaje.');
					console.error(err);
				});
		} else message.channel.send(':warning: necesitas tener el permiso ***ADMINISTRAR ROLES** (MANAGE ROLES)* para usar este comando.');
    },
};