const Discord = require('discord.js'); //Integrar discord.js
const { fetchArrows, regroupText } = require('../../func');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const options = new CommandOptionsManager()
	.addParam('búsqueda', 'ROLE', 'para especificar los roles que quieres buscar', { poly: 'MULTIPLE', polymax: 8 })
	.addFlag('xe', ['estricta', 'estricto', 'exclusivo'], 'para especificar si la búsqueda es estricta');
const flags = new CommandMetaFlagsManager().add('MOD');
const command = new CommandManager('inforol', flags)
	.setAliases(
		'cuántos', 'cuantos', 'cuentarol',
        'rolecount', 'roleinfo',
        'irol', 'ir', 'ri', 'rolei',
	)
	.setLongDescription(
		'Realiza una búsqueda en el servidor para encontrar a todos los usuarios que cumplen con los búsqueda de roles solicitada.',
		'Devuelve el total de usuarios encontrados junto con una lista paginada de los mismos',
		'Si la búsqueda es `--estricta`, solo se listarán los usuarios que tengan _todos_ los roles mencionados, en lugar de _uno o más_.',
	)
	.setOptions(options)
	.setExecution(async (request, args, isSlash) => {
		if(!isSlash) {
			if(args.length < 1)
				return request.reply({ content: `:x: ¡Debes ingresar al menos un parámetro!\nUsa \`${p_pure(request.guildId).raw}ayuda inforol\` para más información` });
			
			args = regroupText(args);
		}

		//Parámetros
		const servidor = request.channel.guild;
        const strict = options.fetchFlag(args, 'estricta');

		//Adquirir ID de roles
		request.channel.sendTyping();
		args = args.map(arg => {
			if(arg.startsWith('<@&') && arg.endsWith('>'))
				arg = arg.slice(3, -1);
			if(isNaN(arg)) {
				arg = arg.toLowerCase();
				arg = servidor.roles.cache.find(r => r.name.toLowerCase().indexOf(arg) >= 0);
				if(typeof arg === 'undefined')
					arg = null;
				else
					arg = arg.id;
			}
			return arg;
		}).filter(arg => arg);

		if(!args.length)
			return request.reply({ content: '⚠ No se encontró ningún rol...' });

		//Contadores de usuarios
		const rolemembers = servidor.members.cache.filter(member => //Usuarios con rol
			strict
				? args.every(arg => member.roles.cache.has(arg))
				: args.some(arg => member.roles.cache.has(arg))
		);
		const totalcnt = rolemembers.size;
		const peoplecnt = rolemembers.filter(member => !member.user.bot).size;
		const botcnt = totalcnt - peoplecnt;

		//Crear y usar embed
		let SelectedEmbed = 0;
		let Embed = [];
		let peoplelist = [...rolemembers.values()];
		const anaroles = args.map(ar => `<@&${ar}>`).join(', ');

		if(anaroles.length === 0)
			return request.reply({ content: '⚠ Entrada inválida' });

		Embed[0] = new Discord.MessageEmbed()
			.setColor('#ff00ff')
			.setTitle(`Análisis del roles (Total)`)
			.addFields(
				{ name: 'Roles en análisis', value: anaroles },
				{ name: 'Caso', value: `**${strict ? 'Estricto' : 'Flojo'}**`, inline: true },
				{ name: 'Cuenta total', value: `:wrestlers: x ${peoplecnt}\n:robot: x ${botcnt}`, inline: true },
			)
			.setThumbnail(servidor.iconURL)
			.setAuthor({ name: `Comando invocado por ${request.author.username}`, iconURL: request.author.avatarURL() })
			.setFooter({ text: `Página principal` });

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

				.setAuthor({ name: `Comando invocado por ${request.author.username}`, iconURL: request.author.avatarURL() })
				.setFooter({ text: `Página de lista ${i + 1}/${Math.ceil(totalcnt / 10)}` });
		}
		
		const arrows = fetchArrows(request.client.emojis.cache);
		const filter = (rc, user) => !user.bot && arrows.some(arrow => rc.emoji.id === arrow.id);
		return request.reply({ embeds: [Embed[0]], allowedMentions: { parse: [] } }).then(sent => {
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
	});

module.exports = command;