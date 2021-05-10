const { hourai } = require('../../localdata/config.json'); //Variables globales
const { askColor } = require('../../func'); //Funciones globales

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
		message.channel.send(`Aquí teni los colore po **${message.author.username}** <:reibu:686220828773318663>`, { files: [hourai.images.colors] })
			.then(sent => askColor(sent, message.member));
    },
};