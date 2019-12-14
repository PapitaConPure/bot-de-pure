//Variables globales
var global = require('../config.json');

module.exports = {
	name: 'm-edi',
    aliases: [
        'm-edicion', 'm-numedi',
        'm-edition', 'm-edinum'
    ],
	execute(message, args) {
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