var global = require('../config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

function nextRound() {
    if(global.ndibujante < (global.cntjugadores - 1)) global.ndibujante++;
    else global.ndibujante = 0;
    global.chi.send(`:art: *Le toca dibujar a <@${global.jugadores[global.ndibujante]}> (jugador ${global.numeros[global.ndibujante]}).* :art:`);
    global.chi.send(`_Recuerda que puedes consultar la lista de usuarios con \`${global.p_drmk}lista\`._`);
}

module.exports = {
	name: 'saltar',
    aliases: [
        'saltear', 
        'skip',
        's'
    ],
	execute(message, args) {
        if(func.notStartedAndSameChannel(message.channel)) return; //Cancelar si no se está en el evento y/o en el mismo canal del evento
        if(global.jugadores[global.ndibujante] !== message.author.id) { //Cancelar comando si no fue ejecutado por el dibujante
            message.channel.send(`:warning: Solo el dibujante, <@${global.jugadores[global.ndibujante]}> (jugador ${global.numeros[global.ndibujante]}), o un moderador, pueden saltear la adivinanza actual.`);
            return;
        }
        if(global.goingnext) { //Cancelar si ya se está cambiando de jugador
            message.channel.send(':warning: Espera un momento para hacer eso.');
            return;
        }
        
        //Saltar jugador
        message.channel.send(
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
            '***JUGADOR SALTADO***\n' +
            `_<@${global.jugadores[global.ndibujante]}> (jugador ${global.numeros[global.ndibujante]}) ha decidido no dibujar por esta ronda._\n` +
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
        );
        global.seleccionado = false;
        global.dibujado = false;
        global.recompensado = -1;
        global.goingnext = true;
        setTimeout(func.nextPlayer, 1500);
    },
};