const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'avatar',
    aliases: [
        'perfil', 'fotoperfil',
        'profile', 'profilepicture',
        'pfp'
    ],
    desc: 'Muestra tu propio avatar o el del usuario mencionado',
    flags: [
        'common'
    ],
    options: [
        '`<usuario?>` _(mención/texto/id)_ para especificar un usuario'
    ],
    callx: '<usuario?>',

	execute(message, args) {
        const embed = new Discord.MessageEmbed()
            .setColor('#faa61a')
            .setFooter(`Comando invocado por ${message.author.username}`);
        
        if(!args.length) {
            embed.setTitle(`Avatar de ${message.author.username}`)
                .setImage(message.author.avatarURL({ format: 'png', dynamic: true, size: 1024 }));
            
            message.channel.send(embed);
        } else {
            for(avalist = 0; avalist < Math.min(args.length, 8); avalist++) {
                args[avalist] = func.resolverIDUsuario(args[avalist], message.channel.guild, message.client);

                if(args[avalist] !== undefined) {
                    const fetcheduser = message.client.users.cache.get(args[avalist]);

                    if(fetcheduser === undefined)
                        message.channel.send(':warning: La ID ingresada es inválida o no es una ID en absoluto...');
                    else {
                        const embed = new Discord.MessageEmbed()
                            .setTitle(`Avatar de ${fetcheduser.username}`)
                            .setImage(fetcheduser.avatarURL({ dynamic: true, size: 1024 }));

                        message.channel.send(embed);
                    }
                } else 
                    message.channel.send(':warning: ¡Usuario no encontrado!');
            }
        }
    },
};