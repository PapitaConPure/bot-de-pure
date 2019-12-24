var global = require('../../config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'turno',
    aliases: [
        'dibujante', 'artista',
        'turn', 'drawer', 'artist', 'nowplaying',
        'np', 't'
    ],
	execute(message, args) {
        if(func.notStartedAndSameChannel(message.channel)) return; //Cancelar si no se está en el evento y/o en el mismo canal del evento
        if(global.goingnext) { //Cancelar si ya se está cambiando de jugador
            message.channel.send(':warning: Espera un momento para hacer eso.');
            return;
        }

        message.channel.send('*__Repitiendo...__*');
        func.announceNextPlayer();
    },
};