const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const { randInt } = require('../../func.js');
const func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'test',
    desc: '',
    flags: [
        'papa'
    ],
	
	execute(message, args) {
		message.channel.send('No se están haciendo pruebas por el momento <:uwu:681935702308552730>');
		return;
		message.channel.send(`\`${randInt(10, 1000)}\``);
    },
};