const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../localdata/config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'rolnotif',
    aliases: [
        'rolnotificación', 'notificaciónrol', 'notifrol',
        'notificationrole', 'notifrole'
    ],
	execute(message, args) {
        if(!func.notModerator(message.member)) {
            if(args.length === 1) {
                if(message.mentions.roles.size) {
                    if(args[0].startsWith('<@') && args[0].endsWith('>')) {
                        args[0] = args[0].slice(2, -1);
                        if(args[0].startsWith('&')) args[0] = args[0].slice(1);
                    }

                    if(global.notroles === 'na') message.channel.send(`:white_check_mark: rol <@&${args[0]}> establecido como rol de notificación de Drawmaku.`);
                    else message.channel.send(`:white_check_mark: rol <@&${args[0]}> sobreescrito en los roles de notificación de Drawmaku.`);
                } else {
                    let rol = message.guild.roles.get(args[0]);
                    if(rol === undefined) {
                        message.channel.send('El argumento especificado no parece ser un rol o una ID de rol.');
                        return;
                    }
                    if(global.notroles === 'na') message.channel.send(`:white_check_mark: rol ${rol.name} establecido como rol de notificación de Drawmaku.`);
                    else message.channel.send(`:white_check_mark: rol ${rol.name} sobreescrito en los roles de notificación de Drawmaku.`);
                }
                global.notroles = args[0];
            } else if(args.length === 0) {
                if(global.notroles === 'na')
                    message.channel.send(
                        ':no_bell::no_bell::no_bell:\n' +
                        'Aún no se ha establecido el rol de notificación de Drawmaku.\n' +
                        'Es altamente recomendable crear un rol de notificación de Drawmaku y enlistarlo con `d!rolnotif <rol>`.\n' +
                        ':no_bell::no_bell::no_bell:\n'
                    );
                else {
                    let rol = message.guild.roles.get(global.notroles);
                    if(rol === undefined) {
                        message.channel.send(':warning: parece que el rol establecido fue eliminado. Se recomienda establecer otro rol de notificación de Drawmaku.');
                        return;
                    }
                    message.channel.send(`:bell: el rol de notificación Drawmaku designado es "${rol.name}" (ID: ${global.notroles})`);
                }
            } else if(args.length > 1) message.channel.send(':warning: demasiados parámetros. Recuerda: `d!rolnotif <rol>`.');
        } else {
            message.channel.send(':closed_lock_with_key: solo aquellos con un rol de moderación de Drawmaku pueden usar este comando.');
            return;
        }
    },
};