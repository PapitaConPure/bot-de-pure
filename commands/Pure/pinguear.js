const Discord = require('discord.js'); //Integrar discord.js
const func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'pinguear',
	aliases: [
        'pingear', 'pingeara', 'pingueara',
		'pingsomeone'
    ],
    desc: 'Pingea al usuario mencionado una cantidad designada de veces',
    flags: [
        'meme'
    ],
    options: [
		'`<cantidad>` _(número)_ para indicar la cantidad de veces que se debe pinguear',
		'`<usuario>` _(mención/texto/id)_ para indicar el usuario a pinguear'
    ],
	callx: '<cantidad> <usuario>',
	
	execute(message, args) {
		if(args.length === 2) {
			let cnt = -1;
			if(!isNaN(args[0])) cnt = args[0];

			if(cnt < 2 || cnt > 10) 
				message.channel.send(':warning: solo puedes pinguear a alguien entre 2 y 10 veces.');
			else if(args[1].startsWith('<@') && args[1].endsWith('>')) {
				func.pingear(cnt, args[1], message.channel); 
			} else message.channel.send(':warning: debes ingresar un valor numérico y una mención (`p!pinguear <número*> <mención*>`).');
		} else message.channel.send(':warning: debes ingresar 2 parámetros (`p!pinguear <número*> <mención*>`).');
    },
};