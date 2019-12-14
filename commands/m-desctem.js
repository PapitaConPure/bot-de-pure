//Variables globales
var global = require('../config.json');

module.exports = {
	name: 'm-desctem',
    aliases: [
        'm-descripciontematica',
        'm-temdesc', 'm-themedescription'
    ],
	execute(message, args) {
        if(args.length > 60) {
            message.channel.send(':warning: Límite de palabras excedido. Solo se permiten hasta 60 palabras.');
        } else if(args.length > 0) {
            global.desctem = args[0];
            for(var i = 1; i < args.length; i++) global.desctem += " " + args[i];
            message.channel.send(':white_check_mark: descripción de temática actualizada.');
        } else message.channel.send(':warning: tienes que especificar la descripción de temática luego del comando.');
    },
};