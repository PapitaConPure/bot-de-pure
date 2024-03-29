const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../localdata/config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'cambiarpt',
    aliases: [
        'modificarpt', 'cambiarpuntos', 'modificarpuntos', 'cpt', 'mpt',
        'changept', 'modifypt'
    ],
	execute(message, args) {
        message.delete();
        if(func.notModerator(message.member)) { //Cancelar si el comando no fue ejecutado por un moderador
            message.channel.send({ content: ':closed_lock_with_key: Solo aquellos con un rol de moderación de Drawmaku pueden usar este comando.' });
            return;
        }
        if(func.notStartedAndSameChannel(message.channel)) return; //Cancelar si no se está en el evento y/o en el mismo canal del evento
        if(!args.length) {
            message.channel.send({ content: ':warning: No mencionaste a ningún jugador.' });
            return;
        }

        //Identificar jugador
        var idjugador = -1;
        if(message.mentions.users.cache.size) idjugador = func.getMentionPlayerID(args[0]);
        else if(!isNaN(args[0])) idjugador = func.getNumberPlayerID(args[0]);
        else message.channel.send({ content: ':warning: El usuario ' + args[0] + ' no existe.' });

        //Asignar puntos
        if(idjugador !== -1) {
            if(args.length == 2) {
                if(isNaN(args[1])) {
                    message.channel.send({ content: ':warning: El parámetro ingresado no es un número.' });
                    return;
                }
                args[1] = parseInt(args[1]);
                global.puntos[idjugador] += args[1];
                var s;
                if(args[1] !== 1 && args[1] !== -1)
                    s = 's.';
                else
                    s = '.';
                if(args[1] > 0)
                    message.channel.send({ content: `:arrow_heading_up: ${global.nombres[idjugador]} (jugador ${global.numeros[idjugador]}) ha recibido ${args[1]} punto(s).` });
                else if(args[1] < 0)
                    message.channel.send({ content: `:arrow_heading_down: ${global.nombres[idjugador]} (jugador ${global.numeros[idjugador]}) ha perdido ${-args[1]} punto(s). }`});
            } else if(args.length > 2) {
                message.channel.send({ content: ':warning: Demasiados parámetros.' });
            } else {
                global.puntos[idjugador]++;
                message.channel.send({ content: `:arrow_heading_up: ${global.nombres[idjugador]} (jugador ${global.numeros[idjugador]}) ha recibido 1 punto.` });
            }
        } else message.channel.send({ content: ':warning: El jugador que especificaste no está jugando.' });
    },
};