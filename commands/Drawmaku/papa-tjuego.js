const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'papa-tjuego',
	execute(message, args) {
        if(message.author.id === '423129757954211880') {
            if(args.length > 0) {
                global.tjuego = args[0];
                message.channel.send(`:white_check_mark: tiempo de espera para final de la partida actualizado a _${global.tjuego} segundo(s)_.`);
            } else message.channel.send(':warning: tienes que especificar el tiempo de espera de entrada luego del comando.');
        } else {
            message.channel.send(':closed_lock_with_key: Solo Papita con Pure puede usar este comando.');
            return;
        }
    },
};