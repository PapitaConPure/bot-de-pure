//Variables globales
var global = require('../config.json');

module.exports = {
	name: 'm-tem',
    aliases: [
        'm-tematica',
        'm-theme'
    ],
	execute(message, args) {
        if(args.length === 1) {
            global.tem = args[0];
            for(var i = 1; i < args.length; i++) global.tem += " " + args[i];
            message.channel.send(`:white_check_mark: nombre de temática actualizado a _${args[0]}...[puede continuar]_.`);
        } else if(args.length > 1) {
            message.channel.send(':warning: Demasiados parámetros.');
        } else message.channel.send(':warning: tienes que especificar la temática luego del comando.');
    },
};