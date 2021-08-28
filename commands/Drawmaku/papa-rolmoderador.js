const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../localdata/config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'papa-rolmoderador',
	execute(message, args) {
        if(message.author.id === '423129757954211880' || !func.notModerator(message.member)) {
            if(args.length === 2) {
                if(message.mentions.roles.size) {
                    if(args[1].startsWith('<@') && args[1].endsWith('>')) {
                        args[1] = args[1].slice(2, -1);
                        if(args[1].startsWith('&')) args[1] = args[1].slice(1);
                    }

                    switch(args[0]) {
                        case '+':
                            var canwrite = true;
                            for(var i = 0; i < global.modroles.length; i++)
                                if(global.modroles[i] === args[1]) {
                                    canwrite = false;
                                    break;
                                }
                            if(canwrite) {
                                var tmp = global.modroles.length;
                                for(var i = 0; i < global.modroles.length; i++)
                                    if(global.modroles[i] === -1) {
                                        tmp = i;
                                        break;
                                    }
                                global.modroles[tmp] = args[1];
                                message.channel.send({ content: `:white_check_mark: rol <@&${args[1]}> añadido a los roles de moderación de Drawmaku.` });
                            } else message.channel.send({ content: `:warning: el rol <@&${args[1]}> ya fue añadido a los roles de moderación de Drawmaku anteriormente.` });
                        break;

                        case '-':
                            var found = false;
                            for(var i = 0; i < global.modroles.length; i++)
                                if(global.modroles[i] === args[1]) {
                                    global.modroles[i] = -1;
                                    found = true;
                                    break;
                                }
                            if(found) message.channel.send({ content: `:white_check_mark: rol <@&${args[1]}> eliminado de los roles de moderación de Drawmaku.` });
                            else message.channel.send({ content: `:warning: el rol <@&${args[1]}> no se encuentra entre los roles de moderación de Drawmaku.` });
                        break;

                        default:
                            message.channel.send({ content: ':warning: Parámetros inválidos o en orden incorrecto. Recuerda: `d!papa-rolmoderador <[+/-]*> <@$rol*>`.' });
                    }
                } else message.channel.send({ content: ':warning: tienes que mencionar un rol a volver moderador Drawmaku.' });
            } else if(args.length === 0) {
                if(!global.modroles.length) {
                    message.channel.send({
                        content:
                            ':tools::no_entry_sign::tools::no_entry_sign:\n' +
                            'Aún no se ha establecido ningún rol de moderador Drawmaku.\n' +
                            'Es altamente recomendable crear un rol de moderación de Drawmaku y enlistarlo con `d!papa-rolmoderador <[+/-]*> <@$rol*>`.\n' +
                            ':tools::no_entry_sign::tools::no_entry_sign:\n'
                    });
                }
                var str = '';
                for(var i = 0; i < global.modroles.length; i++)
                    str += `${i + 1}: <@&${(global.modroles[i] !== -1)?(global.modroles[i]):'vacante'}>\n`;
                message.channel.send({ content: str });
            } else if(args.length < 2) message.channel.send({ content: ':warning: Parámetros insuficientes. Recuerda: `d!papa-rolmoderador <[+/-]*> <@$rol*>`.' });
            else message.channel.send({ content: ':warning: Demasiados parámetros. Recuerda: `d!papa-rolmoderador <[+/-]*> <@$rol*>`.' });
        } else {
            message.channel.send({ content: ':closed_lock_with_key: Solo Papita con Puré y aquellos con un rol de moderación de Drawmaku pueden usar este comando.' });
            return;
        }
    },
};