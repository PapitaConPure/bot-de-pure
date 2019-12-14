//Variables globales
var global = require('../config.json');

module.exports = {
	name: 'm-desc',
    aliases: [
        'm-descripcion',
        'm-description'
    ],
	execute(message, args) {
        if(args.length === 1) {
            global.desc = args[0];
            for(var i = 1; i < args.length; i++) global.desc += " " + args[i];
            message.channel.send(':white_check_mark: descripción global actualizada.');
        } else if(args.length > 1) {
            message.channel.send(':warning: Demasiados parámetros.');
        } else message.channel.send(':warning: tienes que especificar la descripción luego del comando.');
    },
};