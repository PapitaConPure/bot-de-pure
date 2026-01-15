import { Command, CommandTags, CommandPermissions } from '../Commons/';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputStyle, TextInputBuilder, Colors, DiscordAPIError, ContainerBuilder, SectionBuilder, MessageFlags, Interaction, TextChannel } from 'discord.js';
import { makeTextInputRowBuilder, makeButtonRowBuilder } from '../../utils/tsCasts.js';
import { compressId, fetchChannel, decompressId } from '../../func';
import PendingConfessions from '../../models/pendingConfessions.js';
import ConfessionSystems from '../../models/confessionSystems.js';
import { DiscordAgent } from '../../systems/agents/discordagent';
import { fetchGuildMembers } from '../../utils/guildratekeeper';
import { auditError } from '../../systems/others/auditor';

const confessionTasks = [];

const perms = new CommandPermissions()
	.requireAnyOf('ManageMessages')
	.requireAnyOf([ 'ManageChannels', 'ManageGuild' ]);

const tags = new CommandTags().add('MOD');

const command = new Command('confesión', tags)
	.setAliases(
		'confesion',
		'confesiones',
		'confesionario',
		'confession',
		'confessions',
		'confessionary',
	)
	.setBriefDescription('Muestra un Asistente de Configuración de Confesionario')
	.setLongDescription(
		'Muestra un Asistente de Configuración de Sistema de Confesiones.',
	)
	.setPermissions(perms)
	.setExecution(async request => {
		let query = { guildId: request.guildId };
		const confSystem = await ConfessionSystems.findOne(query);
		const logChannel = fetchChannel(confSystem?.logChannelId, request.guild);
		const confChannel = fetchChannel(confSystem?.confessionsChannelId, request.guild);

		const embed = new EmbedBuilder()
			.setAuthor({ name: request.guild.name, iconURL: request.guild.iconURL() })
			.setTitle('Configuración de Sistema de Confesiones')
			.setColor(0x8334eb)
			.addFields(
				{ name: 'Canal de auditoría', value: `${logChannel ?? 'No configurado'}`, inline: true },
				{ name: 'Canal de confesiones', value: `${confChannel ?? 'No configurado'}`, inline: true },
				{
					name: 'Ayuda de configuración',
					value: confChannel
						? 'Si quieres cambiar alguno de los canales del Sistema, elimínalo y vuélvelo a crear con los canales deseados'
						: [
							'* Se aceptan confesiones por medio de un **canal confesionario** especificado.',
							'* Todas las confesiones pasan por un proceso de aprobación en el **canal de auditoría** seleccionado',
							'* Aquellas confesiones que sean aprobadas irán al **canal de confesiones** indicado',
							'* Pueden ser todos canales separados o el mismo canal',
						].join('\n'),
				},
			);

		const rows = [
			confSystem
				? new ActionRowBuilder().addComponents([
					new ButtonBuilder()
						.setCustomId(`confesión_deleteSystem`)
						.setLabel('Desmontar Sistema')
						.setEmoji('1458130451834081513')
						.setStyle(ButtonStyle.Danger),
				])
				: new ActionRowBuilder().addComponents([
					new ButtonBuilder()
						.setCustomId(`confesión_installSystem`)
						.setLabel('Configurar Nuevo Sistema')
						.setEmoji('1291900911643263008')
						.setStyle(ButtonStyle.Primary),
				]),
		];

		return request.reply({
			embeds: [embed],
			components: rows,
			ephemeral: true,
		});
	}).setButtonResponse(async function installSystem(interaction) {
		const rows = [
			makeTextInputRowBuilder().addComponents(
				new TextInputBuilder()
					.setCustomId('inputConfessionalChannel')
					.setLabel('Canal de confesionario')
					.setPlaceholder('Canal público. ID, mención o parte del nombre')
					.setMinLength(1)
					.setMaxLength(256)
					.setStyle(TextInputStyle.Short)
					.setRequired(true),
			),
			makeTextInputRowBuilder().addComponents(
				new TextInputBuilder()
					.setCustomId('inputConfessionsChannel')
					.setLabel('Canal de confesiones')
					.setPlaceholder('Canal público. ID, mención o parte del nombre')
					.setMinLength(1)
					.setMaxLength(256)
					.setStyle(TextInputStyle.Short)
					.setRequired(true),
			),
			makeTextInputRowBuilder().addComponents(
				new TextInputBuilder()
					.setCustomId('inputLogChannel')
					.setLabel('Canal de auditoría de confesiones')
					.setPlaceholder('Canal privado. ID, mención o parte del nombre')
					.setMinLength(1)
					.setMaxLength(256)
					.setStyle(TextInputStyle.Short)
					.setRequired(true),
			),
		];

		const modal = new ModalBuilder()
			.setCustomId('confesión_channelConfigFilled')
			.setTitle('Configuración de Confesionario')
			.addComponents(rows);

		return interaction.showModal(modal);
	}).setButtonResponse(async function deleteSystem(interaction) {
		const query = { guildId: interaction.guildId };

		if(!(await ConfessionSystems.exists(query)))
			return interaction.update({ content: '⚠️ No hay ningún Sistema de Confesiones configurado para este servidor', embeds: [], components: [] });

		await ConfessionSystems.deleteOne(query);

		return interaction.update({ content: '✅ Sistema eliminado con éxito', embeds: [], components: [] });
	}).setModalResponse(async function channelConfigFilled(interaction) {
		let confSystem = await ConfessionSystems.findOne({ guildId: interaction.guildId });
		if(confSystem)
			return interaction.reply({ content: '⚠️ Ya hay un Sistema de Confesiones configurado para este servidor' });

		const confessionalChannel = fetchChannel(interaction.fields.getTextInputValue('inputConfessionalChannel'), interaction.guild);
		if(!confessionalChannel || confessionalChannel.type !== ChannelType.GuildText)
			return interaction.reply({ content: '⚠️ El canal de confesionario indicado no existe o no es de texto común', ephemeral: true });

		const logChannel = fetchChannel(interaction.fields.getTextInputValue('inputLogChannel'), interaction.guild);
		if(!logChannel || logChannel.type !== ChannelType.GuildText)
			return interaction.reply({ content: '⚠️ El canal de auditoría indicado no existe o no es de texto común', ephemeral: true });

		const confessionsChannel = fetchChannel(interaction.fields.getTextInputValue('inputConfessionsChannel'), interaction.guild);
		if(!confessionsChannel || confessionsChannel.type !== ChannelType.GuildText)
			return interaction.reply({ content: '⚠️ El canal de confesiones indicado no existe o no es de texto común', ephemeral: true });

		confSystem = new ConfessionSystems({
			guildId: interaction.guildId,
			logChannelId: logChannel.id,
			confessionsChannelId: confessionsChannel.id,
		});

		const embed = new EmbedBuilder()
			.setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
			.setTitle('Confesionario')
			.setColor(0x8334eb)
			.addFields(
				{ name: 'Canal de confesiones', value: `${confessionsChannel}` },
			);

		const rows = [
			makeButtonRowBuilder().addComponents([
				new ButtonBuilder()
					.setCustomId(`confesión_confess_anon`)
					.setLabel('Confesar (anónimo)')
					.setStyle(ButtonStyle.Primary),
			]),
			makeButtonRowBuilder().addComponents([
				new ButtonBuilder()
					.setCustomId(`confesión_confess`)
					.setLabel('Confesar (+ nombre)')
					.setStyle(ButtonStyle.Danger),
			]),
		];

		await Promise.all([
			confessionalChannel.send({ embeds: [embed], components: rows }),
			confSystem.save(),
		]);

		return interaction.update({ content: '✅ Sistema configurado exitosamente', embeds: [], components: [] });
	}).setButtonResponse(async function confess(interaction, anonymous) {
		const row = makeTextInputRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('inputConfession')
				.setLabel(`Confesión (${anonymous ? 'anónima': 'con nombre'})`)
				.setMinLength(1)
				.setMaxLength(1000)
				.setStyle(TextInputStyle.Paragraph)
		);

		const modal = new ModalBuilder()
			.setCustomId(`confesión_confessionFilled_${anonymous ?? ''}`)
			.setTitle('Petición de Confesión')
			.addComponents([row]);

		return interaction.showModal(modal);
	}).setModalResponse(async function confessionFilled(interaction, anonymous) {
		const data = await getConfessionSystemAndChannels(interaction);
		if(data.success === false)
			return interaction.reply({ content: data.message, ephemeral: true });

		const { confSystem, logChannel } = data;

		const isAnonymous = anonymous.length > 0;
		const userId = compressId(interaction.user.id);
		const confId = compressId(interaction.id);
		const confContent = interaction.fields.getTextInputValue('inputConfession');
		const pendingConf = new PendingConfessions({
			id: confId,
			channelId: confSystem.confessionsChannelId,
			content: confContent,
			anonymous: isAnonymous,
		});
		confSystem.pending[confSystem.pending.length] = confId;
		confSystem.markModified('pending');

		const embed = new EmbedBuilder()
			.setAuthor({ name: 'Confesión entrante' })
			.setColor(0x8334eb)
			.addFields(
				{ name: 'Confesado', value: `${confContent}` },
				{ name: '¿Anónimo?', value: isAnonymous ? 'Sí' : 'No' },
			);

		const row = makeButtonRowBuilder().addComponents([
			new ButtonBuilder()
				.setCustomId(`confesión_acceptConfession_${confId}_${userId}`)
				.setEmoji('1163687887120891955')
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId(`confesión_rejectConfession_${confId}`)
				.setEmoji('1355143793577426962')
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId(`confesión_timeoutConfessant_${confId}_${userId}`)
				.setEmoji('1355143793577426962')
				.setLabel('Rechazar y Aislar')
				.setStyle(ButtonStyle.Danger),
			new ButtonBuilder()
				.setCustomId(`confesión_banConfessant_${confId}_${userId}`)
				.setEmoji('1355143793577426962')
				.setLabel('Rechazar y Bannear')
				.setStyle(ButtonStyle.Danger),
		]);

		await delegateConfessionSystemTasks(
			logChannel.send({ embeds: [embed], components: [row] }),
			confSystem.save().then(() => pendingConf.save()),
		);

		const confirmationEmbed = new EmbedBuilder()
			.setTitle('Confesión enviada anónimamente para aprobación')
			.setDescription('Podrás ver tu confesión cuando se apruebe')
			.setColor(Colors.Green)
			.addFields(
				{
					name: 'Proceso de Aprobación',
					value: `Tu confesión será accesible públicamente luego de ser aprobada${isAnonymous ? '' : ' y recién entonces se revelará tu nombre'}`,
				},
				{
					name: 'Medidas Protectivas',
					value: [
						'Ten en cuenta que se proveen herramientas de auditoría para castigar confesiones malintencionadas.',
						'En dichos casos, incluso si tu confesión es anónima, tu identidad puede quedar expuesta y la confesión se rechazará'
					].join('\n'),
				},
			);

		return interaction.reply({
			flags: MessageFlags.Ephemeral,
			embeds: [confirmationEmbed],
		});
	}).setButtonResponse(async function acceptConfession(interaction, confId, userId, messageId) {
		const data = await getConfessionSystemAndChannels(interaction);
		if(data.success === false)
			return interaction.reply({ content: data.message, ephemeral: true });

		const { confSystem, confChannel } = data;

		const confession = await PendingConfessions.findOne({ id: confId });
		if(!confession)
			return interaction.update({ content: '⚠️ La confesión ya se atendió, pero no se registró aquí por un error externo', components: [] });

		if(messageId) {
			const actualMessageId = decompressId(messageId);
			const message = await confChannel.messages.fetch(actualMessageId);
			const thread = message.hasThread
				? message.thread
				: await message.startThread({
					name: 'Respuestas',
					reason: 'Aprobación de respuesta anónima a confesión',
				});

			const agent = await (new DiscordAgent().setup(thread));
			agent.setUser(interaction.client.user);

			await agent.sendAsUser({
				username: 'Respuesta anónima',
				content: `${confession.content}`,
			});
		} else {
			let confessionContent = '-# ';
			const confessionSection = new SectionBuilder();
			const confessionContainer = new ContainerBuilder()
				.setAccentColor(0x8334eb)
				.addSectionComponents(confessionSection);
			const replyButton = new ButtonBuilder()
				.setCustomId(`confesión_promptReplyAnon`)
				.setEmoji('1456639740974600263')
				.setStyle(ButtonStyle.Secondary);

			if(confession.anonymous) {
				confessionContent += '<:person:1355128242993893539> Confesión anónima';
				confessionSection
					.setButtonAccessory(replyButton)
			} else {
				await fetchGuildMembers(interaction.guild);
				const gmid = decompressId(userId);
				const miembro = interaction.guild.members.cache.get(gmid);

				if(miembro) {
					confessionContent += `<:person:1355128242993893539> Confesión de ${miembro}`;
					confessionSection
						.setThumbnailAccessory(accessory =>
							accessory
								.setURL(miembro.displayAvatarURL({ size: 256 }))
						);
					replyButton
						.setLabel('Responder anónimamente');
					confessionContainer
						.addActionRowComponents(actionRow =>
							actionRow
								.setComponents(replyButton)
						);
				} else {
					confessionContent += `⚠️ Confesión no-anónima, pero no se pudo recuperar el autor`;
					confessionSection
						.setButtonAccessory(replyButton)
					}
			}
			confessionContent += `\n${confession.content}`;

			confessionSection
				.addTextDisplayComponents(textDisplay =>
					textDisplay.setContent(confessionContent)
				);

			await confChannel.send({
				flags: MessageFlags.IsComponentsV2,
				components: [confessionContainer],
			});
		}

		confSystem.pending = confSystem.pending.filter(p => p !== confId);
		confSystem.markModified('pending');

		await delegateConfessionSystemTasks(
			confSystem.save(),
			confession.deleteOne(),
		);

		const confirmationEmbed = new EmbedBuilder()
			.setColor(0x32e698)
			.setDescription(`${messageId ? 'Respuesta anónima' : 'Confesión'} aceptada por ${interaction.user}. Aparecerá en ${confChannel}`);

		return interaction.update({ embeds: [confirmationEmbed], components: [] });
	}).setButtonResponse(async function rejectConfession(interaction, confId) {
		const data = await getConfessionSystemAndChannels(interaction);
		if(data.success === false)
			return interaction.reply({ content: data.message, ephemeral: true });

		const { confSystem } = data;

		const index = confSystem.pending.indexOf(confId);
		if(index < 0)
			return interaction.update({ content: '⚠️ Esta confesión ya no está pendiente', components: [] });

		await Promise.allSettled(confessionTasks);
		confSystem.pending.splice(index, 1);
		confSystem.markModified('pending');
		await delegateConfessionSystemTasks(
			confSystem.save(),
			PendingConfessions.findOneAndDelete({ id: confId }),
		);

		const confirmationEmbed = new EmbedBuilder()
			.setColor(0xeb345c)
			.setDescription(`Confesión rechazada por ${interaction.user}. No se le notificará al autor`);

		return interaction.update({ embeds: [confirmationEmbed], components: [] });
	}).setButtonResponse(async function timeoutConfessant(interaction, confId, userId) {
		const data = await getConfessionSystemAndChannels(interaction);
		if(data.success === false)
			return interaction.reply({ content: data.message, ephemeral: true });

		const { confSystem } = data;

		const index = confSystem.pending.indexOf(confId);
		if(index < 0)
			return interaction.update({ content: '⚠️ La confesión ya se atendió, pero no se registró aquí por un error externo', components: [] });

		confSystem.pending.splice(index, 1);
		confSystem.markModified('pending');
		await delegateConfessionSystemTasks(
			confSystem.save(),
			PendingConfessions.findOneAndDelete({ id: confId }),
		);

		const gmid = decompressId(userId);
		const miembro = interaction.guild.members.cache.get(gmid);
		let confirmationEmbed: EmbedBuilder;
		try {
			if(miembro)
				await miembro.timeout(120_000, `Aislado por ${interaction.user.username} por confesión malintencionada`);
			else
				throw new ReferenceError('No se pudo encontrar el autor de esta confesión');

			confirmationEmbed = new EmbedBuilder()
				.setAuthor({ name: 'Confesante aislado' })
				.setColor(Colors.Orange)
				.setDescription(`Esta confesión fue rechazada por ${interaction.user} y su confesante fue aislado`);
		} catch(err) {
			confirmationEmbed = new EmbedBuilder()
				.setAuthor({ name: 'Confesión rechazada con errores' })
				.setColor(Colors.Red)
				.setDescription(`Confesión rechazada por ${interaction.user}. Se intentó aislar al confesante (${miembro}), pero algo lo impidió`)
				.addFields(
					{ name: 'Error', value: err.message ? `\`\`\`\n${err.message}\n\`\`\`` : '_No hay un mensaje de error disponible_' },
				);

			if(!(err instanceof DiscordAPIError))
				auditError(err, { request: interaction, brief: 'Ha ocurrido un error al aislar un confesante', ping: false });
		}

		return interaction.update({ embeds: [confirmationEmbed], components: [] });
	}).setButtonResponse(async function banConfessant(interaction, confId, userId) {
		const data = await getConfessionSystemAndChannels(interaction);
		if(data.success === false)
			return interaction.reply({ content: data.message, ephemeral: true });

		const { confSystem } = data;

		const index = confSystem.pending.indexOf(confId);
		if(index < 0)
			return interaction.update({ content: '⚠️ La confesión ya se atendió, pero no se registró aquí por un error externo', components: [] });

		confSystem.pending.splice(index, 1);
		confSystem.markModified('pending');
		await delegateConfessionSystemTasks(
			confSystem.save(),
			PendingConfessions.findOneAndDelete({ id: confId }),
		);

		const gmid = decompressId(userId);
		const miembro = interaction.guild.members.cache.get(gmid);
		let confirmationEmbed: EmbedBuilder;
		try {
			if(miembro)
				await miembro.ban({ reason: `Banneado por ${interaction.user.username} por confesión malintencionada` });
			else
				throw new ReferenceError('No se pudo encontrar el autor de esta confesión');

			confirmationEmbed = new EmbedBuilder()
				.setAuthor({ name: 'Confesante banneado' })
				.setColor(Colors.Orange)
				.setDescription(`Esta confesión fue rechazada por ${interaction.user} y su confesante fue banneado`);
		} catch(err) {
			confirmationEmbed = new EmbedBuilder()
				.setAuthor({ name: 'Confesión rechazada con errores' })
				.setColor(Colors.Red)
				.setDescription(`Confesión rechazada por ${interaction.user}. Se intentó bannear al confesante (${miembro}), pero algo lo impidió`)
				.addFields(
					{ name: 'Error', value: err.message ? `\`\`\`\n${err.message}\n\`\`\`` : '_No hay un mensaje de error disponible_' },
				);

			if(!(err instanceof DiscordAPIError))
				auditError(err, { request: interaction, brief: 'Ha ocurrido un error al bannear un confesante', ping: false });
		}

		return interaction.update({ embeds: [confirmationEmbed], components: [] });
	}).setButtonResponse(async function promptReplyAnon(interaction) {
		const modal = new ModalBuilder()
			.setCustomId('confesión_replyAnon')
			.setTitle('Responder a confesión')
			.addLabelComponents(label =>
				label
					.setLabel('Respuesta')
					.setTextInputComponent(textInput =>
						textInput
							.setCustomId('content')
							.setPlaceholder('Contenido de tu respuesta')
							.setStyle(TextInputStyle.Paragraph)
							.setRequired(true)
							.setMinLength(1)
							.setMaxLength(1000)
					)
			);

		return interaction.showModal(modal);
	}).setModalResponse(async function replyAnon(interaction) {
		const data = await getConfessionSystemAndChannels(interaction);
		if(data.success === false)
			return interaction.reply({ content: data.message, ephemeral: true });

		const { confSystem, logChannel } = data;
		const { message } = interaction;

		const userId = compressId(interaction.user.id);
		const responseId = compressId(interaction.id);
		const messageId = compressId(message.id);
		const responseContent = interaction.fields.getTextInputValue('content');
		const pendingConf = new PendingConfessions({
			id: responseId,
			channelId: confSystem.confessionsChannelId,
			content: responseContent,
			anonymous: true,
		});
		confSystem.pending[confSystem.pending.length] = responseId;
		confSystem.markModified('pending');

		const embed = new EmbedBuilder()
			.setAuthor({ name: 'Respuesta anónima entrante para confesión' })
			.setColor(0x8334eb)
			.addFields(
				{ name: 'Destino', value: `${message.url}` },
				{ name: 'Respuesta', value: responseContent },
			);

		const row = makeButtonRowBuilder().addComponents([
			new ButtonBuilder()
				.setCustomId(`confesión_acceptConfession_${responseId}_${userId}_${messageId}`)
				.setEmoji('1163687887120891955')
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId(`confesión_rejectConfession_${responseId}`)
				.setEmoji('1355143793577426962')
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId(`confesión_timeoutConfessant_${responseId}_${userId}`)
				.setEmoji('1355143793577426962')
				.setLabel('Rechazar y Aislar')
				.setStyle(ButtonStyle.Danger),
			new ButtonBuilder()
				.setCustomId(`confesión_banConfessant_${responseId}_${userId}`)
				.setEmoji('1355143793577426962')
				.setLabel('Rechazar y Bannear')
				.setStyle(ButtonStyle.Danger),
		]);

		await delegateConfessionSystemTasks(
			logChannel.send({ embeds: [embed], components: [row] }),
			confSystem.save().then(() => pendingConf.save()),
		);

		return interaction.reply({
			flags: MessageFlags.Ephemeral,
			content: '✅ Tu respuesta anónima a la confesión fue enviada para revisión. Será visible cuando se apruebe.\n-# Ten en cuenta que las respuestas malintencionadas pueden ser penalizadas',
		});
	});

