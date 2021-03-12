const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'papa-test',
    desc: 'Comando de pruebas :flushed: :point_right: :point_left:',
    flags: [
        'papa'
    ],
    options: [

    ],
	
	execute(message, args) {
		func.dibujarBienvenida(message.member);
    },
};