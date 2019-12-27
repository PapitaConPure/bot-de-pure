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
        let str = '';
        if(global.recompensado !== -1) str += '_Esperando aprobación de recompensa..._\n';
        else {
            if(global.seleccionado && global.dibujado) str += '_Esperando a que adivinen el danmaku._';
            else {
                if(!global.seleccionado) str += '_Esperando selección de nombre de danmaku..._\n';
                if(!global.dibujado) str += '_Esperando dibujo del danmaku..._\n';
            }
        }
        message.channel.send(str);
    },
};