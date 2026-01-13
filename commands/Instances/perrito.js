const Discord = require('discord.js'); //Integrar discord.js
const serverIds = require('../../data/serverIds.json');
const { paginate, navigationRows, rand } = require('../../func');
const { CommandOptions, CommandTags, Command, CommandOptionSolver } = require('../Commons/');
const { InteractionType } = require('discord.js');

/**@param {import('../Commons/typings').AnyRequest} interaction*/
function getEmotesList(interaction) {
	const perritoNames = [
		'perrito', 'otirrep', 'od', 'do', 'cerca', 'muycerca', 'lejos', 'muylejos', 'invertido', 'dormido', 'pistola', 'sad', 'gorrito', 'gorra', 'almirante', 'detective',
		'ban', 'helado', 'corona', 'Bern', 'enojado', 'policia', 'ladron', 'importado', 'peleador', 'doge', 'cheems', 'jugo', 'Papita', 'mano', 'Mima', 'chad', 'Marisa',
		'fumado', 'Megumin', 'Navi', 'Sansas', 'chocolatada', 'ZUN', 'cafe', 'mate', 'espiando', 'madera', 'Keiki', 'piola', 'jarra', 'Nazrin', 'Miyoi', 'despierto',
		'pensando', 'santaclos', 'tomando', 'llorando', 'facha', 'sniper', 'amsiedad', 'Mayumi', 'rodando', 'veloz',
	];

	const guilds = interaction.client.guilds.cache;
	const emotes = [
		...guilds.get(serverIds.slot1).emojis.cache.values(),
		...guilds.get(serverIds.slot2).emojis.cache.values(),
	].filter(emote => perritoNames.includes(emote.name)).sort();
	return emotes;
}

/**
 * @param {Exclude<import('../Commons/typings').AnyRequest, Discord.AutocompleteInteraction>} request
 * @param {number} page
 */
async function loadPageNumber(request, page) {
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
		.addFields({ name: `${'Nombre`'.padEnd(24)}\`Emote`, value: `${emotePages[page]}` });

	const content = /**@type {import('discord.js').InteractionReplyOptions & import('discord.js').InteractionUpdateOptions}*/({
		embeds: [embed],
		components: navigationRows('perrito', page, lastPage),
	});

	if(Object.hasOwn.call(request, 'author') || request.type === InteractionType.ApplicationCommand)
		return request.reply(content);

	return 'update' in request
		? request.update(content)
		: request.edit(content);
}

const options = new CommandOptions()
	.addParam('perrito', 'TEXT', 'para especificar un perrito a enviar (por nombres identificadores)', { optional: true })
	.addFlag('ltaeh', [ 'lista', 'todo', 'todos', 'ayuda', 'everything', 'all', 'help' ], 'para mostrar una lista de todos los perritos')
	.addFlag('bd', ['borrar', 'delete'], 'para borrar el mensaje original');
const flags = new CommandTags().add(
	'MEME',
	'EMOTE',
);
const command = new Command('perrito', flags)
	.setAliases('taton', 'dog', 'pe')
	.setBriefDescription('Envía un emote de perrito o lista todos los disponibles')
	.setLongDescription('Comando cachorro de Taton. Puedes ingresar una palabra identificadora para enviar un perrito en específico o ver una lista de perritos. Si no ingresas nada, se enviará un perrito aleatorio')
	.setOptions(options)
	.setLegacyExecution(async (request, args, isSlash) => {
		const deleteMessage = isSlash ? false : options.fetchFlag(args, 'borrar');

		if(deleteMessage && request.isMessage && request.inferAsMessage().deletable)
			request.delete().catch(() => undefined);

		const mostrarLista = options.fetchFlag(args, 'lista');
		if(mostrarLista)
			return loadPageNumber(request, 0);
		
		const emotes = getEmotesList(request);
		let perrito = CommandOptionSolver.asString(await options.fetchParam(args, 'perrito'));

		if(!perrito)
			return request.reply({ content: `${emotes[rand(emotes.length)]}` });

		perrito = perrito.normalize('NFD').replace(/([aeiou])\u0301/gi, '$1');
		const perritoEmoji = emotes.find(emote => emote.name.toLowerCase().startsWith(perrito.toLowerCase()));

		if(!perritoEmoji) {
			const perritoComun = emotes.find(e => e.name === 'perrito');
			return request.reply({ content: `${perritoComun}` });
		}

		return request.reply({ content: `${perritoEmoji}` });
	})
	.setButtonResponse(async function loadPage(interaction, page) {
		return loadPageNumber(interaction, parseInt(page));
	})
	.setSelectMenuResponse(async function loadPageExact(interaction) {
		const page = interaction.values[0];
		return loadPageNumber(interaction, parseInt(page));
	});

module.exports = command;