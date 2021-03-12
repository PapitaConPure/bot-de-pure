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
		if(!args.length) {
			message.delete();
			message.channel.send(':warning: debes especificar la cantidad o el autor de los mensajes a borrar.');
			return;
		} else {
			let amt = 1;
			let user;
			let jn = false;
			args.map((arg, i) => {
				if(arg.startsWith('--'))
					if(!jn) 
						switch(arg.slice(2)) {
						case 'usuario': jn = true; user = func.resolverIDUsuario(arg, message.channel.guild, message.client); break;
						case 'cantidad': jn = true; amt = Math.max(2, Math.min(parseInt(args[i + 1]) + 1, 100)); break;
						}
					else jn = false;
				else if(arg.startsWith('-')) {
					if(!jn)
						for(c of arg.slice(1))
							switch(c) {
							case 'u': jn = true; user = func.resolverIDUsuario(arg, message.channel.guild, message.client); break;
							case 'c': jn = true; amt = Math.max(2, Math.min(parseInt(args[i + 1]) + 1, 100)); break;
							}
					else jn = false;
				}
			});
			
			if(user === undefined)
				message.channel.bulkDelete(amt, true);
			else
				message.channel.bulkDelete(message.channel.messages.cache.filter((_, msg) => msg.author.id = user.id).first(amt), true);
		}
    },
};