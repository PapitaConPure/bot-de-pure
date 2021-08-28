const Discord = require('discord.js'); //Integrar discord.js
const { p_pure } = require('../../localdata/config.json'); //Variables globales

module.exports = {
	name: 'inforol',
	aliases: [
		'cuántos', 'cuantos', 'cuentarol',
        'rolecount', 'roleinfo',
        'irol', 'ir', 'ri', 'rolei'
    ],
    desc: 'Realiza una búsqueda en el servidor para encontrar a todos los usuarios que cumplen con los búsqueda de roles solicitada. Devuelve el total de usuarios encontrados junto con una lista paginada de los mismos\n' +
		'**[+]Inclusivo:** se consideran usuarios con __algunos de los roles__ buscados (dinámico)\n' +
		'**[-]Exclusivo:** se consideran usuarios con __todos los roles__ buscados (específico)',
    flags: [
        'mod',
		//'outdated'
    ],
    options: [
		'`caso` _(signos +/-)_ para especificar si la búsqueda es de caso [+]Inclusivo o [-]Exclusivo',
		'`búsqueda...` _(rol/roles...)_ para especificar los roles que quieres buscar'
    ],
	callx: '<caso> <búsqueda...>',
	
	execute(message, args) {
		if(args.length < 2) {
			message.channel.send({ content: `:x: ¡Debes ingresar al menos dos parámetros!\nUsa \`${p_pure}ayuda inforol\` para más información` });
			return;
		}

		if(args[0] !== '-' && args[0] !== '+') {
			message.channel.send({ content: `:warning: El primer parámetro solo puede ser \`+\` o \`-\`\nUsa \`${p_pure}ayuda inforol\` para más información` });
			return;
		}

		message.channel.sendTyping();
		const servidor = message.channel.guild; //Variable que almacena un objeto del servidor a analizar

		//Adquirir ID de los roles
		for(let roleget = 1; roleget < args.length; roleget++) {
			if(args[roleget].startsWith('<@&') && args[roleget].endsWith('>')) {
				args[roleget] = args[roleget].slice(3, -1);
			}
			if(isNaN(args[roleget])) {
				const temp = args[roleget].toLowerCase();
				args[roleget] = servidor.roles.cache.filter(role => 
					role.name.toLowerCase().indexOf(temp) !== -1
				).first();

				if((typeof args[roleget]) === 'undefined') {
					message.channel.send({ content: ':warning: ¡Rol no encontrado!' });
					args[roleget] = -1;
				} else
					args[roleget] = args[roleget].id;
			}
		}

		if(!args.every(argfetched => argfetched === '-1')) {
			//Contadores de usuarios
			const rolemembers = servidor.members.cache.filter(member => { //Usuarios con rol
				if(args[0] === '+')
					return args.some(argrole => {
						if(argrole !== args[0] && argrole !== '-1')
							return member.roles.cache.has(argrole);
						else
							return false;
					});
				else
					return args.every(argrole => {
						if(argrole !== args[0] && argrole !== '-1')
							return member.roles.cache.has(argrole);
						else
							return true;
					});
			});
			const totalcnt = rolemembers.size; //Total
			const peoplecnt = rolemembers.filter(member => !member.user.bot).size; //Roles
			const botcnt = totalcnt - peoplecnt; //Bots

			//Crear y usar embed
			let SelectedEmbed = 0;
			let Embed = [];
			let peoplelist = [...rolemembers.values()]; //Convertir la colección de miembros con el rol a un arreglo
			const anaroles = args.filter(ar => ar !== '-' && ar !== '+' && ar > -1 && !isNaN(ar)).map(ar => `<@&${ar}>`).join(', ');
			
			if(anaroles.length !== 0) {
				Embed[0] = new Discord.MessageEmbed()
					.setColor('#ff00ff')
					.setTitle(`Análisis del roles (Total)`)

					.addField('Roles en análisis', anaroles)
					.addField('Caso', `**${(args[0] === '+')?'Inclusivo':'Exclusivo'}**`, true)
					.addField('Cuenta total', `:wrestlers: x ${peoplecnt}\n:robot: x ${botcnt}`, true)

					.setThumbnail(servidor.iconURL)
					.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL())
					.setFooter(`Página principal`);SelectedEmbed

				for(let i = 0; i < (totalcnt / 10); i++) {
					let plrange = '';
					for(let listrange = i * 10; listrange < Math.min(i * 10 + 10, totalcnt); listrange++) {
						plrange += `${peoplelist[listrange]}`;
						if(peoplelist[listrange].user.bot) plrange += ' **[BOT]**';
						plrange += '\n';
					}

					Embed[i + 1] = new Discord.MessageEmbed()
						.setColor('#ff00ff')
						.setTitle('Análisis del roles (Detalle)')

						.addField('Lista de usuarios', plrange)

						.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL())
						.setFooter(`Página de lista ${i + 1}/${Math.ceil(totalcnt / 10)}`);
				}
				
				const arrows = [message.client.emojis.cache.get('681963688361590897'), message.client.emojis.cache.get('681963688411922460')];
				const filter = (rc, user) => !user.bot && arrows.some(arrow => rc.emoji.id === arrow.id);
				message.channel.send({ embeds: [Embed[0]] }).then(sent => {
					sent.react(arrows[0])
						.then(() => sent.react(arrows[1]))
						.then(() => {
							const collector = sent.createReactionCollector({ filter: filter, time: 8 * 60 * 1000 });
							collector.on('collect', reaction => {
								const maxpage = Math.ceil(totalcnt / 10);
								if(reaction.emoji.id === arrows[0].id) SelectedEmbed = (SelectedEmbed > 0)?(SelectedEmbed - 1):maxpage;
								else SelectedEmbed = (SelectedEmbed < maxpage)?(SelectedEmbed + 1):0;
								sent.edit(Embed[SelectedEmbed]);
							});
						})
				});
			}
		} else message.channel.send({ content: ':warning: La ID ingresada no es válida o no es una ID en absoluto...' });
    },
};