const { EmbedBuilder, InteractionType, Emoji } = require('discord.js'); //Integrar discord.js
const { CommandTags, CommandManager, CommandOptions, CommandOptionSolver } = require("../Commons/commands");
const { emojiRegex } = require('../../func');

const options = new CommandOptions()
	.addParam('mensaje', 'MESSAGE', 'para especificar un mensaje por ID o respuesta (si es un comando de mensaje, por defecto se usa el mensaje del comando)');

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
			?? request.isMessage ? /**@type {import('discord.js').Message<true>}*/(request) : null;

		if(!message)
			return request.reply({ content: '⚠️️ Debes especificar un mensaje' });

		const emojisMatches = message.content.matchAll(emojiRegex);
		if(!emojisMatches)
			return request.reply({ content: 'No se encontraron Emojis...' });

		/**@type {Array<EmbedBuilder>}*/
		const embeds = [];

		for(const emojiMatch of emojisMatches) {
			const emoji = request.client.emojis.resolve(emojiMatch[1]);

			const embed = new EmbedBuilder()
				.setColor('Blurple')
				.setAuthor({ name: 'Emoji' })
				.setTitle(emoji.name)
				.setImage(emoji.url)
				.setFooter({ text: emoji.animated ? '🎞️' : '🖼️' })
				.setTimestamp(emoji.createdTimestamp);

			embeds.push(embed);
		}
		
		return request.reply({ embeds });
	});

module.exports = command;