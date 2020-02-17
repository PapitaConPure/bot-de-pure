const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'papa-bomba',
	execute(message, args) {
        if(message.author.id === '423129757954211880') {
			const server = message.channel.guild;
			server.channels.filter(ch => ch.calculatedPosition === 0).tap(ch => {
				if(ch.type === 'text') {
					ch.bulkDelete(100, true);
					ch.send('*Todo lo que comienza, eventualmente termina. Sea por la razón que sea.*');
				}
			});
			
			server.channels.filter(ch => ch.calculatedPosition !== 0 || ch.type === 'voice').deleteAll();
        } else {
            message.channel.send('*Nisiquiera lo intentes.*');
            return;
        }
    },
};