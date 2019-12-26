const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'tryhard',
	aliases: [
        'bern', 'imagine', 'tryhardeo'
    ],
	execute(message, args){
		message.channel.send('**TRYHARD**\n**TRYHARD**');
    },
};