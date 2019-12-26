const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'fuee',
	aliases: [
        'nuez'
    ],
	execute(message, args){
		message.channel.send('**PAPITA**\n**PAPITA**');
		message.channel.send('**OE PAPITA**\n**LA NUEZ**');
    },
};