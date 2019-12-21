const Discord = require('discord.js'); //Integrar discord.js
var global = require('../config.json'); //Variables globales
var func = require('../func.js'); //Funciones globales

module.exports = {
	name: 'papa-guardarestado',
	execute(message, args) {
        if(message.author.id === '423129757954211880' || !func.notModerator(message.member)) {
            fs.writeFile("../config.json", JSON.stringify(global, null, 4), err => {
                if(err) {
                    message.channel.send(':bangbang: Error en la escritura de datos. Se recomienda guardar cualquier dato ingresado al bot en un bloc de notas y reiniciar.');
                    console.error(err);
                }
            });
        }
    },
};