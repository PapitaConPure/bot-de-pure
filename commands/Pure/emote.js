const { EmbedBuilder, InteractionType, Emoji, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js'); //Integrar discord.js
const { CommandTags, CommandManager, CommandOptions, CommandOptionSolver } = require("../Commons/commands");
const { emojiRegex } = require('../../func');
const { makeButtonRowBuilder } = require('../../tsCasts');

const options = new CommandOptions()
	.addParam('mensaje', 'MESSAGE', 'para especificar un mensaje por ID o respuesta');

const flags = new CommandTags().add('COMMON');
const command = new CommandManager('emote', flags)
	.setAliases(
		'emotes', 'emoji', 'emojis',
		'emt', 'emj',
		'e',
	)
	.setDescription('Muestra el enlace del emote especificado')
	.setOptions(options)
	.setExecution(async (request, args) => {
		const message = CommandOptionSolver.asMessage(await options.in(request).fetchParam(args, 'mensaje', true))
			?? request.channel.messages.cache.get(/**@type {import('discord.js').Message}*/(request).reference?.messageId)
			?? (request.isMessage ? /**@type {import('discord.js').Message<true>}*/(request) : null);

		if(!message)
			return request.reply({ content: '⚠️️ Debes especificar un mensaje' });

		const emojisMatches = message.content.matchAll(emojiRegex);
		if(!emojisMatches)
			return request.reply({ content: 'No se encontraron emotes...' });

		/**@type {Array<EmbedBuilder>}*/
		const embeds = [];

		/**@type {Array<ActionRowBuilder>}*/
		const components = [];

		for(const emojiMatch of emojisMatches) {
			if(embeds.length >= 25) continue;

			const emoji = request.client.emojis.resolve(emojiMatch[1]);
			if(!emoji) continue;

			const embed = new EmbedBuilder()
				.setColor('Blurple')
				.setAuthor({ name: 'Emoji' })
				.setTitle(emoji.name)
				.setImage(emoji.url)
				.setFooter({ text: emoji.animated ? '🎞️' : '🖼️' })
				.setTimestamp(emoji.createdTimestamp);

			embeds.push(embed);
						
			const button = new ButtonBuilder()
				.setURL(emoji.url)
				.setEmoji('922669195521568818')
				.setLabel(emoji.name)
				.setStyle(ButtonStyle.Link);

			if(components.length && components[components.length - 1].components.length < 5) {
				components[components.length - 1].addComponents(button);
			} else {
				const row = makeButtonRowBuilder().addComponents(button);
				components.push(row);
			}
		}

		if(!embeds.length)
			return request.reply({ content: '⚠️️ Los emotes mencionados son inválidos o inaccesibles. Verifica que yo esté en el servidor con el emote.' });
		
		return request.reply({ embeds, components });
	});

module.exports = command;