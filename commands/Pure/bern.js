const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'bern',
	aliases: [
        'bewny', 'polola',
		'procrastinar'
    ],
	execute(message, args){
		const emot = [
			'Mi polola.', 'Mi reina.', 'Mi princesa', 'Mi esposa', 'Mi mujer', 'Procrastinar', ':wine_glass:',
			'No avancé en el manga de Kogasa', 'No avancé en el manga de Komachi'
		];
		const selection = getRandomInt(emot.length);
		message.channel.send(`**${emot[selection]}** <:chad:722334924845350973>`);
    },
};