const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'papa-bomba',
	execute(message, args) {
		if(message.member.hasPermission('MANAGE_MESSAGES', false, true, true)) {
			
        } else {
            message.channel.send('*Nisiquiera lo intentes...*');
            return;
        }
    },
};