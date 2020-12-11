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
	execute(message, args) {
		//message.channel.send('No se están haciendo pruebas por el momento <:uwu:681935702308552730>');
		//return;

		let faces = 6;
		let cnt = 1;
		try {
			let opt = '';
			args.forEach(arg => {
				if(opt.length === 0) {
					if(arg.startsWith('-'))
						opt = arg.slice(1);
				} else {
					switch(opt) {
					case 'c': //Caras
						faces = opt;
						break;
					
					case 'n': //Cantidad
						cnt = opt;
						break;
					}
					opt = '';
				}
			});
		} catch(err) {
			message.channel.send(
				'¡No puedo tirar dados tetradimensionales! ***...todavía.***!\n' +
				`Uso: _\`p!dado { -c n, cantidad -m n }\``
			);
		};

		message.channel.send(
			`**Caras** ${faces}\n` +
			`**Cantidad** ${cnt}`
		);
		//message.channel.send(`\`${randInt(10, 1000)}\``);
    },
};