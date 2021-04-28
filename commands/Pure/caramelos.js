const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../localdata/config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'caramelos',
	aliases: [
		'caramelo',
		'candy', 'candies', 'milky'
	],
    desc: 'Otorga caramelos al reaccionar al mensaje generado',
    flags: [
        'hourai',
        'outdated'
    ],
    options: [

    ],
	
	execute(message, args) {
		func.askCandy(message.member, message.channel);
    },
};