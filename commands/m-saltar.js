const Discord = require('discord.js'); //Integrar discord.js
var global = require('../config.json'); //Variables globales
var func = require('../func.js'); //Funciones globales

module.exports = {
	name: 'm-saltar',
    aliases: [
        'm-saltear',
        'm-skip',
        'm-s'
    ],
	execute(message, args) {
        if(func.notStartedAndSameChannel(message.channel)) return; //Cancelar si no se está en el evento y/o en el mismo canal del evento
        if(global.goingnext) { //Cancelar si ya se está cambiando de jugador
            message.channel.send(':warning: Espera un momento para hacer eso.');
            return;
        }
        
        //Saltar jugador
        message.delete(message.author.lastMessageID);
        message.channel.send(`:stop_sign: <@${global.jugadores[global.ndibujante]}> (jugador ${global.numeros[global.ndibujante]}) ha sido forzado a dejar de dibujar por esta ronda.`);
        global.seleccionado = false;
        global.dibujado = false;
        global.recompensado = -1;
        global.goingnext = true;
        setTimeout(func.nextPlayer, 1500);
    },
};