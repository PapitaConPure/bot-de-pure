var global = require('../config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'lista',
    aliases: [
        'tabla', 'jugadores', 'puntaje', 'puntajes', 'puntos', 'ronda', 'fila',
        'list', 'table', 'players', 'score', 'points', 'queue',
        'l', 'q'
    ],
	execute(message, args) {
        if(func.notStartedAndSameChannel(message.channel, true)) return; //Cancelar si no se está en el evento y/o en el mismo canal del evento
        
        var str = '';
        if(global.cntjugadores > 0) {
            for(var i = 0; i < global.cntjugadores; i++)
                str += `\`Número ${global.numeros[i]}\`, **${global.nombres[i]}**: *${global.puntos[i]} punto(s).*\n`;
        } else str = '`Aún no hay nadie jugando...`\n';
        message.channel.send(
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
            '***LISTA DE JUGADORES***\n' +
            '_A continuación se ven las estadísticas del evento._\n' +
            `${str}` +
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
        );
    },
};