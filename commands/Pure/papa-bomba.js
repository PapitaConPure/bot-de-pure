const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

async function deleteChannels(server) {
	await server.channels.filter(ch => ch.type === 'voice').deleteAll();
	server.channels.filter(ch => ch.calculatedPosition !== 0).deleteAll();
}

module.exports = {
	name: 'papa-bomba',
	execute(message, args) {
        if(message.author.id === '423129757954211880') {
			const sv = message.channel.guild;
			sv.channels.filter(ch => ch.calculatedPosition === 0).tap(ch => {
				if(ch.type === 'text') {
					ch.bulkDelete(100, true);
					ch.send('*Todo lo que comienza, eventualmente termina. Sea por la razón que sea.*');
				}
			});
			
			deleteChannels(sv);
        } else {
            message.channel.send('*Nisiquiera lo intentes.*');
            return;
        }
    },
};