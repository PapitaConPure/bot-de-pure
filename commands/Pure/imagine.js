const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'imagine',
	aliases: [
        'tryhard', 'tryhardeo'
    ],
	execute(message, args){
		message.channel.send('**TRYHARD**\n**TRYHARD**');
    },
};