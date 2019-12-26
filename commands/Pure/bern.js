const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'bern',
	aliases: [
        'bewny', 'bernbailando',
		'berndance'
    ],
	execute(message, args){
		message.channel.send(':men_wrestling:');
    },
};