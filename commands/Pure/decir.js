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
            let sentence = '';
            for(var i = 0; i < args.length; i++) {
                switch(args[i]) {
                    case '-d':
                        message.delete();
                        break;
                    
                    default:
                        sentence += ' ' + args[i];
                        break;
                }
            }

            const minus = sentence.toLowerCase();

            if(message.channel.guild.id === '654471968200065034' && minus.indexOf('hourai') !== -1 && minus.indexOf('hourai doll') !== minus.indexOf('hourai') && minus.indexOf('houraidoll') === -1)
                message.channel.send('No me hagai decir weas de hourai, ¿yapo? Gracias <:haniwaSmile:659872119995498507>');
            else message.channel.send(sentence);
        } else message.channel.send(':warning: tienes que especificar lo que quieres que diga.');
    },
};