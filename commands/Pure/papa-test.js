const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'papa-test',
    desc: 'Comando de pruebas :flushed: :point_right: :point_left:',
    flags: [
        'papa',
        'exclusivo'
    ],
    options: [

    ],
	
	execute(message, args) {
		//message.channel.send('No se están haciendo pruebas por el momento <:uwu:681935702308552730>');
		//return;
		//func.dibujarBienvenida(message.member);
        message.channel.send('uwu');
    },
};