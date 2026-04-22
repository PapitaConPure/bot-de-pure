import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { tenshiColor } from '@/data/globalProps';
import FeedConfigModel from '@/models/feeds';
import { getBotEmoji, getBotEmojiResolvable } from '@/utils/emojis';
import { Command, CommandTags } from '../commons';

const tags = new CommandTags().add('PAPA');

const command = new Command('papa-feedback', tags)
	.setLongDescription('Comando de feedback')
	.setExecution(async (request) => {
		const { client } = request;

		const feedbackEmbed = new EmbedBuilder()
			.setAuthor({
				name: 'Bot de Puré • Boorutato',
				iconURL: client.user.displayAvatarURL({ size: 256 }),
			})
			.setColor(tenshiColor)
			.setTitle('Retroalimentación / Feedback / フィードバック')
			.setFooter({
				text: 'Papita con Puré',
				iconURL: 'https://cdn.discordapp.com/emojis/1107848137458073701.gif?size=96',
			})
			.setTimestamp(Date.now())
			.addFields(
				{
					name: getBotEmoji('langEs'),
					value: '¿Qué piensas del nuevo formato de etiquetas de Post?\nSolo se registra una respuesta por usuario',
					inline: true,
				},
				{
					name: getBotEmoji('langEn'),
					value: 'What do you think about the new Post tags formatting?\nOnly one answer is registered per user',
					inline: true,
				},
				{
					name: getBotEmoji('langJa'),
					value: '新しい投稿タグ形式についてどう思いますか？\n ユーザーごとに登録できる回答は 1つだけです',
					inline: true,
				},
			);

		const feedbackRows = [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId('feed_giveFeedback_Y')
					.setEmoji(getBotEmojiResolvable('checkmarkWhite'))
					.setLabel('Me gusta / I like it / いいね')
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId('feed_giveFeedback_N')
					.setEmoji(getBotEmojiResolvable('xmarkWhite'))
					.setLabel("No me gusta / I don't like it / 良くないです")
					.setStyle(ButtonStyle.Danger),
			),
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId('feed_giveFeedback_F')
					.setEmoji('✉')
					.setLabel('Redactar una respuesta / Write an answer / 書き込み応答')
					.setStyle(ButtonStyle.Primary),
			),
		];

		const feedConfigs = await FeedConfigModel.find({});
		feedConfigs.forEach((feedConfig) => {
			const guild = client.guilds.cache.get(feedConfig.guildId);
			const channels = guild?.channels.cache;
			const channelId = feedConfig.channelId;
			const channel = channels?.get(channelId);
			if (!channel?.isSendable()) return;
			channel.send({
				embeds: [feedbackEmbed],
				components: feedbackRows,
			});
		});
	});

export default command;
