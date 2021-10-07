const Discord = require('discord.js'); //Integrar discord.js
const { fetchFlag, fetchArrows } = require('../../func');
const { p_pure } = require('../../localdata/prefixget');
const { CommandOptionsManager } = require('../Commons/cmdOpts');

const options = new CommandOptionsManager()
	.addParam('búsqueda', 'ROLE', 'para especificar los roles que quieres buscar', { poly: 'MULTIPLE' })
	.addFlag('xe', ['estricta', 'estricto'], 'para especificar si la búsqueda es estricta');

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
    options,
	callx: '<búsqueda...>',
	
	async execute(message, args) {
		if(args.length < 1) {
			message.channel.send({ content: `:x: ¡Debes ingresar al menos un parámetro!\nUsa \`${p_pure(message.guildId).raw}ayuda inforol\` para más información` });
			return;
		}

		//Parámetros
		const servidor = message.channel.guild; //Servidor a analizar
        const strict = fetchFlag(args, { short: [ 'x', 'e' ], long: [ 'estricto', 'estricta' ], callback: true, fallback: false });

		//Adquirir ID de los roles
		message.channel.sendTyping();
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

		if(args.length) {
			//Contadores de usuarios
			const rolemembers = servidor.members.cache.filter(member => //Usuarios con rol
				(strict)
					? args.every(arg => member.roles.cache.has(arg))
					: args.some(arg => member.roles.cache.has(arg))
			);
			const totalcnt = rolemembers.size; //Total
			const peoplecnt = rolemembers.filter(member => !member.user.bot).size; //Roles
			const botcnt = totalcnt - peoplecnt; //Bots

			//Crear y usar embed
			let SelectedEmbed = 0;
			let Embed = [];
			let peoplelist = [...rolemembers.values()]; //Convertir la colección de miembros con el rol a un arreglo
			const anaroles = args.map(ar => `<@&${ar}>`).join(', ');

			if(anaroles.length !== 0) {
				Embed[0] = new Discord.MessageEmbed()
					.setColor('#ff00ff')
					.setTitle(`Análisis del roles (Total)`)

					.addField('Roles en análisis', anaroles)
					.addField('Caso', `**${strict?'Exclusivo':'Inclusivo'}**`, true)
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
		} else message.channel.send({ content: ':warning: No se encontró ningún rol...' });
    },
};