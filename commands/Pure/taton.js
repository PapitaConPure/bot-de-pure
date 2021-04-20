const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const { paginate, fetchArrows } = require('../../func');

module.exports = {
	name: 'taton',
	aliases: [
		'perrito', 'pe', 'dog'
	],
    desc: 'Comando cachorro de Taton. Puedes ingresar una palabra identificadora para enviar un perrito en específico o ver una lista de perritos. Si no ingresas nada, se enviará un perrito aleatorio',
    flags: [
        'meme'
    ],
    options: [
		'`<perrito?>` _(texto)_ para especificar un perrito a enviar (por nombres identificadores)',
		'`<lista?>` _(texto: `perritos, todo, todos, lista, ayuda, everything, all, help`)_ para, en cambio, mostrar una lista de todos los perritos disponibles junto a sus nombres identificadores'
    ],
	callx: '[<perrito?>/<lista?>]',
	
	execute(message, args) {
		const perritos = [
			'perrito',
			'otirrep',
			'od',
			'do',
			'cerca',
			'muycerca',
			'lejos',
			'muylejos',
			'invertido',
			'dormido',
			'pistola',
			'sad',
			'gorrito',
			'gorra',
			'almirante',
			'detective',
			'ban',
			'helado',
			'corona',
			'Bern',
			'enojado',
			'policia',
			'ladron',
			'importado',
			'peleador',
			'doge',
			'cheems',
			'jugo',
			'Papita',
			'mano',
			'Mima',
			'chad',
			'Marisa',
			'fumado',
			'Megumin',
			'Navi',
			'Sansas',
			'chocolatada',
			'ZUN',
			'cafe',
			'mate',
			'espiando',
			'madera',
			'Keiki',
			'piola',
			'jarra',
			'Nazrin',
			'Miyoi',
			'despierto',
			'pensando'
		];
		const guilds = message.client.guilds.cache;
		const slot1Coll = guilds.get(global.serverid.slot1).emojis.cache;
		const slot2Coll = guilds.get(global.serverid.slot2).emojis.cache;
		const emotes = slot1Coll.concat(slot2Coll).filter(emote => perritos.some(perrito => perrito === emote.name)).array();

		if(!args.length) {
			const randp = Math.floor(Math.random() * perritos.length / 2) * 2;
			message.channel.send(`${emotes[randp]}`);
		} else {
			const mostrarlista = ['perritos', 'todo', 'todos', 'lista', 'ayuda', 'everything', 'all', 'help'];
			if(mostrarlista.includes(args[0].toLowerCase())) {
				const pages = paginate(emotes);
				const embed = new Discord.MessageEmbed()
					.setColor('#e4d0c9')
					.setTitle(`Perritos ${emotes[0]}`)

					.addField(`${'Nombre\`'.padEnd(24)}\`Emote`, pages[0], true)

					.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL())
					.setFooter(`Reacciona a las flechas debajo para cambiar de página`);
				let page = 0;

				const arrows = fetchArrows(message.client.emojis.cache);
				const filter = (rc, user) => !user.bot && arrows.some(arrow => rc.emoji.id === arrow.id);
				message.channel.send(embed).then(sent => {
					sent.react(arrows[0])
						.then(() => sent.react(arrows[1]));
					
					const collector = sent.createReactionCollector(filter, { time: 8 * 60 * 1000 });
					collector.on('collect', reaction => {
						if(reaction.emoji.id === arrows[0].id) page = (page > 0)?(page - 1):(pages.length - 1);
						else page = (page < (pages.length - 1))?(page + 1):0;
						embed.fields[0].value = pages[page];
						embed.setFooter(`Página ${page + 1}/${Math.ceil(pages.length)}`);
						sent.edit(embed);
					});
				});
			} else {
				let foundperrito = false;
				emotes.map(emote => {
					if(!foundperrito) {
						if(emote.name.toLowerCase().startsWith(args[0]) && perritos.some(perrito => perrito === emote.name)) {
							message.channel.send(`${emote}`);
							foundperrito = true;
						}
					}
				});

				if(!foundperrito) message.channel.send(`${emotes[0]}`);
			}
		}
    },
};