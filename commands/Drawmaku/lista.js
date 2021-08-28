var global = require('../../localdata/config.json'); //Variables globales
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
        
        let str = '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n';
        str += '***LISTA DE JUGADORES***\n';
        str += '_A continuación se ven las estadísticas del evento._\n';
        if(global.cntjugadores > 0) {
            for(var i = 0; i < global.cntjugadores; i++)
                str += `\`Número ${global.numeros[i]}\`, **${global.nombres[i]}**: *${global.puntos[i]} punto(s).*\n`;
        } else str = '`Aún no hay nadie jugando...`\n';
        str += '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n';
        if(global.tjuego === 0) str += '***Esta edición de Drawmaku terminará al final de la ronda actual.***';
        else str += `*Tiempo restante: ${Math.floor(global.tjuego / 3600)}:${('0' + Math.floor((global.tjuego / 60) % 60)).slice(-2)}:${('0' + global.tjuego % 60).slice(-2)}*`;
        message.channel.send({ content: str });
    },
};