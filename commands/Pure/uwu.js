const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'uwu',
    desc: '',
    flags: [
        'common'
    ],
	
	execute(message, args) {
		const uwusopt = [
			'<:uwu:681935702308552730>',
			'<:uwu2:681936445958914128>',
			'<:uwu3:681937073401233537>',
			'<:uwu4:681937074047549467>',
			'<:uwu5:720506981743460472>'
		];
		message.channel.send(uwusopt[Math.floor(Math.random() * uwusopt.length)]);
    },
};