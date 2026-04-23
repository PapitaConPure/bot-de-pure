import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	MessageFlags,
} from 'discord.js';
import { Translator } from '@/i18n';
import { getBotEmojiResolvable } from '@/utils/emojis';
import { ContextMenuAction } from '../commons/actionBuilder';

const action = new ContextMenuAction('actionGetSticker', 'Message').setMessageResponse(
	async (interaction) => {
		const message = interaction.targetMessage;
		const uid = interaction.user.id;
		// biome-ignore lint/correctness/noUnusedVariables: TODO: Traducir
		const translator = await Translator.from(uid);

		const sticker = await message.stickers.first()?.fetch().catch(console.error);
		if (!sticker)
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: 'No se encontraron stickers...',
			});

		const embed = new EmbedBuilder()
			.setColor('Blurple')
			.setAuthor({ name: 'Sticker' })
			.setTitle(sticker.name)
			.setTimestamp(sticker.createdTimestamp)
			.setImage(sticker.url);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setURL(sticker.url)
				.setEmoji(getBotEmojiResolvable('urlAccent'))
				.setStyle(ButtonStyle.Link),
		);

		return interaction.reply({
			embeds: [embed],
			components: [row],
		});
	},
);

export default action;
