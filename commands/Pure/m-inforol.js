const Discord = require('discord.js'); //Integrar discord.js
let global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'm-inforol',
	aliases: [
		'm-cuántos', 'm-cuantos', 'm-cuentarol',
        'm-rolecount', 'm-roleinfo'
    ],
	execute(message, args) {
		if(message.member.hasPermission('MANAGE_ROLES', false, true, true)) {
			if(args.length < 2) {
				message.channel.send(':warning: ¡Debes ingresar al menos dos parámetros!\nUso: `p!m-inforol <Inclusivo[+] / Exclusivo[-]*> <Rol1*> <Rol2...8>`');
			}

			message.channel.startTyping();
			const servidor = message.channel.guild; //Variable que almacena un objeto del servidor a analizar

			//Adquirir ID de los roles
			for(let roleget = 1; roleget < args.length; roleget++) {
				if(args[roleget].startsWith('<@&') && args[roleget].endsWith('>')) {
					args[roleget] = args[roleget].slice(3, -1);
				}
				if(isNaN(args[roleget])) {
					args[roleget] = servidor.roles.filter(role => 
						role.name.toLowerCase().indexOf(temp) !== -1
					).first();

					if((typeof args[roleget]) === 'undefined') {
						message.channel.send(':warning: ¡Rol no encontrado!');
						args[roleget] = -1;
					} else
						args[roleget] = args[roleget].id;
				}
			}

			if(args[1] !== -1) {
				//Contadores de usuarios
				const rolemembers = servidor.members.filter(member => 
					args.every(argrole => {
						if(argrole !== args[0])
							return member.roles.has(argrole);
						else
							return true;
					})
				); //Usuarios con rol
				const totalcnt = rolemembers.size; //Total
				const peoplecnt = rolemembers.filter(member => !member.user.bot).size; //Roles
				const botcnt = totalcnt - peoplecnt; //Bots

				//Crear y usar embed
				let SelectedEmbed = 0;
				let Embed = [];
				let peoplelist = rolemembers.array(); //Convertir la colección de miembros con el rol a un arreglo

				Embed[0] = new Discord.RichEmbed()
					.setColor('#ff00ff')
					.setTitle(`Análisis del roles (Total)`)

					.addField('Cuenta total', `:wrestlers: x ${peoplecnt}\n:robot: x ${botcnt}`)

					.setThumbnail(servidor.iconURL)
					.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL)
					.setFooter(`Estas estadísticas toman información concreta.`);

				for(let i = 0; i < (totalcnt / 10); i++) {
					let plrange = '';
					for(let listrange = i * 10; listrange < Math.min(i * 10 + 10, totalcnt); listrange++) {
						plrange += `${peoplelist[listrange]}`;
						if(peoplelist[listrange].user.bot) plrange += ' **[BOT]**';
						plrange += '\n';
					}

					Embed[i + 1] = new Discord.RichEmbed()
						.setColor('#ff00ff')
						.setTitle('Análisis del roles (Detalle)')

						.addField('Lista de usuarios', plrange)

						.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL)
						.setFooter(`Estas estadísticas toman información desde el último reinicio del bot hasta la actualidad.`);
				}
				
				const arrows = [message.client.emojis.get('681963688361590897'), message.client.emojis.get('681963688411922460')];
				const filter = (rc, user) => !user.bot && arrows.some(arrow => rc.emoji.id === arrow.id);
				message.channel.send(Embed[0]).then(sent => {
					sent.react(arrows[0])
						.then(() => sent.react(arrows[1]))
						.then(() => {
							const collector = sent.createReactionCollector(filter, { time: 8 * 60 * 1000 });
							collector.on('collect', reaction => {
								const maxpage = Math.ceil(totalcnt / 10);
								if(reaction.emoji.id === arrows[0].id) SelectedEmbed = (SelectedEmbed > 0)?(SelectedEmbed - 1):maxpage;
								else SelectedEmbed = (SelectedEmbed < maxpage)?(SelectedEmbed + 1):0;
								sent.edit(Embed[SelectedEmbed]);
							});
						}).then(() => message.channel.stopTyping(true));
				});
			} else message.channel.send(':warning: La ID ingresada no es válida o no es una ID en absoluto...');
		} else message.channel.send(':warning: necesitas tener el permiso ***ADMINISTRAR ROLES** (MANAGE ROLES)* para usar este comando.');
    },
};