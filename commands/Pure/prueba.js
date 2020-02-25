const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const Canvas = require('canvas');

module.exports = {
	name: 'prueba',
	execute(message, args){
		message.channel.send(
			'<:edgenw:681929350798377007><:lineh:681929351083982914><:lineh:681929351083982914><:edgene:681929351029194857>\n' +
			'<:linev:681929350823542888>\t\t\t<:linev2:681930015860195391>\n' +
			'<:linev:681929350823542888>\t\t\t<:linev2:681930015860195391>\n' +
			'<:edgesw:681929351029063856><:lineh2:681930015440371763><:lineh2:681930015440371763><:edgese:681929351029063728>'
		);
    },
};