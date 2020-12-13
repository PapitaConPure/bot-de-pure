const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'caramelos',
	aliases: [
		'caramelo',
		'candy', 'candies', 'milky'
	],
	execute(message, args) {
		func.askCandy(message.member, message.channel);
    },
};