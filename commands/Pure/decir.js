const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'decir',
    aliases: [
        'exclamar', 'escribir',
        'say', 'echo'
    ],
	execute(message, args) {
        if(args.length > 0) {
            let sentence;
            sentence = args[0];
            if(args[0] === 'del') {
                sentence = '';
                message.delete();
            }
            for(var i = 1; i < args.length; i++) sentence += ' ' + args[i];

            const minus = sentence.toLowerCase();

            if(message.channel.guild.id === '654471968200065034' && minus.indexOf('hourai') !== -1 && minus.indexOf('hourai doll') !== minus.indexOf('hourai') && minus.indexOf('houraidoll') === -1)
                message.channel.send('No me hagai decir weas de hourai, ¿yapo? Gracias <:haniwaSmile:659872119995498507>');
            else message.channel.send(sentence);
        } else message.channel.send(':warning: tienes que especificar lo que quieres que diga.');
    },
};