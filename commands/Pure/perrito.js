const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../localdata/config.json'); //Variables globales
const { paginate, fetchArrows } = require('../../func');
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const options = new CommandOptionsManager()
	.addParam('perrito', 'TEXT', 'para especificar un perrito a enviar (por nombres identificadores)', { optional: true })
	.addFlag('ltaeh', [ 'lista', 'todo', 'todos', 'ayuda', 'everything', 'all', 'help' ], 'para mostrar una lista de todos los perritos')
	.addFlag('bd', ['borrar', 'delete'], 'para borrar el mensaje original');
const flags = new CommandMetaFlagsManager().add(
	'MEME',
	'EMOTE',
);
const command = new CommandManager('perrito', flags)
	.setAliases('taton', 'dog', 'pe')
	.setBriefDescription('Envía un emote de perrito o lista todos los disponibles')
	.setLongDescription('Comando cachorro de Taton. Puedes ingresar una palabra identificadora para enviar un perrito en específico o ver una lista de perritos. Si no ingresas nada, se enviará un perrito aleatorio')
	.setOptions(options)
	.setExecution(async (request, args, isSlash) => {
		const deleteMessage = isSlash ? false : options.fetchFlag(args, 'borrar');
		if(deleteMessage)
			request.delete();
		
		const perritoNames = [
			'perrito', 'otirrep', 'od', 'do', 'cerca', 'muycerca', 'lejos', 'muylejos', 'invertido', 'dormido', 'pistola', 'sad', 'gorrito', 'gorra', 'almirante', 'detective',
			'ban', 'helado', 'corona', 'Bern', 'enojado', 'policia', 'ladron', 'importado', 'peleador', 'doge', 'cheems', 'jugo', 'Papita', 'mano', 'Mima', 'chad', 'Marisa',
			'fumado', 'Megumin', 'Navi', 'Sansas', 'chocolatada', 'ZUN', 'cafe', 'mate', 'espiando', 'madera', 'Keiki', 'piola', 'jarra', 'Nazrin', 'Miyoi', 'despierto',
			'pensando', 'santaclos', 'tomando', 'llorando', 'facha', 'sniper', 'amsiedad', 'Mayumi', 'rodando', 'veloz',
		];
		const guilds = request.client.guilds.cache;
		const slot1Coll = guilds.get(global.serverid.slot1).emojis.cache;
		const slot2Coll = guilds.get(global.serverid.slot2).emojis.cache;
		const emotes = slot1Coll.concat(slot2Coll).filter(emote => perritoNames.includes(emote.name));
		const perritoComun = emotes.find(perrito => perrito.name === 'perrito');

		const mostrarLista = options.fetchFlag(args, 'lista');
		if(mostrarLista) {
			const pages = paginate([...emotes.values()]);
			const embed = new Discord.MessageEmbed()
				.setColor('#e4d0c9')
				.setTitle(`Perritos ${perritoComun}`)
				.addFields({ name: `${'Nombre\`'.padEnd(24)}\`Emote`, value: pages[0] })
				.setAuthor({ name: `${perritoNames.length} perritos en total` })
				.setFooter({ text: `Reacciona a las flechas debajo para cambiar de página` });

			const arrows = fetchArrows(request.client.emojis.cache);
			const filter = (rc, user) => !user.bot && arrows.some(arrow => rc.emoji.id === arrow.id);
			const sent = await request.reply({ embeds: [embed], fetchReply: true });
			await sent.react(arrows[0]);
			await sent.react(arrows[1]);
			
			const collector = sent.createReactionCollector({ filter: filter, time: 8 * 60 * 1000 });
			let page = 0;
			collector.on('collect', (reaction, ruser) => {
				if(reaction.emoji.id === arrows[0].id) page = (page > 0) ? (page - 1) : (pages.length - 1);
				else page = (page < (pages.length - 1)) ? (page + 1) : 0;
				embed.fields[0].value = pages[page];
				embed.setFooter({ text: `Página ${page + 1}/${Math.ceil(pages.length)}` });
				sent.edit({ embeds: [embed] });
				reaction.users.remove(ruser);
			});
			return;
		}

		let perrito = isSlash ? args.getString('perrito') : args[0];

		if(!perrito)
			return request.reply({ content: `${emotes.random()}` });

		perrito = perrito.normalize('NFD').replace(/([aeiou])\u0301/gi, '$1');
		perrito = emotes.find(emote => emote.name.toLowerCase().startsWith(perrito.toLowerCase()));

		if(!perrito)
			return request.reply({ content: `${perritoComun}` });

		return request.reply({ content: `${perrito}` });
	});

module.exports = command;