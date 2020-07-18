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
        message.channel.send(
			'```\n' +
			'[REPORTE DE ESTADO DEL BOT]\n' +
			'Estoy investigando un error con los comandos con Embed.\n' +
			'~Papita con Puré\n' +
			'```'
		);
		return;

        if(!args.length) {
            const embed = new Discord.RichEmbed()
				.setTitle(`Avatar de ${message.author.username}`)
                .setColor('#faa61a')
                .setImage(message.author.avatarURL)
				.setFooter(`Comando invocado por ${message.author.username}`);
            
            message.channel.send(embed);
        } else {
            for(avalist = 0; avalist < Math.min(args.length, 8); avalist++) {
                if(args[avalist].startsWith('<@') && args[avalist].endsWith('>')) {
                    args[avalist] = args[avalist].slice(2, -1);
                    if(args[avalist].startsWith('!')) args[avalist] = args[avalist].slice(1);
                }
                if(isNaN(args[avalist])) {
                    const temp = args[avalist].toLowerCase();
                    args[avalist] = message.client.users.filter(user => 
                        user.username.toLowerCase().indexOf(temp) !== -1
                    ).first();

                    if((typeof args[avalist]) === 'undefined')
                        args[avalist] = message.channel.guild.members.filter(member => {
                            let nickmatch = false;
                            if(member.nickname !== null) {
                                if(member.nickname.toLowerCase().indexOf(temp) !== -1)
                                    nickmatch = true;
                            }
                            
                            return nickmatch;
                        }).first();

                    if((typeof args[avalist]) === 'undefined') {
                        message.channel.send(':warning: ¡Usuario no encontrado!');
                        args[avalist] = -1;
                    } else
                        args[avalist] = args[avalist].id;
                }

                if(args[avalist] !== -1) {
                    const fetcheduser = message.client.users.get(args[avalist]);

                    if((typeof fetcheduser) === 'undefined')
                        message.channel.send(':warning: La ID ingresada no es válida o no es una ID en absoluto...');
                    else {
                        const embed = new Discord.RichEmbed()
                            .setTitle(`Avatar de ${fetcheduser.username}`)
                            .setColor('#faa61a')
                            .setImage(fetcheduser.avatarURL)
                            .setFooter(`Comando invocado por ${message.author.username}`);

                        message.channel.send(embed);
                    }
                }
            }
        }
    },
};