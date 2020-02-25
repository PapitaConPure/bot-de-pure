const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'uwu',
	execute(message, args){
		message.channel.send('<:uwu:681935702308552730>');
    },
};