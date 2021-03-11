const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales

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
		'`<cantidad>` para especificar la cantidad de mensajes a borrar (sin contar el mensaje del comando)'
    ],
	callx: '<cantidad>',
	
	execute(message, args) {
		if(message.member.hasPermission('MANAGE_MESSAGES', false, true, true)) {
			func.resolverIDUsuario(args[avalist], message.channel.guild, message.client)
			if(!args.length) {
				message.delete();
				message.channel.send(':warning: debes especificar la cantidad o el autor de los mensajes a borrar.');
				return;
			} else {
				let msgs = new Discord.Collection();
				let amt;
				let user;
				args.map(arg => {
					if(arg.startsWith('--'))
						switch(arg.slice(2)) {
						case 'usuario': user = arg; break;
						case 'cantidad': amt = Math.max(2, Math.min(parseInt(args[0]) + 1, 100)); break;
						}
					else if(arg.startsWith('-')) {
						for(c of arg.slice(1))
							switch(c) {
							case 'u': user = arg; break;
							}
					}
				});

				if(user === undefined)
					message.channel.bulkDelete(amt, true);
				else {
					message.channel.send('Comenzando operación, esto puede tomar varios minutos...');
				}
			}
		} else message.channel.send(':warning: necesitas tener el permiso ***ADMINISTRAR MENSAJES** (MANAGE_MESSAGES)* para usar este comando.');
    },
};