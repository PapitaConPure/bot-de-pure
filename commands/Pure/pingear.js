const Discord = require('discord.js'); //Integrar discord.js
const func = require('../func.js'); //Funciones globales

module.exports = {
	name: 'pingear',
	aliases: [
        'pinguear', 'pingeara', 'pingueara',
		'pingsomeone'
    ],
	execute(message, args) {
		if(args.size === 2) {
			let cnt = -1;
			let alt = -1;
			for(let i = 0; i < 2; i++)
				if(!isNaN(args[i])) {
					if(args[i] > 1 && args[i] <= 10) {
						cnt = args[i];
						alt = (i === 0)?1:0;
					}
					break;
				}
			
			if(alt > 0) {
				if(args[alt].startsWith('<@') && args[alt].endsWith('>')) {
					pingear(cnt, args[alt]);
				} else message.channel.send(':warning: debes ingresar un valor numérico y una mención (`p!ping <número*> <mención*>`).');
			} else if(alt == -1) message.channel.send(':warning: debes ingresar un valor numérico y una mención (`p!ping <número*> <mención*>`).');
			else message.channel.send(':warning: solo puedes pingear a alguien entre 2 y 10 veces.');
		} else message.channel.send(':warning: debes ingresar 2 parámetros (`p!ping <número*> <mención*>`).')
    },
};