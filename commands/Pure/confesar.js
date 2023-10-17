//const {  } = require('../../func.js'); //Funciones globales
const { compressId } = require('../../func.js');
const { TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const ConfessionSystems = require('../../localdata/models/confessionSystems.js');
const PendingConfessions = require('../../localdata/models/pendingConfessions.js');
const { CommandManager, CommandMetaFlagsManager, CommandOptionsManager } = require('../Commons/commands.js');

const options = new CommandOptionsManager()
	.addParam('mensaje', 'TEXT', 'para indicar un mensaje de confesión')
	.addFlag('nmv', [ 'nombre', 'mostrar', 'ver' ], 'para indicar si quieres mostrar tu nombre');

const flags = new CommandMetaFlagsManager().add(
	'COMMON',
	'HOURAI',
);

const command = new CommandManager('confesar', flags)
	.setAliases(
		'confesión',
		'confesion',
		'confession',
		'confess',
		'cnf',
		'cf',
	)
	.setBriefDescription('Envía una confesión anónima')
	.setLongDescription(
		'Envía una confesión anónima a ser aprobada para postearse en el canal de confesiones.',
		'Si lo deseas, el mensaje puede mostrar tu `--nombre` luego de ser aprobado.',
	)
	.setOptions(options)
	.setExecution(async (request, input) => {
		const confContent = options.fetchParam(input, 'mensaje', true);
		if(!confContent)
			return request.reply({ content: '⚠️ Debes confesar algo', ephemeral: true });
		
		const nombre = options.fetchFlag(input, 'nombre');
		
		const confId = compressId(request.id);
		const confSystem = await ConfessionSystems.findOne({ guildId: request.guildId });

		if(!confSystem)
			return request.reply({ content: '⚠️ No se ha configurado un sistema de confesiones en este server', ephemeral: true });

		const confession = {
			id: confId,
			channelId: confSystem.confessionsChannelId,
			content: confContent,
			anonymous: !nombre,
		};
		
		const pendingConf = new PendingConfessions(confession);
		confSystem.pending[confSystem.pending.length] = confId;
		confSystem.markModified('pending');

		/**@type {TextChannel}*/
		const logChannel = request.guild.channels.cache.get(confSystem.logChannelId);

		if(!logChannel)
			return request.reply({ content: '⚠️ No se encontró un canal al cual enviar la petición de tu confesión', ephemeral: true });

		const embed = new EmbedBuilder()
			.setAuthor({ name: 'Confesión entrante' })
			.setColor(0x8334eb)
			.addFields(
				{ name: 'Confesado', value: `${confContent}` },
				{ name: '¿Anónimo?', value: nombre ? 'No' : 'Sí' },
			);

		const row = new ActionRowBuilder().addComponents([
			new ButtonBuilder()
				.setCustomId(`confesar_acceptConfession_${confId}`)
				.setEmoji('1163687887120891955')
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId(`confesar_rejectConfession_${confId}`)
				.setEmoji('936531643496288288')
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId(`confesar_timeoutConfessant_${confId}`)
				.setEmoji('935665140601327626')
				.setLabel('Rechazar y Aislar')
				.setStyle(ButtonStyle.Danger),
			new ButtonBuilder()
				.setCustomId(`confesar_banConfessant_${confId}`)
				.setEmoji('935665140601327626')
				.setLabel('Rechazar y Bannear')
				.setStyle(ButtonStyle.Danger),
		]);

		await Promise.all([
			logChannel.send({ embeds: [embed], components: [row] }),
			confSystem.save(),
			pendingConf.save(),
		]);

		console.log({ confContent, nombre });

		return request.reply({
			content: '✅ Confesión enviada',
			ephemeral: true,
		});
	}).setButtonResponse(async function acceptConfession(interaction, confId) {
		const confSystem = await ConfessionSystems.findOne({ guildId: interaction.guildId });

		if(!confSystem)
			return interaction.reply({ content: '⚠️ No se ha configurado un sistema de confesiones en este server', ephemeral: true });

		const index = confSystem.pending.indexOf(confId);

		if(index < 0)
			return interaction.reply({ content: '⚠️ La confesión indicada no está pendiente', ephemeral: true });

		const pendingConf = await PendingConfessions.findOne({ id: confId });

		if(!pendingConf)
			return interaction.reply({ content: '⚠️ La confesión indicada acaba de ser atendida', ephemeral: true });

		//Hacer algo con la confesión pendiente...
		/**@type {TextChannel}*/
		const confChannel = interaction.guild.channels.cache.get(confSystem.confessionsChannelId);

		//ESTO ES DE PRUEBA
		confChannel.send({ content: pendingConf.content });

		confSystem.pending.splice(index, 1);
		confSystem.markModified('pending');
		await Promise.all([
			confSystem.save(),
			pendingConf.deleteOne(),
		]);

		const embed = new EmbedBuilder()
			.setAuthor({ name: 'Confesión aceptada' })
			.setColor(0x8334eb)
			.setDescription('Esta confesión fue aceptada. Aparecerá en el foro de confesiones configurado');

		return Promise.all([
			interaction.message.delete().catch(_ => undefined),
			interaction.reply({ embeds: [embed], ephemeral: true }),
		]);
	}).setButtonResponse(async function rejectConfession(interaction, confId) {
		const confSystem = await ConfessionSystems.findOne({ guildId: interaction.guildId });

		if(!confSystem)
			return interaction.reply({ content: '⚠️ No se ha configurado un sistema de confesiones en este server', ephemeral: true });

		const index = confSystem.pending.indexOf(confId);

		if(index < 0)
			return interaction.reply({ content: '⚠️ La confesión indicada no está pendiente', ephemeral: true });
		
		confSystem.pending.splice(index, 1);
		confSystem.markModified('pending');
		await Promise.all([
			confSystem.save(),
			PendingConfessions.findOneAndDelete({ id: confId }),
		]);

		const embed = new EmbedBuilder()
			.setAuthor({ name: 'Confesión rechazada' })
			.setColor(0x8334eb)
			.setDescription('Esta confesión fue rechazada. No se le notificará al autor');

		return Promise.all([
			interaction.message.delete().catch(_ => undefined),
			interaction.reply({ embeds: [embed], ephemeral: true }),
		]);
	});

module.exports = command;