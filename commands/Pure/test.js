const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const axios = require('axios');

module.exports = {
	name: 'test',
	execute(message, args) {
		message.channel.send('No se están haciendo pruebas por el momento <:uwu:681935702308552730>');
		return;

		dibujarBienvenida(message.member);
    },
};