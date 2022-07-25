const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../localdata/config.json'); //Variables globales
const { paginate, fetchArrows } = require('../../func');
const { CommandOptionsManager, CommandMetaFlagsManager } = require('../Commons/commands');

const options = new CommandOptionsManager()
	.addParam('perrito', 'TEXT', 					  																		   'para especificar un perrito a enviar (por nombres identificadores)', 						   { optional: true })
	.addParam('lista', 	 { name: 'texto', expression: 'uno de `perritos, todo, todos, lista, ayuda, everything, all, help`' }, 'para mostrar una lista de todos los perritos disponibles junto a sus nombres identificadores', { optional: true })
	.addFlag('bd', ['borrar', 'delete'], 'para borrar el mensaje original');

module.exports = {
	name: 'taton',
	aliases: [
		'perrito', 'pe', 'dog'
	],
    desc: 'Comando cachorro de Taton. Puedes ingresar una palabra identificadora para enviar un perrito en específico o ver una lista de perritos. Si no ingresas nada, se enviará un perrito aleatorio',
    flags: new CommandMetaFlagsManager().add(
		'MEME',
		'EMOTE',
	),
    options,
	callx: '[<perrito?>/<lista?>]',
	
	async execute(message, args) {
		let dflag = false;

		//Lectura de flags; las flags ingresadas se ignoran como argumentos
		args = args.map(arg => {
			if(arg.startsWith('--'))
				switch(arg.slice(2)) {
				case 'borrar': dflag = true; break;
				case 'delete': dflag = true; break;
				default: return arg;
				}
			else if(arg.startsWith('-'))
				for(c of arg.slice(1))
					switch(c) {
					case 'b': dflag = true; break;
					case 'd': dflag = true; break;
					default: return arg;
					}
			else return arg;
		}).filter(arg => arg);

		//Acción de comando
		if(dflag) message.delete();
		const perritos = [
			'perrito', 'otirrep', 'od', 'do', 'cerca', 'muycerca', 'lejos', 'muylejos', 'invertido', 'dormido', 'pistola', 'sad', 'gorrito', 'gorra', 'almirante', 'detective',
			'ban', 'helado', 'corona', 'Bern', 'enojado', 'policia', 'ladron', 'importado', 'peleador', 'doge', 'cheems', 'jugo', 'Papita', 'mano', 'Mima', 'chad', 'Marisa',
			'fumado', 'Megumin', 'Navi', 'Sansas', 'chocolatada', 'ZUN', 'cafe', 'mate', 'espiando', 'madera', 'Keiki', 'piola', 'jarra', 'Nazrin', 'Miyoi', 'despierto',
			'pensando', 'santaclos', 'tomando', 'llorando', 'facha', 'sniper', 'amsiedad', 'Mayumi', 'rodando', 'veloz'
		];
		const guilds = message.client.guilds.cache;
		const slot1Coll = guilds.get(global.serverid.slot1).emojis.cache;
		const slot2Coll = guilds.get(global.serverid.slot2).emojis.cache;
		const emotes = slot1Coll.concat(slot2Coll).filter(emote => perritos.some(perrito => perrito === emote.name));

		if(!args.length) {
			message.reply({ content: `${emotes.random()}` });
			if(args.includes('-d')) message.delete();
		} else {
			const perritocomun = emotes.find(perrito => perrito.name === 'perrito');

			const mostrarlista = ['perritos', 'todo', 'todos', 'lista', 'ayuda', 'everything', 'all', 'help'];
			if(mostrarlista.includes(args[0])) {
				const pages = paginate([...emotes.values()]);
				const embed = new Discord.MessageEmbed()
					.setColor('#e4d0c9')
					.setTitle(`Perritos ${perritocomun}`)

					.addField(`${'Nombre\`'.padEnd(24)}\`Emote`, pages[0])

					.setAuthor({ name: `${perritos.length} perritos en total` })
					.setFooter({ text: `Reacciona a las flechas debajo para cambiar de página` });
				let page = 0;

				const arrows = fetchArrows(message.client.emojis.cache);
				const filter = (rc, user) => !user.bot && arrows.some(arrow => rc.emoji.id === arrow.id);
				message.reply({ embeds: [embed] }).then(sent => {
					sent.react(arrows[0])
						.then(() => sent.react(arrows[1]));
					
					const collector = sent.createReactionCollector({ filter: filter, time: 8 * 60 * 1000 });
					collector.on('collect', (reaction, ruser) => {
						if(reaction.emoji.id === arrows[0].id) page = (page > 0)?(page - 1):(pages.length - 1);
						else page = (page < (pages.length - 1))?(page + 1):0;
						embed.fields[0].value = pages[page];
						embed.setFooter({ text: `Página ${page + 1}/${Math.ceil(pages.length)}` });
						sent.edit({ embeds: [embed] });
						reaction.users.remove(ruser);
					});
				});
			} else {
				args[0] = args[0].normalize('NFD').replace(/([aeiou])\u0301/gi, '$1');
				let foundperrito = false;
				emotes.map(emote => {
					if(!foundperrito) {
						if(emote.name.toLowerCase().startsWith(args[0].toLowerCase()) && perritos.some(perrito => perrito === emote.name)) {
							message.reply({ content: `${emote}` });
							foundperrito = true;
						}
					}
				});

				if(!foundperrito) message.reply({ content: `${perritocomun}` });
				if(args.includes('-d')) message.delete();
			}
		}
    },
};