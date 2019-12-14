//Variables globales
var global = require('../config.json');

module.exports = {
	name: 'm-tem',
    aliases: [
        'm-tematica',
        'm-theme'
    ],
	execute(message, args) {
        if(args.length > 8) {
            message.channel.send(':warning: Límite de palabras excedido. Solo se permiten hasta 8 palabras.');
        } else if(args.length > 0) {
            global.tem = args[0];
            for(var i = 1; i < args.length; i++) global.tem += " " + args[i];
            message.channel.send(`:white_check_mark: nombre de temática actualizado a _${args[0]}...[puede continuar]_.`);
        } else message.channel.send(':warning: tienes que especificar la temática luego del comando.');
    },
};