/**
 * @description
 * Intenta resolver un sistema de confesiones de la BDD y sus canales relacionados.
 *
 * Verifica que todos los componentes necesarios para sustentar un sistema de confesiones sean válidos.
 * Si no lo son, falla y devuelve un objeto con `success = false` y un `message` de diagnóstico de error.
 * @returns Un objeto con los datos obtenidos.
 */
async function getConfessionSystemAndChannels(interaction: Interaction) {
	await Promise.allSettled(confessionTasks);

	/**
	 * @param {string} message
	 * @returns {{ success: false, message: string }}
	 */
	const makeErr = (message: string): { success: false; message: string; } => ({ success: false, message });

	const confSystem = await ConfessionSystems.findOne({ guildId: interaction.guildId });
	if(!confSystem)
		return makeErr('⚠️ No se ha configurado un sistema de confesiones en este server');

	const logChannel = interaction.guild.channels.cache.get(confSystem.logChannelId);
	if(!logChannel || logChannel.type !== ChannelType.GuildText)
		return makeErr('⚠️ No se encontró un canal de auditoría de confesiones válido');

	const confChannel = interaction.guild.channels.cache.get(confSystem.confessionsChannelId);
	if(!confChannel || confChannel.type !== ChannelType.GuildText)
		return makeErr('⚠️ No se encontró un canal de confesiones válido');

	const ret: { success: true; confSystem: typeof confSystem; logChannel: TextChannel; confChannel: TextChannel; } = {
		success: true,
		confSystem,
		logChannel,
		confChannel,
	};

	return ret;
}

/**
 * @description Delega tareas pendientes al sistema de confesiones.
 * @param tasks Nuevas promesas a delegar al sistema de confesiones.
 */
async function delegateConfessionSystemTasks(...tasks: any[]) {
	confessionTasks.push(...tasks);
	return Promise.allSettled(tasks);
}

export default command;
