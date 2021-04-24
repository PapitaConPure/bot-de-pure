const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'cartas',
	aliases: [
		'18'
	],
	desc: 'Dibuja una presentación de carta al estilo de Touhou 18 con el texto e imagen deseados\n' +
		'La carta es pasiva y cuesta ¥100 por defecto',
	flags: [
		'common'
	],
	options: [
		'`<texto (1, 2?, 3?)>` _(número [múltiple])_ para describir la carta',
		'`<imagen>` _(imagen/enlace)_ para seleccionar la imagen de la carta',
		'`-c` o `--costo` para establecer el precio de la carta',
		'`-a` o `--activa` para especificar que la carta es activa',
		'`-e` o `--equipada` para especificar que la carta es equipada'
	],
	callx: '<texto (1, 2?, 3?)> <imagen>',

	execute(message, args) {
		//Variables de flags


		//Lectura de flags
		let jn = false;
		args = args.map((arg, i) => {
			let ignore = true;
			if(!jn) {
				if(arg.startsWith('--'))
					switch(arg.slice(2)) {
					case 'flag':  break;
					default: ignore = false;
					}
				else if(arg.startsWith('-'))
					for(c of arg.slice(1))
						switch(c) {
						case 'f':  break;
						default: ignore = false;
						}
				else ignore = false;
			} else jn = false;

			if(ignore) return undefined;
			else return arg;
		}).filter(arg => arg !== undefined);

		//Acción de comando

	}
};