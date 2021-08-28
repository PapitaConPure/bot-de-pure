const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../localdata/config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'desctem',
    aliases: [
        'descripciontematica',
        'temdesc', 'themedescription'
    ],
	execute(message, args) {
        if(func.notModerator(message.member)) {
            message.channel.send({ content: ':closed_lock_with_key: Solo aquellos con un rol de moderación de Drawmaku pueden usar este comando.' });
            return;
        }
        if(args.length > 60) {
            message.channel.send({ content: ':warning: Límite de palabras excedido. Solo se permiten hasta 60 palabras.' });
        } else if(args.length > 0) {
            global.desctem = args[0];
            for(var i = 1; i < args.length; i++) global.desctem += " " + args[i];
            message.channel.send({ content: ':white_check_mark: descripción de temática actualizada.' });
        } else message.channel.send({ content: ':warning: tienes que especificar la descripción de temática luego del comando.' });
    },
};