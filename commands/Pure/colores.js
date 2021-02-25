const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'colores',
	aliases: [
		'color', 'roles', 'rol',
		'colours', 'colour', 'role',
		'c'
	],
    desc: '',
    flags: [
        ''
    ],
	
	execute(message, args) {
		if(message.channel.guild.id === '654471968200065034')
			message.channel.send(`Aquí teni los colore po <:reibu:686220828773318663>\nhttps://imgur.com/D5Z8Itb`);
		else
			message.channel.send(':x: Disculpa, soy estúpido. Tal vez escribiste mal el comando y no te entiendo.');
    },
};