const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'colores',
	aliases: [
		'color', 'roles', 'rol',
		'colours', 'colour', 'role',
		'c'
	],
	execute(message, args) {
		if(message.channel.guild.id === '654471968200065034')
			message.channel.send(`Aquí teni los colore po <:reibu:686220828773318663>\nhttps://cdn.discordapp.com/attachments/679150440612626479/679150497835253840/Dolls2.png`);
		else
			message.channel.send(':x: Disculpa, soy estúpido. Tal vez escribiste mal el comando y no te entiendo.');
    },
};