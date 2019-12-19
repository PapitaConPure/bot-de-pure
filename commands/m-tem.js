const Discord = require('discord.js'); //Integrar discord.js
var global = require('../config.json'); //Variables globales
var func = require('../func.js'); //Funciones globales

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