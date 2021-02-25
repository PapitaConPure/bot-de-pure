const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'papa-decir',
    desc: 'Me hace decir lo que quieras que diga (permite que me diga comandos a mí misma)',
    flags: [
        'common'
    ],
    options: [
        '`<mensaje>` _(texto)_ para borrar tu mensaje',
        '`-d` o `--delete` para borrar tu mensaje'
    ],
    callx: '<mensaje>',
	
	execute(message, args) {
        if(message.author.id === '423129757954211880') {
            if(args.length > 0) {
                let sentence;
                sentence = args[0];
                if(args[0] === 'del') {
                    sentence = '';
                    message.delete();
                }
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