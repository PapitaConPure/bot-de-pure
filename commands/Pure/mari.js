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
		const emot = getRandomInt(16);
		let str = '**';
		switch(emot) {
			case 0: str += '\'o\''; break;
			case 1: str += '\'u\''; break;
			case 2: str += '^O^'; break;
			case 3: str += 'o.o'; break;
			case 4: str += 'O.O'; break;
			case 5: str += 'QUQ'; break;
			case 6: str += '\'.\''; break;
			case 7: str += '¬u¬'; break;
			case 8: str += 'o\'o'; break;
			case 9: str += 'o\'o'; break;
			case 10: str += 'o.o\'\''; break;
			case 11: str += 'o-o'; break;
			case 12: str += 'O.o'; break;
			case 13: str += 'x.x'; break;
			case 14: str += 'ouo'; break;
			case 15: str += 'OUO'; break;
			case 16: str += 'OuO'; break;
		}
		str += '**';
		message.channel.send(str);
    },
};