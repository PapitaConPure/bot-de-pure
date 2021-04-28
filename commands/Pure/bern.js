const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../localdata/config.json'); //Variables globales

const getRandomInt = function(_max) {
  return Math.floor(Math.random() * _max);
}

module.exports = {
	name: 'bern',
	aliases: [
        'bewny', 'polola',
		'procrastinar'
    ],
    desc: 'Comando de procrastinación de GoddamnBernkastel',
    flags: [
        'meme'
    ],
    options: [

    ],

	execute(message, args){
		/*message.channel.send(
			'```\n' +
			'[REPORTE DE ESTADO DEL BOT]\n' +
			'Estoy investigando un error con los comandos con auto reacción personalizada que hace que tiren error al intentar conseguir las IDs de los emotes.\n' +
			'~Papita con Puré\n' +
			'```'
		);
		return;*/

		const emot = [
			'Mi polola', 'Mi reina', 'Mi princesa', 'Mi esposa', 'Mi mujer',
			':wine_glass:', ':wine_glass::wine_glass:', ':wine_glass::wine_glass::wine_glass:',
			'No avancé en el manga de Komachi', 'Mañana lo hago', 'Otro día', 'Mañana sin falta', 'Esta semana lo termino', 'Procrastinar'
		];
		const lel = [
			message.client.emojis.cache.get('654504689873977347'), //Kogablush
			message.client.emojis.cache.get('722334924845350973'), //Chad
			message.client.emojis.cache.get('697320983106945054'), //Pepe
			message.client.emojis.cache.get('697323104141049867'), //Kokocrong
		];
		const selection = getRandomInt(emot.length);
		
		message.channel.send(`**${emot[selection]}** <:bewny:722334924845350973>`).then(sent => {
			if(selection <= 4) {
				sent.react(lel[0]);
			} else if(selection > 4 && selection <= 7) {
				sent.react(lel[1]);
			} else {
				sent.react(lel[2])
					.then(() => sent.react(lel[3]));
			}
		});;
    },
};