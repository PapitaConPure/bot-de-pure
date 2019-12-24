const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'recomp',
    aliases: [
        'adivina', 'adivino', 'darrecomp', 'recompensa', 'recompensar', 'darrecompensa',
        'reward', 'givereward',
        'r'
    ],
	execute(message, args) {
        if(func.notStartedAndSameChannel(message.channel)) return; //Cancelar si no se está en el evento y/o en el mismo canal del evento
        if(global.jugadores[global.ndibujante] !== message.author.id) { //Cancelar comando si no fue ejecutado por el dibujante
            message.channel.send(`:warning: Solo el dibujante, <@${global.jugadores[global.ndibujante]}> (jugador ${global.numeros[global.ndibujante]}), puede dar la recompensa.`);
            return;
        }
        if(!args.length) { //Cancelar si no se dio ningún parámetro
            message.channel.send(`:warning: No mencionaste a ningún jugador, recuerda: \`${global.p_drmk}recomp <@usuario>\`.`);
            return;
        }
        if(!global.seleccionado || !global.dibujado) { //Cancelar si no ha empezado la adivinanza
            message.channel.send(':warning: Todavía no ha empezado la adivinanza.');
            return;
        }

        //Dar recompensa si se pasa la comprobación
        //Identificar jugador
        var idjugador = -1;
        if(message.mentions.users.size) idjugador = func.getMentionPlayerID(args[0]);
        else if(!isNaN(args[0])) idjugador = func.getNumberPlayerID(args[0]);
        else message.channel.send(':warning: El usuario ' + args[0] + ' no existe.');

        //Asignar puntos
        if(idjugador !== -1) {
            if(global.recompensado !== idjugador) {
                global.recompensado = idjugador;
                message.channel.send(
                    '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
                    '***¡¡¡DEJEN DE VOTAR!!! ¡UN JUGADOR HA ACERTADO!***\n' +
                    `_¡<@${global.jugadores[idjugador]}> (jugador ${global.numeros[idjugador]}) ha acertado! ¡Felicidades!_\n\n` +
                    `**El danmaku a adivinar era: \`${global.danmaku}\`.**\n\n` +
                    `Esperando a que un moderador ingrese \`${global.p_drmk}m-aprobar\` o \`${global.p_drmk}m-desaprobar\`.\n` +
                    'En caso de que se desapruebe, el dibujante deberá volver a dar la recompensa.\n' +
                    '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
                );
            } else message.channel.send(':warning: Ya se seleccionó un recompensado. Esperando aprobación de un moderador...');
        } else message.channel.send(':warning: El jugador que especificaste no está jugando.');
    },
};