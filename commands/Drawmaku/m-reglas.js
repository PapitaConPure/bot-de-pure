const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../localdata/config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'reglas',
    aliases: [
        'reglamento', 'regla',
        'rule', 'rules'
    ],
	execute(message, args) {
        if(func.notModerator(message.member)) {
            message.channel.send({ content: ':closed_lock_with_key: Solo aquellos con un rol de moderación de Drawmaku pueden usar este comando.' });
            return;
        }
        if(args.length > 51) {
            message.channel.send({ content: ':warning: límite de palabras excedido. Solo se permiten hasta 50 palabras.' });
        } else if(args.length > 1) {
            let numregla = args[0];
            if(isNaN(numregla)) {
                message.channel.send({ content: ':warning: el número de regla es inválido.' });
                return;
            }
            if(numregla < 1 || numregla > 50) {
                message.channel.send({ content: ':warning: el número de regla debe estar entre 1 y 50.' });
                return;
            }
            global.reglas[numregla - 1] = args[1];
            for(var i = 2; i < args.length; i++) global.reglas[numregla - 1] += " " + args[i];
            message.channel.send({ content: `:white_check_mark: regla ${numregla} actualizada.` });
        } else message.channel.send({ content: ':warning: tienes que especificar el número y la descripción de la regla.' });
    },
};