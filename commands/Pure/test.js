const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const axios = require('axios');

module.exports = {
	name: 'test',
	execute(message, args) {
		/*message.channel.send('No se están haciendo pruebas por el momento <:uwu:681935702308552730>');
		return;*/
		const miembro = message.member;
		message.channel.send(`\`Cantidad de roles de ${miembro.nickname}: ${miembro.roles.cache.size}\``);
    },
};