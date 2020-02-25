const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'uwu',
	execute(message, args) {
		const uwusopt = [
			'<:uwu:681935702308552730>',
			'<:uwu2:681936445958914128>',
			'<:uwu3:681937073401233537>',
			'<:uwu4:681937074047549467>'
		];
		message.channel.send(uwusopt[Math.floor(Math.random()) * uwusopt.length]);
    },
};