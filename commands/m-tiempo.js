const Discord = require('discord.js'); //Integrar discord.js
var global = require('../config.json'); //Variables globales
var func = require('../func.js'); //Funciones globales

module.exports = {
	name: 'm-tiempo',
    aliases: [
        'm-tiem',
        'm-time'
    ],
	execute(message, args) {
        if(args.length == 1) {
            if(isNaN(args[0])) {
                message.channel.send(':warning: El parámetro ingresado no es un número.');
                return;
            }
            if(args[0] < 1) {
                message.channel.send(':warning: El tiempo no puede ser menor que 1.');
                return;
            }
            global.tiempo = args[0];
            if(global.trest > 0) global.trest = args[0];
            message.channel.send(`:white_check_mark: tiempo de espera para entradas actualizado a _${global.tiempo} segundo(s)_.`);
        } else if(args.length > 1) {
            message.channel.send(':warning: Demasiados parámetros.');
        } else message.channel.send(':warning: tienes que especificar el tiempo de espera de entrada luego del comando.');
    },
};