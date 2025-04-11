const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../localdata/config.json'); //Variables globales
const { paginate, navigationRows, rand } = require('../../func');
const { CommandOptions, CommandTags, CommandManager, CommandOptionSolver } = require('../Commons/commands');
const { InteractionType } = require('discord.js');

/**@param {import('discord.js').Interaction} interaction*/
function getEmotesList(interaction) {
	const perritoNames = [
		'perrito', 'otirrep', 'od', 'do', 'cerca', 'muycerca', 'lejos', 'muylejos', 'invertido', 'dormido', 'pistola', 'sad', 'gorrito', 'gorra', 'almirante', 'detective',
		'ban', 'helado', 'corona', 'Bern', 'enojado', 'policia', 'ladron', 'importado', 'peleador', 'doge', 'cheems', 'jugo', 'Papita', 'mano', 'Mima', 'chad', 'Marisa',
		'fumado', 'Megumin', 'Navi', 'Sansas', 'chocolatada', 'ZUN', 'cafe', 'mate', 'espiando', 'madera', 'Keiki', 'piola', 'jarra', 'Nazrin', 'Miyoi', 'despierto',
		'pensando', 'santaclos', 'tomando', 'llorando', 'facha', 'sniper', 'amsiedad', 'Mayumi', 'rodando', 'veloz',
	];

	const guilds = interaction.client.guilds.cache;
	const { serverid } = global;
	const emotes = [
		...guilds.get(serverid.slot1).emojis.cache.values(),
		...guilds.get(serverid.slot2).emojis.cache.values(),
	].filter(emote => perritoNames.includes(emote.name)).sort();
	return emotes;
}

/**
 * @param {import('../Commons/typings').ComplexCommandRequest} request
 * @param {Number} page
 */
async function loadPageNumber(request, page) {
	page = parseInt(page);
	const emotes = getEmotesList(request);
	const emotePages = paginate(emotes);
	const lastPage = emotePages.length - 1;
	if(page > lastPage)
		return request.reply({ content: '⚠️ Esta página no existe', ephemeral: true });

	const perritoComun = emotes.find(perrito => perrito.name === 'perrito');
	
	const embed = new Discord.EmbedBuilder()
		.setColor(0xe4d0c9)
		.setTitle(`Perritos ${perritoComun}`)
		.setAuthor({ name: `${emotes.length} perritos en total` })
		.setFooter({ text: `${page + 1} / ${lastPage + 1}` })
		.addFields({ name: `${'Nombre\`'.padEnd(24)}\`Emote`, value: emotePages[page] });

	const content = {
		embeds: [embed],
		components: navigationRows('perrito', page, lastPage),
	};

	if(request.author || request.type === InteractionType.ApplicationCommand)
		return request.reply(content);
	
	return request.update(content);
}

const options = new CommandOptions()
	.addParam('perrito', 'TEXT', 'para especificar un perrito a enviar (por nombres identificadores)', { optional: true })
	.addFlag('ltaeh', [ 'lista', 'todo', 'todos', 'ayuda', 'everything', 'all', 'help' ], 'para mostrar una lista de todos los perritos')
	.addFlag('bd', ['borrar', 'delete'], 'para borrar el mensaje original');
const flags = new CommandTags().add(
	'MEME',
	'EMOTE',
);
const command = new CommandManager('perrito', flags)
	.setAliases('taton', 'dog', 'pe')
	.setBriefDescription('Envía un emote de perrito o lista todos los disponibles')
	.setLongDescription('Comando cachorro de Taton. Puedes ingresar una palabra identificadora para enviar un perrito en específico o ver una lista de perritos. Si no ingresas nada, se enviará un perrito aleatorio')
	.setOptions(options)
	.setLegacyExecution(async (request, args, isSlash) => {
		const deleteMessage = isSlash ? false : options.fetchFlag(args, 'borrar');
		if(deleteMessage)
			request.delete().catch(_ => undefined);

		const mostrarLista = options.fetchFlag(args, 'lista');
		if(mostrarLista)
			return loadPageNumber(request, 0);
		
		const emotes = getEmotesList(request);
		let perrito = CommandOptionSolver.asString(await options.fetchParam(args, 'perrito'));

		if(!perrito)
			return request.reply({ content: `${emotes[rand(emotes.length)]}` });

		perrito = perrito.normalize('NFD').replace(/([aeiou])\u0301/gi, '$1');
		perrito = emotes.find(emote => emote.name.toLowerCase().startsWith(perrito.toLowerCase()));

		if(!perrito) {
			const perritoComun = emotes.find(perrito => perrito.name === 'perrito');
			return request.reply({ content: `${perritoComun}` });
		}

		return request.reply({ content: `${perrito}` });
	})
	.setButtonResponse(async function loadPage(interaction, page) {
		return loadPageNumber(interaction, page);
	})
	.setSelectMenuResponse(async function loadPageExact(interaction) {
		const page = interaction.values[0];
		return loadPageNumber(interaction, page);
	});

module.exports = command;