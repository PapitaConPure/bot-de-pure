var global = require('../../config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'm-aprobar',
    aliases: [
        'm-si',
        'm-approve', 'm-yes',
        'm-y'
    ],
	execute(message, args) {
        message.delete();
        if(func.notModerator(message.member)) { //Cancelar si el comando no fue ejecutado por un moderador
            message.channel.send(':closed_lock_with_key: Solo aquellos con un rol de moderación de Drawmaku pueden usar este comando.');
            return;
        }
        if(func.notStartedAndSameChannel(message.channel)) return; //Cancelar si no se está en el evento y/o en el mismo canal del evento
        if(global.recompensado === -1) { //Cancelar si no hay nadie a recompenzar
            message.channel.send(':warning: No hay nadie esperando a ser recompensado.');
            return;
        }
        if(global.goingnext) { //Cancelar si ya se está cambiando de jugador
            message.channel.send(':warning: Espera un momento para hacer eso.');
            return;
        }

        global.puntos[global.recompensado]++;
        message.channel.send(`:thumbsup: Se ha aprobado la recompensa para <@${global.jugadores[global.recompensado]}> (jugador ${global.numeros[global.recompensado]}).`);
        global.seleccionado = false;
        global.dibujado = false;
        global.recompensado = -1;
        global.goingnext = true;
        setTimeout(func.nextPlayer, 1500);
    },
};