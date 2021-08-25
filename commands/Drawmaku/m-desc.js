const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../localdata/config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'desc',
    aliases: [
        'descripcion',
        'description'
    ],
	execute(message, args) {
        if(func.notModerator(message.member)) {
            message.channel.send(':closed_lock_with_key: Solo aquellos con un rol de moderación de Drawmaku pueden usar este comando.');
            return;
        }
        if(args.length > 100) {
            message.channel.send(':warning: Límite de palabras excedido. Solo se permiten hasta 100 palabras.');
        } else if(args.length > 0) {
            global.desc = args[0];
            for(var i = 1; i < args.length; i++) global.desc += " " + args[i];
            message.channel.send(':white_check_mark: descripción global actualizada.');
        } else message.channel.send(':warning: tienes que especificar la descripción luego del comando.');
    },
};