const global = require('../../localdata/config.json'); //Variables globales
const func = require('../../func'); //Funciones globales

module.exports = {
	name: 'colores',
	aliases: [
		'color', 'roles', 'rol',
		'colours', 'colour', 'colors', 'role',
		'c'
	],
    desc: 'Muestra un tablón de roles de colores básicos para Hourai Doll',
    flags: [
        'hourai'
    ],
	
	execute(message, args) {
		message.channel.send(`Aquí teni los colore po **${message.author.username}** <:reibu:686220828773318663>`, { files: [global.hourai.images.colors] })
			.then(sent => func.askColor(sent, message.member));
    },
};