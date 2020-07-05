const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

const getRandomInt = function(_max) {
  return Math.floor(Math.random() * _max);
}

module.exports = {
	name: 'bern',
	aliases: [
        'bewny', 'polola',
		'procrastinar'
    ],
	execute(message, args){
		const emot = [
			'Mi polola.', 'Mi reina.', 'Mi princesa', 'Mi esposa', 'Mi mujer', 'Procrastinar', ':wine_glass:',
			'No avancé en el manga de Kogasa', 'No avancé en el manga de Komachi', 'Mañana lo hago', 'Otro día'
		];
		const lel = [
			message.client.emojis.get('654504689873977347'), //Kogablush
			message.client.emojis.get('722334924845350973'), //Chad
			message.client.emojis.get('697320983106945054'), //Pepe
			message.client.emojis.get('697323104141049867'), //Kokocrong
		];
		const selection = getRandomInt(emot.length);
		
		message.channel.send(`**${emot[selection]}** <:bewny:722334924845350973>`).then(sent => {
			if(selection < 6) {
				sent.react(lel[0]);
			} else if(selection === 6) {
				sent.react(lel[1]);
			} else {
				sent.react(lel[2])
					.then(() => sent.react(lel[3]));
			}
		});;
    },
};