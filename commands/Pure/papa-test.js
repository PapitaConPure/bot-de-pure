//const Discord = require('discord.js'); //Integrar discord.js
//const global = require('../../config.json'); //Variables globales
//const func = require('../../func.js'); //Funciones globales
const uwu = require('./uwu.js');

module.exports = {
	name: 'papa-test',
    desc: 'Comando de pruebas :flushed: :point_right: :point_left:',
    flags: [
        'papa'
    ],
    options: [

    ],
	
	execute(message, args) {
        uwu.execute(message, args);
    },
};