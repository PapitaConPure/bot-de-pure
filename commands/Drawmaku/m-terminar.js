const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../localdata/config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'terminar',
    aliases: [
        'finalizar', 'final', 'fin',
        'finish', 'end',
        'ed'
    ],
	execute(message, args) {
        //Comprobar que se esté jugando o por jugar
        if(func.notModerator(message.member)) {
            message.channel.send({ content: ':closed_lock_with_key: Solo aquellos con un rol de moderación de Drawmaku pueden usar este comando.' });
            return;
        }
        if(!global.trest && !global.empezado) {
            message.channel.send({ content: ':warning: No ha empezado ni está por empezar ningún Drawmaku.' });
            return;
        }
        if(message.channel !== global.chi) {
            message.channel.send({ content: `:warning: Drawmaku fue iniciado en ${chi}. Ingresa tus comandos de juego ahí.` });
            confirm = false;
        }

        //Terminar cualquier proceso del Drawmaku
        if(global.empezado) {
            if(global.tjuego > 1) global.tjuego = 1;
            else message.channel.send({ content: ':warning: El Drawmaku terminará cuando finalice la ronda.' });
        } else {
            message.channel.send({ content: ':octagonal_sign: Se ha cancelado el inicio del Drawmaku.' });
            func.reiniciarTodo();
        }
    },
};