const Discord = require('discord.js'); //Integrar discord.js
var global = require('../config.json'); //Variables globales

module.exports = {
	name: 'papa-rolmoderador',
	execute(message, args) {
        if(message.author.id === '423129757954211880') {
            if(args.length === 2) {
                if(message.mentions.roles.size) {
                    if(args[1].startsWith('<@') && args[1].endsWith('>')) {
                        args[1] = args[1].slice(2, -1);
                        if(args[1].startsWith('$')) args[1] = args[1].slice(1);
                    }

                    switch(args[0]) {
                        case '+':
                            var tmp = global.modroles.length;
                            global.modroles[tmp] = args[1];
                        break;

                        case '-':
                            for(var i = 0; i < global.modroles.length; i++)
                                if(global.modroles[i] === args[1]) {
                                    global.modroles[i] = -1;
                                    break;
                                }
                        break;

                        default:
                            message.channel.send(':warning: Parámetros inválidos.');
                    }
                } else message.channel.send(':warning: tienes que mencionar un rol a volver moderador Drawmaku.');
            } else if(args.length < 2) message.channel.send(':warning: Parámetros insuficientes. Recuerda: `d!papa-rolmoderador <[+/-]*> <@$rol*>`.');
            else message.channel.send(':warning: Demasiados parámetros. Recuerda: `d!papa-rolmoderador <[+/-]*> <@$rol*>`.');
        } else {
            message.channel.send(':closed_lock_with_key: Solo Papita con Pure puede usar este comando.');
            return;
        }
    },
};