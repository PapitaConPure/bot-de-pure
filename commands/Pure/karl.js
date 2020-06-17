const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

const getRandomInt = function(_max) {
  return Math.floor(Math.random() * _max);
}

module.exports = {
	name: 'karl',
	aliases: [
        'karlos', 'zupija'
    ],
	execute(message, args){
		const emot = [
			':musical_keyboard:', ':saxophone:', ':trumpet:', ':violin:', ':guitar:',' :banjo:', ':aquarius:'
		];
		message.channel.send(
			`**Buenas, soy Karl. Combina estas weás, créeme soy licenciado** <:reibu:686220828773318663> :thumbsup:\n` +
			`<:arrowr:681963688411922460> ${emot[getRandomInt(emot.length)]} ${emot[getRandomInt(emot.length)]} ${emot[getRandomInt(emot.length)]} <:arrowl:681963688361590897>`
		);
    },
};