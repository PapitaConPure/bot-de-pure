const Discord = require('discord.js'); //Integrar discord.js
var global = require('../config.json'); //Variables globales
var func = require('../func.js'); //Funciones globales

module.exports = {
	name: 'm-cambiarpt',
    aliases: [
        'm-modificarpt', 'm-cambiarpuntos', 'm-modificarpuntos', 'm-cpt', 'm-mpt',
        'm-changept', 'm-modifypt'
    ],
	execute(message, args) {
        message.delete(message.author.lastMessageID);
        if(func.notStartedAndSameChannel(message.channel, true)) return; //Cancelar si no se está en el evento y/o en el mismo canal del evento
        if(!args.length) {
            message.channel.send(':warning: No mencionaste a ningún jugador.');
            return;
        }

        //Identificar jugador
        var idjugador = -1;
        if(message.mentions.users.size) idjugador = func.getMentionPlayerID(args[0]);
        else if(!isNaN(args[0])) idjugador = func.getNumberPlayerID(args[0]);
        else message.channel.send(':warning: El usuario ' + args[0] + ' no existe.');

        //Asignar puntos
        if(idjugador !== -1) {
            if(args.length == 2) {
                if(isNaN(args[1])) {
                    message.channel.send(':warning: El parámetro ingresado no es un número.');
                    return;
                }
                args[1] = parseInt(args[1]);
                global.puntos[idjugador] += args[1];
                var s;
                if(args[1] !== 1 && args[1] !== -1) s = 's.'; else s = '.';
                if(args[1] > 0) message.channel.send(`:arrow_heading_up: ${global.nombres[idjugador]} (jugador ${global.numeros[idjugador]}) ha recibido ${args[1]} punto(s).`);
                else if(args[1] < 0) message.channel.send(`:arrow_heading_down: ${global.nombres[idjugador]} (jugador ${global.numeros[idjugador]}) ha perdido ${-args[1]} punto(s).`);
            } else if(args.length > 2) {
                message.channel.send(':warning: Demasiados parámetros.');
            } else {
                global.puntos[idjugador]++;
                if(args[1] > 0) message.channel.send(`:arrow_heading_up: ${global.nombres[idjugador]} (jugador ${global.numeros[idjugador]}) ha recibido 1 punto.`);
                else if(args[1] < 0) message.channel.send(`:arrow_heading_down: ${global.nombres[idjugador]} (jugador ${global.numeros[idjugador]}) ha perdido 1 punto.`);
            }
        } else message.channel.send(':warning: El jugador que especificaste no está jugando.');
    },
};