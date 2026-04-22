import { getUnixTime } from 'date-fns';
import type { GuildTextBasedChannel } from 'discord.js';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Colors,
	EmbedBuilder,
	MessageFlags,
} from 'discord.js';
import { saki } from '@/data/sakiProps';
import serverIds from '@/data/serverIds.json';
import { DiscordAgent } from '@/utils/discordagent';
import { getBotEmojiResolvable } from '@/utils/emojis';
import { Command, CommandTags } from '../commons';
import { CommandPermissions } from '../commons/cmdPerms.js';

const crazyBackupId = saki.crazyBackupChannelId;

const perms = new CommandPermissions(['ManageGuild', 'ManageChannels', 'ManageMessages']);

const flags = new CommandTags().add('MOD', 'SAKI');

const command = new Command('exhibir', flags)
	.setAliases('exhibirpins', 'migrarpins', 'flush', 'flushpins', 'ep', 'mp', 'fp')
	.setBriefDescription(`Traslada mensajes pinneados a <#${crazyBackupId}>`)
	.setLongDescription(
		`Envía mensajes pinneados en el canal actual a <#${crazyBackupId}>`,
		'Esto eliminará todos los pins en el canal luego de reenviarlos',
	)
	.setPermissions(perms)
	.setExecution(async (request) => {
		const pinnedMessages = await request.channel.messages.fetchPinned();
		const user = request.user;

		const embed = new EmbedBuilder().setTitle('Exhibir pins').addFields({
			name: 'Confirmar operación',
			value: `¿Quieres postear todos los mensajes pinneados del canal actual en <#${crazyBackupId}> y despinnearlos?\nEsto liberará **${pinnedMessages.size}** espacios para pin`,
		});
		return request.reply({
			embeds: [embed],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId(`exhibir_flushPins_${user.id}`)
						.setLabel('Exhibir')
						.setStyle(ButtonStyle.Danger),
					new ButtonBuilder()
						.setCustomId(`exhibir_cancelFlush_${user.id}`)
						.setEmoji(getBotEmojiResolvable('xmark'))
						.setStyle(ButtonStyle.Secondary),
				),
			],
			flags: MessageFlags.Ephemeral,
		});
	})
	.setButtonResponse(async function flushPins(interaction, userId) {
		if (interaction.user.id !== userId)
			return interaction.reply({ content: '❌ No permitido', flags: MessageFlags.Ephemeral });

		interaction.deferUpdate();
		const { channel } = interaction;
		const [pinnedMessages, backupChannel] = await Promise.all([
			(await channel?.messages.fetchPinned())?.reverse(),
			interaction.guild.id === serverIds.saki
				? (interaction.guild.channels.fetch(
						crazyBackupId,
					) as Promise<GuildTextBasedChannel>) //crazy-backup
				: (interaction.guild.channels.fetch(
						'1232090120581156905',
					) as Promise<GuildTextBasedChannel>), //Puré I (tests)
		]);

		if (!pinnedMessages?.size)
			return interaction.editReply({ content: '⚠️ Este canal no tiene pins' });

		if (!backupChannel)
			return interaction.editReply({ content: '⚠️ Canal receptor no encontrado' });

		const agent = await new DiscordAgent().setup(backupChannel);
		const flushing: Promise<unknown>[] = [];

		for (const message of pinnedMessages.values()) {
			const formattedMessage = message;
			message.embeds ??= [];
			//@ts-expect-error Simplemente se extiende el tipo
			message.files ??= [];

			formattedMessage.embeds = message.embeds
				.map((embed) => {
					//@ts-expect-error Te juro que "type" sí existe y hace daño
					if (embed.type === 'video') return null;

					//@ts-expect-error Te juro que "type" sí existe y hace daño
					if (embed.type === 'image' && embed.thumbnail && !embed.image) {
						//@ts-expect-error Simplemente se extiende el tipo
						embed.image = embed.thumbnail;
						//@ts-expect-error Simplemente se extiende el tipo
						embed.thumbnail = null;
					}

					return embed;
				})
				.filter((embed) => embed != null);

			if (message.embeds.length < 10) {
				let text = '\n-# ';

				const fetchedMessage = await message.fetch(true);
				if (fetchedMessage.reactions.cache.size)
					text += `${fetchedMessage.reactions.cache
						.first(3)
						.map((reaction) => `${reaction.emoji} ${reaction.count}`)
						.join(' ')} • `;

				text += `[#${channel?.name}](<${message.url}>) • <t:${getUnixTime(message.createdAt)}:F>`;

				(formattedMessage.embeds as unknown as EmbedBuilder[]).push(
					new EmbedBuilder().setColor(Colors.Gold).setDescription(text),
				);
			}

			message.member ? agent.setMember(message.member) : agent.setUser(message.author);
			const sent = await agent.sendAsUser(
				formattedMessage as unknown as import('discord.js').WebhookMessageCreateOptions,
			);
			if (!sent)
				interaction.channel?.send({
					content: '⚠️ Se omitió un pin debido a un error al trasladarlo',
				});
			else
				flushing.push(
					message.unpin().catch(() =>
						interaction.channel?.send({
							content: `⚠️ No se pudo despinnear un mensaje\n${message.url}`,
						}),
					),
				);
		}

		const flushed = (await Promise.all(flushing)).length;

		const embed = new EmbedBuilder().setTitle('Traslado de pins ejecutado').addFields({
			name: 'Se completó la operación',
			value: `Se liberaron **${flushed}** espacios para pin`,
		});

		return interaction.editReply({
			embeds: [embed],
			components: [],
		});
	})
	.setButtonResponse(async function cancelFlush(interaction, userId) {
		if (interaction.user.id !== userId)
			return interaction.reply({ content: '❌ No permitido', flags: MessageFlags.Ephemeral });

		const embed = new EmbedBuilder().setTitle('Traslado cancelado').addFields({
			name: 'Se canceló la operación',
			value: 'Todos los mensajes pinneados siguen ahí',
		});

		return interaction.update({ embeds: [embed], components: [] });
	});

export default command;
