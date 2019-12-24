const Discord = require('discord.js'); //Integrar discord.js
var global = require('../config.json'); //Variables globales

module.exports = {
	name: 'papa-decir',
	execute(message, args) {
        if(message.author.id === '423129757954211880') {
            if(args.length > 0) {
                var sentence;
                sentence = args[0];
                for(var i = 1; i < args.length; i++) sentence += ' ' + args[i];
                global.cansay = 2; 
                message.channel.send(sentence);
            } else message.channel.send(':warning: tienes que especificar lo que quieres que diga.');
        } else {
            message.channel.send(':closed_lock_with_key: Solo Papita con Puré puede usar este comando.');
            return;
        }
    },
};