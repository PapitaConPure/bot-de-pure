const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'papita',
	aliases: [
        'papa', 'leche',
		'potato', 'milk'
    ],
	execute(message, args){
		if(args.length) {
			let newmsg;
			newmsg = `***:copyright: ${args[0]}:registered:`;
			for(let i = 1; i < args.length; i++)
				newmsg += ` ${args[i]}:tm:`;
			newmsg += `***`;
			message.channel.send(newmsg);
		} else {
			if(message.channel.nsfw) message.channel.send('https://www.youtube.com/watch?v=pwEvEY-7p9o');
			else message.channel.send('**Lechita:tm: uwu** :milk:');
		}
    },
};