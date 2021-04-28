const func = require('../../func.js'); //Funciones globales
const uses = require('../../localdata/sguses.json'); //Funciones globales
const { p_pure } = require('../../localdata/config.json'); //Prefijos

module.exports = {
	name: 'pinguear',
	aliases: [
        'pingear', 'pingeara', 'pingueara',
		'pingsomeone'
    ],
    desc: 'Pingea a un `<usuario>` una `<cantidad>` de veces',
    flags: [
        'meme',
		'hourai'
    ],
    options: [
		'`<cantidad>` _(número)_ para indicar la cantidad de veces que se debe pinguear',
		'`<usuario>` _(mención/texto/id)_ para indicar el usuario a pinguear'
    ],
	callx: '<cantidad> <usuario>',
	
	execute(message, args) {
		if(uses.pinguear[message.author.id] !== undefined && uses.pinguear[message.author.id]) {
			message.channel.send(`:octagonal_sign: oe, ¿¡y si te calmai!?`);
			return;
		}

		if(args.length === 2) {
			let cnt = -1;
			let mention;
			
			if(!isNaN(args[0])) { cnt = args[0]; mention = args[1]; }
			else if(!isNaN(args[1])) { cnt = args[1]; mention = args[0]; }

			if(cnt < 2 || cnt > 10) 
				message.channel.send(':warning: solo puedes pinguear a alguien entre 2 y 10 veces.');
			else if(mention.startsWith('<@') && mention.endsWith('>')) {
				if(mention.startsWith('<@&')) {
					message.channel.send(':warning: PERO NO SEAS TAN ENFERMO');
					return;
				}
				uses.pinguear[message.author.id] = true;
				func.pingear(cnt, mention, message.channel, message.author.id); 
			} else message.channel.send(`:warning: debes ingresar un valor numérico y una mención (\`${p_pure}pinguear <cantidad> <usuario>\`).`);
		} else message.channel.send(`:warning: debes ingresar 2 parámetros (\`${p_pure}pinguear <cantidad> <usuario>\`).`);
    },
};