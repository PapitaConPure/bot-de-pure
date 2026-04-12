import type { Message } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { emojiRegex } from '@/func';
import { Command, CommandOptions, CommandTags } from '../commons';

const options = new CommandOptions()
	.addParam('mensaje', 'MESSAGE', 'para especificar un mensaje por ID, enlace o respuesta', {
		optional: true,
	})
	.addParam('emote', 'EMOTE', 'para indicar un emote (si no especificaste un mensaje)', {
		optional: true,
	});

const flags = new CommandTags().add('COMMON');
const command = new Command('emote', flags)
	.setAliases('emotes', 'emoji', 'emojis', 'emt', 'emj', 'e')
	.setDescription('Muestra el enlace del emote especificado')
	.setOptions(options)
	.setExecution(async (request, args) => {
		const content = args.getString('emote', true);

		if (!content)
			return request.reply({
				content: '⚠️️ Debes especificar un emote o un mensaje con un emote',
			});

		const emojisMatches = content.matchAll(emojiRegex);
		if (!emojisMatches) return request.reply({ content: 'No se encontraron emotes...' });

		const embeds: EmbedBuilder[] = [];

		const components: ActionRowBuilder<ButtonBuilder>[] = [];

		for (const emojiMatch of emojisMatches) {
			if (embeds.length >= 25) continue;

			const emoji = request.client.emojis.resolve(emojiMatch[1]);
			if (!emoji) continue;

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

			if (components.length && components[components.length - 1].components.length < 5) {
				components[components.length - 1].addComponents(button);
			} else {
				const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
				components.push(row);
			}
		}

		if (!embeds.length)
			return request.reply({
				content:
					'⚠️️ Los emotes mencionados son inválidos o inaccesibles. Verifica que yo esté en el servidor con el emote',
			});

		return request.reply({ embeds, components });
	});

export default command;
