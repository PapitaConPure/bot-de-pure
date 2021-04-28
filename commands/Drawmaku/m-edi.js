const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../localdata/config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'm-edi',
    aliases: [
        'm-edicion', 'm-numedi',
        'm-edition', 'm-edinum'
    ],
	execute(message, args) {
        if(func.notModerator(message.member)) {
            message.channel.send(':closed_lock_with_key: Solo aquellos con un rol de moderación de Drawmaku pueden usar este comando.');
            return;
        }
        if(args.length === 1) {
            if(isNaN(args[0])) {
                message.channel.send(':warning: El parámetro ingresado no es un número.');
                return;
            }
            if(args[0] < 1) {
                message.channel.send(':warning: La edición del evento no puede ser menor que 1.');
                return;
            }
            global.edi = args[0];
            message.channel.send(':white_check_mark: número de edición actualizado.');
        } else if(args.length > 1) {
            message.channel.send(':warning: Demasiados parámetros.');
        } else message.channel.send(':warning: tienes que especificar el número de edición luego del comando.');
    },
};