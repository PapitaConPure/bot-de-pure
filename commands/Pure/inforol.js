const Discord = require('discord.js'); //Integrar discord.js
const { fetchFlag, fetchArrows } = require('../../func');
const { p_pure } = require('../../localdata/config.json'); //Variables globales

module.exports = {
	name: 'inforol',
	aliases: [
		'cuántos', 'cuantos', 'cuentarol',
        'rolecount', 'roleinfo',
        'irol', 'ir', 'ri', 'rolei'
    ],
    desc: 'Realiza una búsqueda en el servidor para encontrar a todos los usuarios que cumplen con los búsqueda de roles solicitada. Devuelve el total de usuarios encontrados junto con una lista paginada de los mismos\n' +
		  'La búsqueda será de tipo flojo a menos que se especifique que sea `--estricta`. En dicho caso, solo se listarán los usuarios que tengan _todos_ los roles mencionados en lugar de _uno o más_.',
    flags: [
        'mod'
    ],
    options: [
		'`-x` o `--estricto` para especificar si la búsqueda es estricta',
		'`<búsqueda...>` _(rol/roles...)_ para especificar los roles que quieres buscar'
    ],
	callx: '<caso> <búsqueda...>',
	
	execute(message, args) {
		if(args.length < 1) {
			message.channel.send({ content: `:x: ¡Debes ingresar al menos un parámetro!\nUsa \`${p_pure}ayuda inforol\` para más información` });
			return;
		}

		message.channel.sendTyping();
		const servidor = message.channel.guild; //Variable que almacena un objeto del servidor a analizar

		//Adquirir ID de los roles
        const strict = fetchFlag(args, { short: [ 'x', 'e' ], long: [ 'estricto', 'estricta' ], callback: true, fallback: false });
		for(let roleget = 0; roleget < args.length; roleget++) {
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
				if(strict)
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
				
				const arrows = fetchArrows(message.client.emojis.cache);
				const filter = (rc, user) => !user.bot && arrows.some(arrow => rc.emoji.id === arrow.id);
				message.channel.send({ embeds: [Embed[0]], allowedMentions: { parse: [] } }).then(sent => {
					sent.react(arrows[0])
						.then(() => sent.react(arrows[1]))
						.then(() => {
							const collector = sent.createReactionCollector({ filter: filter, time: 8 * 60 * 1000 });
							collector.on('collect', (reaction, ruser) => {
								const maxpage = Math.ceil(totalcnt / 10);
								if(reaction.emoji.id === arrows[0].id) SelectedEmbed = (SelectedEmbed > 0)?(SelectedEmbed - 1):maxpage;
								else SelectedEmbed = (SelectedEmbed < maxpage)?(SelectedEmbed + 1):0;
								sent.edit({ embeds: [Embed[SelectedEmbed]] });
								reaction.users.remove(ruser);
							});
						})
				});
			}
		} else message.channel.send({ content: ':warning: La ID ingresada no es válida o no es una ID en absoluto...' });
    },
};