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
	
	async execute(message, args){
		message.channel.send({ content: '**PAPITA**\n**PAPITA**' });
		message.channel.send({ content: '**OE PAPITA**\n**LA NUEZ**' });
    },
};