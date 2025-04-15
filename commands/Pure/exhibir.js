const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors } = require('discord.js');
const { CommandTags, CommandManager } = require("../Commons/commands");
const { DiscordAgent } = require('../../systems/agents/discordagent.js');
const { hourai, serverid } = require('../../localdata/config.json');
const { CommandPermissions } = require('../Commons/cmdPerms.js');

let crazyBackupId = hourai.crazyBackupChannelId;

const perms = new CommandPermissions([ 'ManageGuild', 'ManageChannels', 'ManageMessages' ]);

const flags = new CommandTags().add(
	'MOD',
	'HOURAI',
);

const command = new CommandManager('exhibir', flags)
	.setAliases(
		'exhibirpins', 'migrarpins',
		'flush', 'flushpins',
		'ep', 'mp', 'fp',
	)
	.setBriefDescription(`Traslada mensajes pinneados a <#${crazyBackupId}>`)
	.setLongDescription(
		`Envía mensajes pinneados en el canal actual a <#${crazyBackupId}>`,
		'Esto eliminará todos los pins en el canal luego de reenviarlos',
	)
	.setPermissions(perms)
	.setExecution(async request => {
		const pinnedMessages = await request.channel.messages.fetchPinned();
		const user = request.user;

		const embed = new EmbedBuilder()
			.setTitle('Exhibir pins')
			.addFields({
				name: 'Confirmar operación',
				value: `¿Quieres postear todos los mensajes pinneados del canal actual en <#${crazyBackupId}> y despinnearlos?\nEsto liberará **${pinnedMessages.size}** espacios para pin`,
			});
		return request.reply({
			embeds: [embed],
			components: [new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`exhibir_flushPins_${user.id}`)
					.setLabel('Exhibir')
					.setStyle(ButtonStyle.Danger),
				new ButtonBuilder()
					.setCustomId(`exhibir_cancelFlush_${user.id}`)
					.setEmoji('1355143793577426962')
					.setStyle(ButtonStyle.Secondary),
			)],
			ephemeral: true,
		});
	})
	.setButtonResponse(async function flushPins(interaction, userId) {
		if(interaction.user.id !== userId)
			return interaction.reply({ content: '❌ No permitido', ephemeral: true });
		
		interaction.deferUpdate();
		const { channel } = interaction;
		const [ pinnedMessages, backupChannel ] = await Promise.all([
			(await channel.messages.fetchPinned()).reverse(),
			(interaction.guild.id === serverid.saki
				? /**@type {Promise<import('discord.js').GuildTextBasedChannel>}*/(interaction.guild.channels.fetch(crazyBackupId)) //crazy-backup
				: /**@type {Promise<import('discord.js').GuildTextBasedChannel>}*/(interaction.guild.channels.fetch('1232090120581156905')) //Puré I (tests)
			),
		]);

		if(!pinnedMessages?.size)
			return interaction.editReply({ content: '⚠️ Este canal no tiene pins' });

		if(!backupChannel)
			return interaction.editReply({ content: '⚠️ Canal receptor no encontrado' });
		
		const agent = await (new DiscordAgent().setup(backupChannel));
		let flushing = [];

		for(const message of pinnedMessages.values()) {
			const formattedMessage = message;
			message.embeds ??= [];
			//@ts-expect-error
			message.files ??= [];

			formattedMessage.embeds = message.embeds.map(embed => {
				//@ts-expect-error
				if(embed.type === 'video')
					return null;
				
				//@ts-expect-error
				if(embed.type === 'image' && embed.thumbnail && !embed.image) {
					//@ts-expect-error
					embed.image = embed.thumbnail;
					//@ts-expect-error
					embed.thumbnail = null;
				}
				
				return embed;
			}).filter(embed => embed);
			
			if(message.embeds.length < 10) {
				let text = '\n-# ';

				const fetchedMessage = await message.fetch(true);
				if(fetchedMessage.reactions.cache.size)
					text += `${fetchedMessage.reactions.cache.first(3).map(reaction => `${reaction.emoji} ${reaction.count}`).join(' ')} • `;

				text += `[#${channel.name}](<${message.url}>) • <t:${Math.round(message.createdTimestamp / 1000)}:F>`;
				
				/**@type {Array<EmbedBuilder>}*/(/**@type {Array<unknown>}*/(formattedMessage.embeds)).push(
					new EmbedBuilder()
						.setColor(Colors.Gold)
						.setDescription(text),
				);
			}

			message.member ? agent.setMember(message.member) : agent.setUser(message.author);
			const sent = await agent.sendAsUser(/**@type {import('discord.js').WebhookMessageCreateOptions}*/(/**@type {unknown}*/(formattedMessage)));
			if(!sent)
				interaction.channel.send({ content: '⚠️ Se omitió un pin debido a un error al trasladarlo' });
			else
				flushing.push(
					message.unpin()
					.catch(() => interaction.channel.send({ content: `⚠️ No se pudo despinnear un mensaje\n${message.url}` }))
				);
		}
		const flushed = (await Promise.all(flushing)).length;

		const embed = new EmbedBuilder()
			.setTitle('Traslado de pins ejecutado')
			.addFields({ name: 'Se completó la operación', value: `Se liberaron **${flushed}** espacios para pin` });

		return interaction.editReply({
			embeds: [embed],
			components: [],
		});
	})
	.setButtonResponse(async function cancelFlush(interaction, userId) {
		if(interaction.user.id !== userId)
			return interaction.reply({ content: '❌ No permitido', ephemeral: true });
		
		const embed = new EmbedBuilder()
			.setTitle('Traslado cancelado')
			.addFields({ name: 'Se canceló la operación', value: 'Todos los mensajes pinneados siguen ahí' });
		
		return interaction.update({ embeds: [embed], components: [] });
	});

module.exports = command;