const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../localdata/config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'tiempo',
    aliases: [
        'tiem',
        'time'
    ],
	execute(message, args) {
        if(func.notModerator(message.member)) {
            message.channel.send({ content: ':closed_lock_with_key: Solo aquellos con un rol de moderación de Drawmaku pueden usar este comando.' });
            return;
        }
        if(args.length == 1) {
            if(isNaN(args[0])) {
                message.channel.send({ content: ':warning: El parámetro ingresado no es un número.' });
                return;
            }
            if(args[0] < 1) {
                message.channel.send({ content: ':warning: El tiempo no puede ser menor que 1.' });
                return;
            }
            global.tiempo = args[0];
            if(global.trest > 0) global.trest = args[0];
            message.channel.send({ content: `:white_check_mark: tiempo de espera para entradas actualizado a _${global.tiempo} segundo(s)_.` });
        } else if(args.length > 1) {
            message.channel.send({ content: ':warning: Demasiados parámetros.' });
        } else message.channel.send({ content: ':warning: tienes que especificar el tiempo de espera de entrada luego del comando.' });
    },
};