const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'chise',
	aliases: [
		'sylvia', 'empalar'
	],
    desc: 'Comando de empalamiento de Chise',
    flags: [
        'meme'
    ],
	
	execute(message, args) {
		if(message.channel.guild.id === '654471968200065034')
			message.channel.send(
				'https://cdn.discordapp.com/attachments/659885154105294874/723765798799147038/unknown.png\n' +
				'https://cdn.discordapp.com/attachments/659885154105294874/723765958552060004/unknown.png\n' +
				'https://cdn.discordapp.com/attachments/659885154105294874/723765965086523463/unknown.png\n' +
				'https://cdn.discordapp.com/attachments/659885154105294874/723766052928094249/unknown.png'
			);
		else
			message.channel.send(':x: Disculpa, soy estúpido. Tal vez escribiste mal el comando y no te entiendo.');
    },
};