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
		'`-d <n>` o `--dados <n>` para especificar la cantidad de dados',
		'`-c <n>` o `--caras <n>` para especificar la cantidad de caras'
    ],
	
	execute(message, args) {
		//message.channel.send('No se están haciendo pruebas por el momento <:uwu:681935702308552730>');
		//return;

		let faces = 6;
		let dices = 1;
		let total = 0;
		let dice = [];

		try {
			args.some((arg, i) => {
				if(arg.startsWith('--'))
					switch(arg.slice(2)) {
					case 'dados': dices = parseInt(args[i + 1]); break;
					case 'caras': faces = parseInt(args[i + 1]); break;
					}
				else if(arg.startsWith('-'))
					for(c of arg.slice(1))
						switch(c) {
						case 'd': dices = parseInt(args[i + 1]); break;
						case 'c': faces = parseInt(args[i + 1]); break;
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
				`Revisa \`p!ayuda dado\` para más información`
			);
		};

		message.channel.send(
			'```\n' +
			`Tiré ${dices} dados de ${faces} caras~♪` +
			`Resultados:\n${dice.join(', ')}\n` +
			`Total: ${total}\n` +
			'```'
		);
    },
};