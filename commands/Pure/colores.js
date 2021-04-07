const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../config.json'); //Variables globales
const func = require('../../func');

module.exports = {
	name: 'colores',
	aliases: [
		'color', 'roles', 'rol',
		'colours', 'colour', 'role',
		'c'
	],
    desc: 'Muestra un tablón de roles de colores básicos para Hourai Doll',
    flags: [
        'hourai'
    ],
    options: [

    ],
	
	execute(message, args) {
		message.channel.send(`Aquí teni los colore po <:reibu:686220828773318663>\n${global.hourai.images.colors}`).then(sent => func.askColor(sent, message.member));
    },
};