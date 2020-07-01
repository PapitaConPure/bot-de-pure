const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'avatar',
    aliases: [
        'perfil', 'fotoperfil',
        'profile', 'profilepicture',
        'pfp'
    ],
	execute(message, args) {
        if(!args.length) {
            const embed = new Discord.RichEmbed()
				.setTitle(`Avatar de ${message.author.username}`)
                .setColor('#faa61a')
                .setImage(message.author.avatarURL)
				.setFooter(`Comando invocado por ${message.author.username}`);
            
            message.channel.send(embed);
        } else {
            if(args[0].startsWith('<@') && args[0].endsWith('>')) {
                args[0] = args[0].slice(2, -1);
                if(args[0].startsWith('!')) args[0] = args[0].slice(1);
            }
            if(isNaN(args[0])) {
                const temp = args[0].toLowerCase();
                args[0] = message.client.users.filter(user => 
                    user.username.toLowerCase().indexOf(temp) !== -1
                ).first();

                if((typeof args[0]) === 'undefined')
                    args[0] = message.channel.guild.members.filter(member => {
                        let nickmatch = false;
                        if(typeof(member.nickname) !== null) {
                            if(member.nickname.toLowerCase().indexOf(temp) !== -1)
                                nickmatch = true;
                        }
                        
                        return nickmatch;
                    }).first();

                if((typeof args[0]) === 'undefined') {
                    message.channel.send(':warning: ¡Usuario no encontrado!');
                    return;
                }

                args[0] = args[0].id;
            }
            message.channel.send(`\`${args[0]}\``);

            const fetcheduser = message.client.users.get(args[0]);

            const embed = new Discord.RichEmbed()
				.setTitle(`Avatar de ${fetcheduser.username}`)
                .setColor('#faa61a')
                .setImage(fetcheduser.avatarURL)
				.setFooter(`Comando invocado por ${message.author.username}`);

            message.channel.send(embed);
        }
    },
};