const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'sugerir',
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
		let val = 0;

		//Lectura de flags
		let jn = false;
		args = args.map((arg, i) => {
			let ignore = true;
			if(!jn) {
				if(arg.startsWith('--'))
					switch(arg.slice(2)) {
					case 'flag': val = args[i + 1]; break;
					default: ignore = false;
					}
				else if(arg.startsWith('-'))
					for(c of arg.slice(1))
						switch(c) {
						case 'f': val = args[i + 1]; break;
						default: ignore = false;
						}
				else ignore = false;
			} else jn = false;

			if(ignore) return undefined;
			else return arg;
		}).filter(arg => arg !== undefined);

		//Acción de comando
		message.channel.send(`\`${val}\``);
	}
};