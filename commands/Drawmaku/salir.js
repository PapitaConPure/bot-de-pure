var global = require('../config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'salir',
    aliases: [
        'abandonar', 'retirarse',
        'quit', 'leave'
    ],
	execute(message, args) {
        if(func.notStartedAndSameChannel(message.channel, true)) return; //Cancelar si no se está en el evento y/o en el mismo canal del evento
        
        //Comprobar si el jugador está jugando
        var idjugador = func.getMentionPlayerID(`<@${message.author.id}>`);
        
        //Sacar jugador si está jugando
        if(idjugador !== -1) {
            message.channel.send(`:wave: _<@${global.jugadores[idjugador]}> (ex-jugador ${global.numeros[idjugador]}) ha abandonado el Drawmaku._`);
            func.removeFromList(idjugador);
        } else message.channel.send(':warning: Tenés que estar dentro del evento para salirte.');
    },
};