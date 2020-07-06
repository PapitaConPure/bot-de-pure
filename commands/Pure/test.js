const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const axios = require('axios');
const Canvas = require('canvas');

module.exports = {
	name: 'test',
	execute(message, args) {
		//message.channel.send('No se están haciendo pruebas por el momento <:uwu:681935702308552730>');

		let search = args.join(' ').split(',');

		let test = '';
		search.map(selem => {
			while(selem.startsWith(' ')) selem = selem.slice(1);
			while(selem.endsWith(' ')) selem = selem.slice(-1);
			if(selem.length) {
				test += `\`${selem}\`\n`;
			}
		});
		
		message.channel.send(test);
    },
};