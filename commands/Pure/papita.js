const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'papita',
	aliases: [
        'papa', 'leche'
    ],
	execute(message, args){
		if(message.channel.nsfw) message.channel.send('https://www.youtube.com/watch?v=pwEvEY-7p9o');
		else message.channel.send('**Lechita:tm: uwu** :milk:');
    },
};