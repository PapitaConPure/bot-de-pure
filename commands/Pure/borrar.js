const { p_pure } = require('../../localdata/config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'borrar',
	aliases: [
		'borrarmsg',
        'deletemsg', 'delete',
        'del', 'd', 
    ],
    desc: 'Elimina una cierta cantidad de mensajes entre 2 y 100',
    flags: [
        'mod'
    ],
    options: [
		'`<cantidad>` _(número)_ para especificar la cantidad de mensajes a borrar (sin contar el mensaje del comando)',
		'`-u <user>` o `--usuario <user>` _(mención/texto/id)_ para especificar de qué usuario borrar mensajes'
    ],
	callx: '<cantidad>',
	
	execute(message, args) {
		if(!args.length) {
			message.delete();
			message.channel.send({ content: ':warning: debes especificar la cantidad o el autor de los mensajes a borrar.' });
			return;
		} else {
			let user;
			let jn = false;
			args = args.map((arg, i) => {
				let ignore = true;
				if(!jn) {
					if(arg.startsWith('--'))
						switch(arg.slice(2)) {
						case 'usuario':
							jn = true;
							user = func.fetchUserID(args[i + 1], message.channel.guild, message.client);
							args[i] = undefined;
							args[i + 1] = undefined;
							break;
						default: ignore = false;
						}
					else if(arg.startsWith('-'))
						for(c of arg.slice(1))
							switch(c) {
							case 'u':
								jn = true;
								user = func.fetchUserID(args[i + 1], message.channel.guild, message.client);
								args[i] = undefined;
								args[i + 1] = undefined;
								break;
							default: ignore = false;
							}
					else ignore = false;
				} else jn = false;

				if(ignore) return undefined;
				else return arg;
			}).filter(arg => arg !== undefined);

			let amt = parseInt(args[0]);
			if(isNaN(amt)) {
				message.channel.send({
					content:
						':warning: Debes especificar la cantidad de mensajes a borrar\n' +
						`Revisa \`${p_pure}ayuda borrar\` para más información`
				});
				return;
			}
			amt = Math.max(2, Math.min(amt + 1, 100));
			
			if(user === undefined)
				message.channel.bulkDelete(amt);
			else {
				message.channel.messages.fetch({ limit: amt }).then(mcoll =>
					message.channel.bulkDelete(mcoll.filter(msg => msg.author.id === user.id))
				);
			}
		}
    },
};