const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../localdata/config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'desaprobar',
	aliases: [
        'no',
        'disapprove',
        'n'
    ],
    execute(message, args) {
        message.delete();
        if(func.notModerator(message.member)) { //Cancelar si el comando no fue ejecutado por un moderador
            message.channel.send({ content: ':closed_lock_with_key: Solo aquellos con un rol de moderación de Drawmaku pueden usar este comando.' });
            return;
        }
        if(func.notStartedAndSameChannel(message.channel)) return; //Cancelar si no se está en el evento y/o en el mismo canal del evento
        if(global.recompensado === -1) { //Cancelar si no hay nadie a recompenzar
            message.channel.send({ content: ':warning: No hay nadie esperando a ser recompensado.' });
            return;
        }
        if(global.goingnext) { //Cancelar si ya se está cambiando de jugador
            message.channel.send({ content: ':warning: Espera un momento para hacer eso.' });
            return;
        }
        
        message.delete();
        if(global.recompensado === -1) {
            message.channel.send({ content: ':warning: No hay nadie esperando a ser recompensado.' });
            return;
        }
        message.channel.send({
            content: `:thumbsdown: Se ha desaprobado la recompensa para <@${global.jugadores[global.recompensado]}> (jugador ${global.numeros[global.recompensado]}). El dibujante tiene que volver a darla.`
        });
        global.recompensado = -1;
    },
};