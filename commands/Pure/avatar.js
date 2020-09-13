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
        /*message.channel.send(
			'```\n' +
			'[REPORTE DE ESTADO DEL BOT]\n' +
			'Estoy investigando un error con los comandos con Embed.\n' +
			'~Papita con Puré\n' +
			'```'
		);
		return;*/

        if(!args.length) {
            const embed = new Discord.MessageEmbed()
				.setTitle(`Avatar de ${message.author.username}`)
                .setColor('#faa61a')
                .setImage(message.author.avatarURL({ format: 'png', dynamic: true, size: 1024 }))
				.setFooter(`Comando invocado por ${message.author.username}`);
            
            message.channel.send(embed);
        } else {
            for(avalist = 0; avalist < Math.min(args.length, 8); avalist++) {
                if(args[avalist].startsWith('<@') && args[avalist].endsWith('>')) {
                    args[avalist] = args[avalist].slice(2, -1);
                    if(args[avalist].startsWith('!')) args[avalist] = args[avalist].slice(1);
                }
                if(isNaN(args[avalist])) {
                    //Comprobador de nombre, en caso de que no sea una ID
                    const temp = args[avalist].toLowerCase();

                    //Buscar por apodo o nombre de usuario dentro de guild actual
                    args[avalist] = message.channel.guild.members.cache.filter(member => {
                        let nickmatch = false;

                        if(member.nickname !== null && member.nickname !== undefined)
                            nickmatch = (member.nickname.toLowerCase().indexOf(temp) !== -1);
                        if(!nickmatch)
                            nickmatch = (member.user.username.toLowerCase().indexOf(temp) !== -1);
                        
                        return nickmatch;
                    }).first();
                    
                    //Buscar por nombre de usuario en resto de guilds
                    if((typeof args[avalist]) === 'undefined')
                        message.client.guilds.cache.filter(guild => guild.id !== message.channel.guild.id).map(guild => {
                            args[avalist] = guild.members.cache.filter(member => member.user.username.toLowerCase().indexOf(temp) !== -1).first();
                        });

                    if((typeof args[avalist]) === 'undefined') {
                        message.channel.send(':warning: ¡Usuario no encontrado!');
                        args[avalist] = -1;
                    } else
                        args[avalist] = args[avalist].id;
                }

                if(args[avalist] !== -1) {
                    const fetcheduser = message.client.users.cache.get(args[avalist]);

                    if((typeof fetcheduser) === 'undefined')
                        message.channel.send(':warning: La ID ingresada no es válida o no es una ID en absoluto...');
                    else {
                        const embed = new Discord.MessageEmbed()
                            .setTitle(`Avatar de ${fetcheduser.username}`)
                            .setColor('#faa61a')
                            .setImage(fetcheduser.avatarURL({ format: 'png', dynamic: true, size: 1024 }))
                            .setFooter(`Comando invocado por ${message.author.username}`);

                        message.channel.send(embed);
                    }
                }
            }
        }
    },
};