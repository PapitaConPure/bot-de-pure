import { ContextMenuAction } from '../Commons/actionBuilder';
import { MessageFlags, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { Translator } from '../../i18n';

const action = new ContextMenuAction('actionGetSticker', 'Message')
	.setMessageResponse(async interaction => {
		const message = interaction.targetMessage;
		const uid = interaction.user.id;
		const translator = await Translator.from(uid);

		const sticker = await message.stickers.first()?.fetch().catch(console.error);
		if(!sticker)
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
				.setEmoji('922669195521568818')
				.setStyle(ButtonStyle.Link),
		);

		return interaction.reply({
			embeds: [ embed ],
			components: [ row ],
		});
	});

export default action;
