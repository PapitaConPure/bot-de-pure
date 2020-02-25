const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const Canvas = require('canvas');

module.exports = {
	name: 'prueba',
	execute(message, args){
		message.channel.send(
			':edgenw::lineh::lineh::edgene:\n' +
			':linev:\t\t\t:linev2:\n' +
			':linev:\t\t\t:linev2:\n' +
			':edgesw::lineh2::lineh2::edgese:'
		);
    },
};