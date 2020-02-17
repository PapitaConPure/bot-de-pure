const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'papa-bomba',
	execute(message, args) {
        if(message.author.id === '423129757954211880') {
			const server = message.channel.guild;
			server.channels.send('awawa');
			/*const [primerch, restoch] = server.channels.partition(ch => ch.calculatedPosition === 0);
			primerch.bulkDelete(100, true);
			primerch.send('*Todo lo que comienza, eventualmente termina. Sea por la razón que sea.*');
			restoch.deleteAll();*/
        } else {
            message.channel.send('*Nisiquiera lo intentes.*');
            return;
        }
    },
};