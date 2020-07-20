const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'm-expulsar',
    aliases: [
        'm-patear', 'm-sacar',
        'm-kick',
        'm-k'
    ],
	execute(message, args) {
        message.delete();
        if(func.notModerator(message.member)) { //Cancelar si el comando no fue ejecutado por un moderador
            message.channel.send(':closed_lock_with_key: Solo aquellos con un rol de moderación de Drawmaku pueden usar este comando.');
            return;
        }
        if(func.notStartedAndSameChannel(message.channel)) return; //Cancelar si no se está en el evento y/o en el mismo canal del evento
        if(args.length > global.cntjugadores) { //Cancelar si se está expulsando a más jugadores de los que hay jugando
            message.channel.send(':warning: Estás intentando expulsar una cantidad de personas mayor a la de personas jugando.');
        }
        
        if(message.mentions.users.cache.size) {
            var idjugador;
            for(var i = 0; i < args.length; i++) {
                //Comprobar si el jugador está jugando
                idjugador = func.getMentionPlayerID(args[i]);

                //Eliminar jugador encontrado
                if(idjugador !== -1) {
                    message.channel.send(`:no_entry: <@${global.jugadores[idjugador]}> (ex-jugador ${global.numeros[idjugador]}) ha sido expulsado de este Drawmaku`);
                    func.removeFromList(idjugador);
                } else message.channel.send(`:warning: El usuario ${args[i]} no está jugando.`);
            }
        } else if(args.length > 0) {
            var idjugador;
            for(var i = 0; i < args.length; i++) {
                //Comprobar si el jugador está jugando
                if(!isNaN(args[i])) idjugador = func.getNumberPlayerID(args[i]);

                //Eliminar jugador encontrado
                if(idjugador !== -1) {
                    message.channel.send(`:no_entry: <@${global.jugadores[idjugador]}> (ex-jugador ${global.numeros[idjugador]}) ha sido expulsado de este Drawmaku`);
                    func.removeFromList(idjugador);
                } else message.channel.send(`:warning: El jugador ${args[i]} no existe.`);
            }
        } else message.channel.send(`:warning: Debes mencionar a los usuarios que quieres expulsar del Drawmaku. Recuerda: \`${global.p_drmk}m-expulsar <@jugadorA> <@jugadorB> <@jugadorC>...\`.`);


    },
};