const Discord = require('discord.js'); //Integrar discord.js
const { p_pure } = require('../../config.json');
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
        if(!args.length) {
            const embed = new Discord.MessageEmbed()
                .setColor('#faa61a')
                .setFooter(`Comando invocado por ${message.author.username}`)
                .setTitle(`Avatar de ${message.author.username}`)
                .setImage(message.author.avatarURL({ format: 'png', dynamic: true, size: 1024 }));
            
            message.channel.send(embed);
        } else {
            args = args.join(' ').split(',');
            if(args.length < 5)
                args.map(arg => {
                    arg = arg.trim();
                    if(arg.length === 0) return;
                    const user = func.resolverIDUsuario(arg, message.channel.guild, message.client);

                    if(user !== undefined) {
                        const fetcheduser = message.client.users.cache.get(user);

                        if(fetcheduser === undefined)
                            message.channel.send(':warning: La ID ingresada es inválida o no es una ID en absoluto...');
                        else {
                            const embed = new Discord.MessageEmbed()
                                .setColor('#faa61a')
                                .setFooter(`Usa "${p_pure}ayuda avatar" para información de uso`)
                                .setTitle(`Avatar de ${fetcheduser.username}`)
                                .setImage(fetcheduser.avatarURL({ dynamic: true, size: 1024 }));

                            message.channel.send(embed);
                        }
                    } else 
                        message.channel.send(`:warning: ¡Usuario **${arg}** no encontrado!`);
                });
            else
                message.channel.send(':warning: Solo puedes ingresar hasta **5** usuarios por comando');
        }
    },
};