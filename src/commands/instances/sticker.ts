import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { getBotEmojiResolvable } from '@/utils/emojis';
import { Command, CommandOptions, CommandTags } from '../commons';

const options = new CommandOptions().addParam(
	'mensaje',
	'MESSAGE',
	'para especificar un mensaje por ID, enlace o respuesta',
);

const tags = new CommandTags().add('COMMON');

const command = new Command('sticker', tags)
	.setAliases('stickers', 'pegatina')
	.setDescription('Muestra el enlace del sticker especificado')
	.setOptions(options)
	.setExecution(async (request, args) => {
		const messageId = request.isMessage && request.inferAsMessage().reference?.messageId;
		const message =
			(await args.getMessage('mensaje', true))
			?? (messageId ? request.channel.messages.cache.get(messageId) : null)
			?? (request.isMessage ? request.inferAsMessage() : null);

		if (!message?.stickers.size)
			return request.reply({ content: '⚠️️ Debes especificar un mensaje con un sticker' });

		const sticker = await message.stickers.first()?.fetch().catch(console.error);
		if (!sticker) return request.reply({ content: 'No se encontraron stickers...' });

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

		return request.reply({
			embeds: [embed],
			components: [row],
		});
	});

export default command;
