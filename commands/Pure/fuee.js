const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../localdata/config.json'); //Variables globales

module.exports = {
	name: 'fuee',
	aliases: [
        'dylan', 'nuez'
    ],
    desc: 'Comando de frase de Dylan/Fuee',
    flags: [
        'meme',
        'outdated'
    ],
	
	execute(message, args){
		message.channel.send('**PAPITA**\n**PAPITA**');
		message.channel.send('**OE PAPITA**\n**LA NUEZ**');
    },
};