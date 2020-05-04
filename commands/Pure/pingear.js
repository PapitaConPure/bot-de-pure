const Discord = require('discord.js'); //Integrar discord.js
const func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'pingear',
	aliases: [
        'pinguear', 'pingeara', 'pingueara',
		'pingsomeone'
    ],
	execute(message, args) {
		if(args.length === 2) {
			let cnt = -1;
			if(!isNaN(args[0])) cnt = args[0];

			if(cnt < 2 || cnt > 10) 
				message.channel.send(':warning: solo puedes pingear a alguien entre 2 y 10 veces.');
			else if(args[1].startsWith('<@') && args[1].endsWith('>')) {
				func.pingear(cnt, args[1], message.channel); 
			} else message.channel.send(':warning: debes ingresar un valor numérico y una mención (`p!pingear <número*> <mención*>`).');
		} else message.channel.send(':warning: debes ingresar 2 parámetros (`p!pingear <número*> <mención*>`).');
    },
};