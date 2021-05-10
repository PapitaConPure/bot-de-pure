const { serverid } = require('../../localdata/config.json'); //Variables globales

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
        '`<mensaje>` _(texto)_ para especificar qué decir',
        '`-b` o `--borrar` para borrar el mensaje original'
    ],
    callx: '<mensaje>',
	
	execute(message, args) {
        if(args.length > 0) {
            let dflag = false;

            //Lectura de flags; las flags ingresadas se ignoran como argumentos
            args = args.map(arg => {
                let ignore = true;
                if(arg.startsWith('--'))
                    switch(arg.slice(2)) {
                    case 'borrar': dflag = true; break;
                    case 'delete': dflag = true; break;
                    default: ignore = false; break;
                    }
                else if(arg.startsWith('-'))
                    for(c of arg.slice(1))
                        switch(c) {
                        case 'b': dflag = true; break;
                        case 'd': dflag = true; break;
                        default: ignore = false; break;
                        }
                else ignore = false;

                if(ignore) return undefined;
                else return arg;
            }).filter(arg => arg !== undefined);

            //Acción de comando
            if(dflag) message.delete();
            const sentence = args.join(' ');

            const minus = sentence.toLowerCase();
            if(message.channel.guild.id === serverid.hourai && minus.indexOf('hourai') !== -1 && minus.indexOf('hourai doll') !== minus.indexOf('hourai') && minus.indexOf('houraidoll') === -1)
                message.channel.send('No me hagai decir weas de hourai, ¿yapo? Gracias <:haniwaSmile:659872119995498507>');
            else if(sentence.length === 0)
                message.channel.send(':warning: tienes que especificar lo que quieres que diga.');
            else message.channel.send(sentence);
        } else message.channel.send(':warning: tienes que especificar lo que quieres que diga.');
    },
};