const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors } = require('discord.js');
const { CommandMetaFlagsManager, CommandManager } = require("../Commons/commands");
const { DiscordAgent } = require('../../systems/discordagent.js');
const { hourai } = require('../../localdata/config.json');

let crazyBackupId = hourai.crazyBackupChannelId;

const flags = new CommandMetaFlagsManager().add(
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
	.setExecution(async (request) => {
		const pinnedMessages = await request.channel.messages.fetchPinned();
		const user = request.author ?? request.user;

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
					.setLabel('Cancelar')
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
			interaction.guild.channels.fetch(crazyBackupId),
			// interaction.guild.channels.fetch('870347940181471242'), //Puré I
		]);

		if(!pinnedMessages?.size)
			return interaction.editReply({ content: '⚠️ Este canal no tiene pins' });

		if(!backupChannel)
			return interaction.editReply({ content: '⚠️ Canal receptor no encontrado' });
		
		const agent = await (new DiscordAgent().setup(backupChannel));
		let flushing = [];

		for(const [_, message] of pinnedMessages.entries()) {
			const formattedMessage = message;
			message.embeds ??= [];
			message.files ??= [];
			formattedMessage.embeds = message.embeds.map(embed => {
				if(embed.type === 'video')
					return null;
				
				if(embed.type === 'image' && embed.thumbnail && !embed.image) {
					embed.image = embed.thumbnail;
					embed.thumbnail = null;
				}
				
				return embed;
			}).filter(embed => embed);
			
			if(message.embeds.length < 10) {
				formattedMessage.embeds.push(
					new EmbedBuilder()
						.setColor(Colors.Gold)
						.setDescription(`Destacado en ${channel}`)
						// .setTimestamp(message.createdTimestamp),
				);
				// message.channel.messages.fetch(message.id)
				// .then(original => {
				// 	console.log(original.reactions.cache);
				// 	if(message.reactions.cache.size)
				// 		console.log(message.reactions.cache.first(3));
				// 		formattedMessage.embeds[embedsCount - 1].setFooter({
				// 			text: message.reactions.cache.first(3).map(reaction => `${reaction.emoji} ${reaction.count}`).join(' ')
				// 		});
				// })
			}

			agent.setMember(message.member ?? message.author);
			const sent = await agent.sendAsUser(formattedMessage);
			if(!sent)
				interaction.channel.send({ content: '⚠️ Se omitió un pin debido a un error al trasladarlo' });
			else
				flushing.push(
					message.unpin()
					.catch(_ => interaction.channel.send({ content: `⚠️ No se pudo despinnear un mensaje\n${message.url}` }))
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