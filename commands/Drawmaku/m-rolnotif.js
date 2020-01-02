const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'm-rolnotif',
    aliases: [
        'm-rolnotificación', 'm-notificaciónrol', 'm-notifrol',
        'm-notificationrole', 'm-notifrole'
    ],
	execute(message, args) {
        if(!func.notModerator(message.member)) {
            if(!message.member.channel.guild.roles.some(role => role.id === global.notroles)) {
                message.channel.send(':warning: el parámetro especificado no es un rol o una ID de rol.');
                return;
            }
            if(args.length === 1) {
                if(args[1].startsWith('<@') && args[1].endsWith('>')) {
                    args[1] = args[1].slice(2, -1);
                    if(args[1].startsWith('&')) args[1] = args[1].slice(1);
                }

                global.notroles = args[0];
                if(global.notroles === 'na') message.channel.send(`:white_check_mark: rol <@&${args[0]}> establecido como rol de notificación de Drawmaku.`);
                else message.channel.send(`:white_check_mark: rol <@&${args[0]}> sobreescrito en los roles de notificación de Drawmaku.`);
            } else if(args.length === 0) {
                if(global.notroles === 'na')
                    message.channel.send(
                        ':no_bell::no_bell::no_bell:\n' +
                        'Aún no se ha establecido el rol de notificación de Drawmaku.\n' +
                        'Es altamente recomendable crear un rol de notificación de Drawmaku y enlistarlo con `d!m-rolnotif <rol>`.\n' +
                        ':no_bell::no_bell::no_bell:\n'
                    );
                else message.channel.send(`El rol de notificación Drawmaku designado es ${global.notroles[i]}`);
            } else if(args.length > 1) message.channel.send(':warning: Demasiados parámetros. Recuerda: `d!m-rolnotif <rol>`.');
        } else {
            message.channel.send(':closed_lock_with_key: Solo aquellos con un rol de moderación de Drawmaku pueden usar este comando.');
            return;
        }
    },
};