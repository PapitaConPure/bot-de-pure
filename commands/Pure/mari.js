const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

const getRandomInt = function(_max) {
  _max = Math.floor(_max);
  return Math.floor(Math.random() * _max);
}

module.exports = {
	name: 'marisaac',
	aliases: [
        'mari'
    ],
	execute(message, args){
		const emot = getRandomInt(19);
		let str = '**';
		switch(emot) {
			case 0: str += '\'o\''; break;
			case 1: str += '\'O\''; break;
			case 2: str += '\'u\''; break;
			case 3: str += '\'U\''; break;
			case 4: str += '^O^'; break;
			case 5: str += 'o.o'; break;
			case 6: str += 'O.O'; break;
			case 7: str += 'QUQ'; break;
			case 8: str += '\'.\''; break;
			case 9: str += '¬u¬'; break;
			case 10: str += '¬U¬'; break;
			case 11: str += 'o\'o'; break;
			case 12: str += 'o.o\'\''; break;
			case 13: str += 'o-o'; break;
			case 14: str += 'O.o'; break;
			case 15: str += 'x.x'; break;
			case 16: str += 'ouo'; break;
			case 17: str += 'OUO'; break;
			case 18: str += 'OuO'; break;
			case 19: str += '>:C'; break;
			case 20: str += '>:c'; break;
		}
		str += '**';
		message.channel.send(str);
    },
};