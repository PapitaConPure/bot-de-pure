const { EmbedBuilder, InteractionType } = require('discord.js'); //Integrar discord.js
const { serverid } = require('../../localdata/config.json'); //Variables globales
const { paginate, navigationRows } = require('../../func');
const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

/**@param {import('discord.js').Interaction} interaction*/
function getEmotePages(interaction) {
	const guilds = interaction.client.guilds.cache;
	const emotes = [
		...guilds.get(serverid.slot1).emojis.cache.values(),
		...guilds.get(serverid.slot2).emojis.cache.values(),
		...guilds.get(serverid.slot3).emojis.cache.values(),
	].sort();
	return paginate(emotes);
}

/**
 * @param {import('../Commons/typings').CommandRequest} request
 * @param {Number} page
 */
async function loadPageNumber (request, page) {
	page = parseInt(page);
	const emotePages = getEmotePages(request);
	const user = (request.author ?? request.user);
	const lastPage = emotePages.length - 1;
	
	const embed = new EmbedBuilder()
		.setColor(0xfecb4c)
		.setTitle('Oe mira po, emotes')
		.setAuthor({ name: `Emotes`, iconURL: user.avatarURL({ size: 256 }) })
		.setFooter({ text: `${page + 1} / ${lastPage + 1}` })
		.addFields({ name: `${'Nombre\`'.padEnd(23)}\`Emote`, value: emotePages[page] });
	const content = {
		embeds: [embed],
		components: navigationRows('emotes', page, lastPage),
	};

	if(request.author || request.type === InteractionType.ApplicationCommand)
		return request.reply(content);
	
	return request.update(content);
}

const flags = new CommandMetaFlagsManager().add('COMMON');
const command = new CommandManager('emotes', flags)
	.setAliases(
		'emojis', 'emote', 'emoji',
		'emt',
	)
	.setBriefDescription('Muestra una lista de emotes disponibles')
	.setLongDescription('Muestra una lista paginada de emotes a mi disposición')
	.setExecution(async request => {
		return loadPageNumber(request, 0);
	})
	.setButtonResponse(async function loadPage(interaction, page) {
		return loadPageNumber(interaction, page);
	})
	.setSelectMenuResponse(async function loadPageExact(interaction) {
		const page = interaction.values[0];
		return loadPageNumber(interaction, page);
	});

module.exports = command;