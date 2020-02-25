const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const Canvas = require('canvas');

module.exports = {
	name: 'prueba',
	execute(message, args){
		message.channel.send('Comando de prueba. Actualmente vacío.');
    },
};