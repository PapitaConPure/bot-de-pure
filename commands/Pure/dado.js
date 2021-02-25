const Discord = require('discord.js'); //Integrar discord.js
const { GridFSBucket } = require('mongodb');
var global = require('../../config.json'); //Variables globales
const { randInt } = require('../../func.js');
const func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'dado',
	aliases: [
		'dados', 'tirar', 'random',
		'roll', 'rolldie', 'die',
	],
    desc: 'Tira uno o más dados para recibir un números aleatorios',
    flags: [
        'common'
    ],
    options: [

    ],
	
	execute(message, args) {
		//message.channel.send('No se están haciendo pruebas por el momento <:uwu:681935702308552730>');
		//return;

		let faces = 6;
		let dices = 1;
		let total = 0;
		let dice = [];

		try {
			let opt = 'NLL';
			args.forEach(arg => {
				if(opt === 'NLL' && arg.startsWith('-'))
					opt = arg.slice(1);
				else {
					switch(opt) {
					case 'c': //Caras
						faces = parseInt(arg);
						break;
					
					case 'd': //Cantidad
						dices = parseInt(arg);
						break;
					}
					opt = 'NLL';
				}
			});
			
			if(dices > 64) {
				message.channel.send('PERO NO SEAS TAN ENFERMO <:zunWTF:757163179569840138>');
				return;
			}

			for(let d = 0; d < dices; d++){
				dice[d] = randInt(1, faces + 1);
				total += dice[d];
			};
		} catch(err) {
			message.channel.send(
				'¡No puedo tirar dados tetradimensionales! ***...todavía.***!\n' +
				`Uso: _\`p!dado -c Caras -n Cantidad\``
			);
		};

		message.channel.send(
			'```\n' +
			`Dados:\n${dice.join('\n')}\n\n` +
			`Total: ${total}\n` +
			'```'
		);
    },
};