const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

const getRandomInt = function(_max) {
  return Math.floor(Math.random() * _max);
}

module.exports = {
	name: 'marisaac',
	aliases: [
        'mari'
    ],
    desc: '',
    flags: [
        'meme'
    ],
	
	execute(message, args) {
		const emot = [
			'\'o\'', '\'O\'', '\'u\'', '\'U\'', '^O^', 'o.o', 'O.O', 'QUQ', '\'.\'', '¬u¬', '¬U¬', 'o\'o', 'o.o\'\'', 'o-o', 'O.o', 'x.x', 'ouo', 'OUO', 'OuO', 'Ouo', '>:C',
			'>:c', 'OwO', 'UwU', '`o´', '`O´', '`U´', '`u´', ':3c', '^O^/', ':oc', 'x\'d', 'x\'D', 'X\'D', ';u;', '°o°', '°O°', '°u°', '°U°', 'OnO', '>U<', '>u<', '>O<', '>o<',
			'\\^O^/', '\\`u´/', '\\´u`/', '\'n\'', '^w^', '^W^', 'ouO', '>:3c', '\'o\'/', '\'u\'/', '\'O\'/', '\'U\'/', '>w<', '>W<', '°w°', '°W°'
		];
		const selection = getRandomInt(emot.length);
		message.channel.send(`**${emot[selection]}**`);
    },
};