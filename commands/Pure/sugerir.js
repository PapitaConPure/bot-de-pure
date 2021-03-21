const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'sugerir.js',
	aliases: [
		''
	],
	desc: 'Para sugerir mejoras sobre el Bot. Todas las mejoras van a una lista.',
	flags: [
		''
	],
	options: [
		''
	],
	callx: '',

	execute(message, args) {
		//Variables de flags
		

		//Lectura de flags
		args.map(arg => {
			if(arg.startsWith('--'))
				switch(arg.slice(2)) {
				case 'flag':  break;
				}
			else if(arg.startsWith('-'))
				for(c of arg.slice(1))
					switch(c) {
					case 'f':  break;
					}
		});

		//Acción de comando

	}
};