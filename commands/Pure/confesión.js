//const {  } = require('../../func.js'); //Funciones globales
const { compressId, fetchChannel, decompressId } = require('../../func.js');
const { TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputStyle, TextInputBuilder, Colors, DiscordAPIError } = require('discord.js');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const ConfessionSystems = require('../../localdata/models/confessionSystems.js');
const PendingConfessions = require('../../localdata/models/pendingConfessions.js');
const { CommandManager, CommandTags, CommandOptions } = require('../Commons/commands.js');
const confessionSystems = require('../../localdata/models/confessionSystems.js');
const { auditError } = require('../../systems/others/auditor.js');
const { CommandPermissions } = require('../Commons/cmdPerms.js');
const { makeTextInputRowBuilder, makeButtonRowBuilder } = require('../../tsCasts.js');

const perms = new CommandPermissions()
	.requireAnyOf('ManageMessages')
	.requireAnyOf([ 'ManageChannels', 'ManageGuild' ]);
const tags = new CommandTags().add('MOD');
const command = new CommandManager('confesión', tags)
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

		let rows;
		if(!confSystem)
			rows = [
				new ActionRowBuilder().addComponents([
					new ButtonBuilder()
						.setCustomId(`confesión_installSystem`)
						.setLabel('Configurar Nuevo Sistema')
						.setEmoji('1291900911643263008')
						.setStyle(ButtonStyle.Primary),
				]),
			];
		else
			rows = [
				new ActionRowBuilder().addComponents([
					new ButtonBuilder()
						.setCustomId(`confesión_deleteSystem`)
						.setLabel('Desmontar Sistema')
						.setEmoji('1051265954312617994')
						.setStyle(ButtonStyle.Danger),
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

		await Promise.all([
			logChannel.send({ embeds: [embed], components: [row] }),
			confSystem.save().then(_ => pendingConf.save()),
		]);

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
			embeds: [confirmationEmbed],
			ephemeral: true,
		});
	}).setButtonResponse(async function acceptConfession(interaction, confId, userId) {
		const data = await getConfessionSystemAndChannels(interaction);
		if(data.success === false)
			return interaction.reply({ content: data.message, ephemeral: true });

		const { confSystem, confChannel } = data;

		const confession = await PendingConfessions.findOne({ id: confId });
		if(!confession)
			return interaction.update({ content: '⚠️ La confesión ya se atendió, pero no se registró aquí por un error externo', components: [] });

		const confessionEmbed = new EmbedBuilder()
			.setColor(0x8334eb)
			.addFields(
				{ name: 'Confesión', value: confession.content },
			);
		
		if(!confession.anonymous) {
			const gmid = decompressId(userId);
			const miembro = interaction.guild.members.cache.get(gmid);
			if(miembro)
				confessionEmbed.setAuthor({ name: miembro.displayName ?? '[!] No se pudo resolver el autor', iconURL: miembro.displayAvatarURL({ size: 256 }) });
		}
		
		await confChannel.send({ embeds: [confessionEmbed] });

		confSystem.pending = confSystem.pending.filter(p => p !== confId);
		confSystem.markModified('pending');
		await Promise.all([
			confSystem.save(),
			confession.deleteOne(),
		]);

		const confirmationEmbed = new EmbedBuilder()
			.setColor(0x32e698)
			.setDescription(`Confesión aceptada por ${interaction.user}. Aparecerá en ${confChannel}`);

		return interaction.update({ embeds: [confirmationEmbed], components: [] });
	}).setButtonResponse(async function rejectConfession(interaction, confId) {
		const data = await getConfessionSystemAndChannels(interaction);
		if(data.success === false)
			return interaction.reply({ content: data.message, ephemeral: true });

		const { confSystem } = data;

		const index = confSystem.pending.indexOf(confId);
		if(index < 0)
			return interaction.update({ content: '⚠️ Esta confesión ya no está pendiente', components: [] });
		
		confSystem.pending.splice(index, 1);
		confSystem.markModified('pending');
		await Promise.all([
			confSystem.save(),
			PendingConfessions.findOneAndDelete({ id: confId }),
		]);

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
		await Promise.all([
			confSystem.save(),
			PendingConfessions.findOneAndDelete({ id: confId }),
		]);

		const gmid = decompressId(userId);
		const miembro = interaction.guild.members.cache.get(gmid);
		let confirmationEmbed;
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
					{ name: 'Error', value: `\`\`\`\n${err.message}\n\`\`\`` || '_No hay un mensaje de error disponible_' },
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
		await Promise.all([
			confSystem.save(),
			PendingConfessions.findOneAndDelete({ id: confId }),
		]);

		const gmid = decompressId(userId);
		const miembro = interaction.guild.members.cache.get(gmid);
		let confirmationEmbed;
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
					{ name: 'Error', value: `\`\`\`\n${err.message}\n\`\`\`` || '_No hay un mensaje de error disponible_' },
				);

			if(!(err instanceof DiscordAPIError))
				auditError(err, { request: interaction, brief: 'Ha ocurrido un error al bannear un confesante', ping: false });
		}

		return interaction.update({ embeds: [confirmationEmbed], components: [] });
	});

/**
 * Intenta resolver un sistema de confesiones de la BBDD y sus canales relacionados.
 * 
 * Verifica que todos los componentes necesarios para sustentar un sistema de confesiones sean válidos.
 * Si no lo son, falla y devuelve un objeto con `success = false` y un `message` de diagnóstico de error
 * @param {import('discord.js').Interaction} interaction 
 * @returns un objeto con los datos obtenidos
 */
async function getConfessionSystemAndChannels(interaction) {
	/**
	 * 
	 * @param {string} message 
	 * @returns {{ success: false, message: string }}
	 */
	const makeErr = message => ({ success: false, message });

	const confSystem = await ConfessionSystems.findOne({ guildId: interaction.guildId });
	if(!confSystem)
		return makeErr('⚠️ No se ha configurado un sistema de confesiones en este server');
	
	const logChannel = interaction.guild.channels.cache.get(confSystem.logChannelId);
	if(!logChannel || logChannel.type !== ChannelType.GuildText)
		return makeErr('⚠️ No se encontró un canal de auditoría de confesiones válido');

	const confChannel = interaction.guild.channels.cache.get(confSystem.confessionsChannelId);
	if(!confChannel || confChannel.type !== ChannelType.GuildText)
		return makeErr('⚠️ No se encontró un canal de confesiones válido');

	/**@type {{ success: true, confSystem: typeof confSystem, logChannel: TextChannel, confChannel: TextChannel }}*/
	const ret = {
		success: true,
		confSystem,
		logChannel,
		confChannel,
	};

	return ret;
}

module.exports = command;