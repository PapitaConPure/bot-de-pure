const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'decir',
    aliases: [
        'exclamar', 'escribir',
        'say', 'echo'
    ],
    desc: 'Me hace decir lo que quieras que diga',
    flags: [
        'common'
    ],
    options: [
        '`-d` o `--delete` para borrar tu mensaje'
    ],
	
	execute(message, args) {
        if(args.length > 0) {
            let dflag = false;
            args.some((arg, i) => {
				if(arg.startsWith('--'))
					switch(arg.slice(2)) {
					case 'del': args[i] = undefined; dflag = true; break;
					case 'delete': args[i] = undefined; dflag = true; break;
					}
				else if(arg.startsWith('-'))
					for(c of arg.slice(1))
						switch(c) {
						case 'd': args[i] = undefined; dflag = true; break;
						}
			});
            if(dflag) message.delete();
            const sentence = args.filter(arg => arg !== undefined).join(' ');

            const minus = sentence.toLowerCase();
            if(message.channel.guild.id === global.serverid.hourai && minus.indexOf('hourai') !== -1 && minus.indexOf('hourai doll') !== minus.indexOf('hourai') && minus.indexOf('houraidoll') === -1)
                message.channel.send('No me hagai decir weas de hourai, ¿yapo? Gracias <:haniwaSmile:659872119995498507>');
            else if(sentence.length === 0)
                message.channel.send(':warning: tienes que especificar lo que quieres que diga.');
            else message.channel.send(sentence);
        } else message.channel.send(':warning: tienes que especificar lo que quieres que diga.');
    },
};