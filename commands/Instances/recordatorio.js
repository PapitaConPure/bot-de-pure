const { Command, CommandTags, CommandOptions, CommandParam, CommandFlagExpressive } = require('../Commons/');
const { p_pure } = require('../../utils/prefixes');
const { Translator } = require('../../i18n');
const { parseDateFromNaturalLanguage, parseTimeFromNaturalLanguage, addTime, utcStartOfTzToday } = require('../../utils/datetime');
const { MessageFlags, ContainerBuilder, ButtonBuilder, ButtonStyle, SeparatorSpacingSize, TextDisplayBuilder, ModalBuilder, TextInputStyle, ChannelType, TextInputBuilder } = require('discord.js');
const { shortenText, compressId, decompressId } = require('../../func');
const UserConfigs = require('../../models/userconfigs').default;
const Reminder = require('../../models/reminders').default;
const { isValid, addDays, isBefore, addMinutes, getUnixTime } = require('date-fns');
const { scheduleReminder } = require('../../systems/others/remindersScheduler');
const { UTCDate } = require('@date-fns/utc');
const { toUtcOffset, sanitizeTzCode } = require('../../utils/timezones');
const { tenshiColor } = require('../../data/globalProps');

const maxReminderCountPerUser = 5;
const maxReminderContentLength = 960;

/**
 * Crea un contenedor con un listado CRUD de recordatorios
 * @param {string} compressedUserId 
 * @param {Translator} translator 
 */
async function makeRemindersListContainer(compressedUserId, translator) {
	const reminders = await Reminder.find({ userId: compressedUserId });

	const container = new ContainerBuilder()
		.setAccentColor(tenshiColor)
		.addTextDisplayComponents(textDisplay =>
			textDisplay.setContent(translator.getText('recordarRemindersListTitle'))
		);

	if(!reminders?.length) {
		container
			.addSeparatorComponents(separator => separator.setDivider(true))
			.addTextDisplayComponents(textDisplay =>
				textDisplay.setContent(translator.getText('recordarNoReminders'))
			);
	} else {
		reminders.forEach(reminder => {
			const unix = getUnixTime(reminder.date);
			container
				.addSeparatorComponents(separator => separator.setDivider(true))
				.addSectionComponents(section =>
					section
						.addTextDisplayComponents(textDisplay =>
							textDisplay.setContent([
								`-# <:bell:1458732220016627734> <t:${unix}:R> → <#${decompressId(reminder.channelId)}> <:clock:1357498813144760603> <t:${unix}:t>`,
								shortenText(reminder.content, 64),
							].join('\n'))
						)
						.setButtonAccessory(
							new ButtonBuilder()
								.setCustomId(`recordar_viewReminder_${reminder._id}_${compressedUserId}`)
								.setEmoji('1458474431839076569')
								.setLabel(translator.getText('buttonView'))
								.setStyle(ButtonStyle.Secondary)
						)
				);
		});
	}

	container
		.addSeparatorComponents(separator =>
			separator
				.setDivider(true)
				.setSpacing(SeparatorSpacingSize.Large)
		)
		.addActionRowComponents(actionRow =>
			actionRow
				.addComponents(
					new ButtonBuilder()
						.setCustomId(`recordar_promptAddReminder_${compressedUserId}`)
						.setEmoji('1458427425271844958')
						.setLabel(translator.getText('buttonCreate'))
						.setStyle(ButtonStyle.Success)
						.setDisabled(reminders.length >= maxReminderCountPerUser),
					new ButtonBuilder()
						.setCustomId(`recordar_refreshRemindersList_${compressedUserId}`)
						.setEmoji('1357001126674825379')
						.setLabel(translator.getText('buttonRefresh'))
						.setStyle(ButtonStyle.Primary),
				)
		)
		.addTextDisplayComponents(textDisplay =>
			textDisplay.setContent(
				translator.getText('recordarRemindersListFooter', reminders.length, maxReminderCountPerUser)
			)
		);

	return container;
}

/**
 * Crea un contenedor en base al recordatorio indicado, con opciones para editar y eliminar
 * @param {import('../../models/reminders').ReminderDocument} reminder Recordatorio a mostrar
 * @param {Translator} translator 
 * @param {string} [title] Título alternativo
 */
function makeReminderContainer(reminder, translator, title = undefined) {
	const container = new ContainerBuilder()
		.setAccentColor(tenshiColor)
		.addTextDisplayComponents(
			textDisplay => textDisplay.setContent(title ?? translator.getText('recordarReminderCreateTitle')),
			textDisplay => textDisplay.setContent(
				translator.getText('recordarReminderCreateDateDescription', getUnixTime(reminder.date))
			),
		)
		.addSeparatorComponents(separator => separator.setDivider(false))
		.addTextDisplayComponents(textDisplay =>
			textDisplay.setContent(
				`${translator.getText('recordarReminderCreateContentSubtitle')}\n${reminder.content}`
			)
		)
		.addSeparatorComponents(separator => separator.setDivider(false))
		.addActionRowComponents(actionRow =>
			actionRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`recordar_promptEditReminder_${reminder._id}_${reminder.userId}`)
					.setEmoji('1288444896331698241')
					.setLabel(translator.getText('buttonEdit'))
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId(`recordar_deleteReminder_${reminder._id}_${reminder.userId}`)
					.setEmoji('1458130451834081513')
					.setLabel(translator.getText('buttonDelete'))
					.setStyle(ButtonStyle.Danger),
			)
		);

	return container;
}

/**
 * Crea un formulario modal para crear o editar un recordatorio
 * @param {import('../Commons/typings').AnyRequest} request 
 * @param {Translator} translator 
 * @param {number} utcOffset 
 * @param {import('../../models/reminders').ReminderDocument} reminder 
 */
function makeReminderModal(request, translator, utcOffset, reminder = undefined) {
	const reminderId = reminder?._id;
	const reminderLocalizedDate = new UTCDate(addMinutes(reminder?.date ?? new Date(Date.now()), utcOffset));

	const modal = new ModalBuilder()
		.setCustomId(reminder ? `reminder_editReminder_${reminderId}` : 'reminder_addReminder')
		.setTitle(translator.getText(reminderId ? 'recordarEditReminderModalTitle' : 'recordarCreateReminderModalTitle'));

	if(reminderId)
		modal.addTextDisplayComponents(textDisplay =>
			textDisplay.setContent(`-# ${reminderId ? `#${decompressId(reminderId)}` : 'NUEVO RECORDATORIO'}`)
		);

	modal 
		.addLabelComponents(
			label => label
				.setLabel(translator.getText('reminderEditReminderModalDateLabel'))
				.setDescription(translator.getText('reminderEditReminderModalDatePlaceholder'))
				.setTextInputComponent(input =>
					input
						.setCustomId('date')
						.setMinLength(1)
						.setMaxLength(16)
						.setValue(reminderLocalizedDate.toLocaleDateString(translator.locale))
						.setPlaceholder(translator.getText('reminderEditReminderModalDatePlaceholder'))
						.setStyle(TextInputStyle.Short)
						.setRequired(true)
				),
			label => label
				.setLabel(translator.getText('reminderEditReminderModalTimeLabel'))
				.setDescription(translator.getText('reminderEditReminderModalTimePlaceholder'))
				.setTextInputComponent(input =>
					input
						.setCustomId('time')
						.setMinLength(1)
						.setMaxLength(20)
						.setValue(reminderLocalizedDate.toLocaleTimeString(translator.locale))
						.setPlaceholder(translator.getText('reminderEditReminderModalTimePlaceholder'))
						.setStyle(TextInputStyle.Short)
						.setRequired(true)
				),
			label => label
				.setLabel(translator.getText('reminderEditReminderModalChannelLabel'))
				.setChannelSelectMenuComponent(input =>
					input
						.setCustomId('channel')
						.setChannelTypes(
							ChannelType.GuildText,
							ChannelType.GuildVoice,
							ChannelType.GuildAnnouncement,
							ChannelType.PublicThread,
							ChannelType.PrivateThread,
						)
						.setDefaultChannels([reminder?.channelId ? decompressId(reminder.channelId) : request.channelId])
						.setRequired(true)
				),
		);
	
	const contentTextInput = new TextInputBuilder()
		.setCustomId('content')
		.setMinLength(1)
		.setMaxLength(maxReminderContentLength)
		.setRequired(true)
		.setStyle(TextInputStyle.Paragraph);

	if(reminder?.content)
		contentTextInput.setValue(reminder.content);

	modal.addLabelComponents(
		label => label
			.setLabel(translator.getText('reminderEditReminderModalContentLabel'))
			.setTextInputComponent(contentTextInput),
	);
	
	return modal;
}

/**
 * @param {Date} date
 * @param {string} sanitizedTzCode
 */
const validateDate = (date, sanitizedTzCode) => isValid(date) && !isBefore(date, utcStartOfTzToday(sanitizedTzCode));

/**@param {Date} time*/
const validateTime = (time) => isValid(time) && Math.abs(+time) < (+addDays(new Date(0), 2));

/**@param {Date} datetime*/
const isReminderLateEnough = (datetime) => {
	const inAMinute = addMinutes(new Date(Date.now()), 1);
	return datetime >= inAMinute;
};

const tags = new CommandTags().add('COMMON');

const options = new CommandOptions()
	.addOptions(
		new CommandParam('recordatorio', 'TEXT')
			.setDesc('para indicar el contenido a recordar')
			.setOptional(true),
		new CommandFlagExpressive('dmy', 'DATE')
			.setShort('fd')
			.setLong([ 'fecha', 'date' ])
			.setDesc('para indicar la fecha en la cual emitir el recordatorio'),
		new CommandFlagExpressive('hms', 'TIME')
			.setShort('ht')
			.setLong([ 'hora', 'hour', 'time' ])
			.setDesc('para indicar la fecha en la cual emitir el recordatorio'),
		new CommandFlagExpressive('tz', 'TEXT')
			.setShort('lzt')
			.setLong(['huso', 'franja', 'zona', 'zone', 'timezone', 'offset'])
			.setDesc('para especificar un huso horario de referencia'),
	);

const command = new Command('recordatorio', tags)
	.setAliases(
		'recordar', 'recordatorios', 'recordarme', 'recuerdame', 'recuérdame', 'alarma',
		'reminder', 'reminders', 'remindme', 'alarm',
	)
	.setLongDescription(
		'Establece un `<recordatorio>` a emitir a la `--fecha` y/o `--hora` especificada.',
		'Se emplea el huso horario que hayas establecido en tu **configuración de usuario** ó UTC+0.',
		'',
		'Si usas el comando sin especificar opciones, te mostraré un editor de tus recordatorios pendientes.',
	)
	.addWikiRow(
		new ButtonBuilder()
			.setCustomId('ayuda_showCommand_yo')
			.setEmoji('1369424059871395950')
			.setLabel('¿Cómo indico mi huso horario?')
			.setStyle(ButtonStyle.Primary),
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const userId = request.userId;
		const compressedUserId = compressId(userId);
		const [ translator, userConfigs] = await Promise.all([
			Translator.from(request),
			UserConfigs.findOne({ userId }),
		]);

		if(!userConfigs)
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('userConfigRecommended', p_pure(request)),
			});

		const tzCode = args.parseFlagExpr('huso')
			?? userConfigs.tzCode
			?? 'UTC';
		const sanitizedTzCode = sanitizeTzCode(tzCode);
		const utcOffset = toUtcOffset(sanitizedTzCode);

		const dateStr = args.parseFlagExpr('fecha');
		const timeStr = args.parseFlagExpr('hora');
		const reminderContent = args.getString('recordatorio', true);

		if(!dateStr && !timeStr) {
			if(reminderContent)
				return request.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('recordarDateOrTimeRequired'),
				});

			return request.reply({
				flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
				components: [await makeRemindersListContainer(compressedUserId, translator)],
			});
		}

		if(reminderContent.length > 960)
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('recordarReminderContentTooLong'),
			});

		const date = parseDateFromNaturalLanguage(dateStr, translator.locale) ?? utcStartOfTzToday(sanitizedTzCode);
		if(!validateDate(date, sanitizedTzCode))
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidDate'),
			});

		const time = parseTimeFromNaturalLanguage(timeStr, utcOffset) ?? addMinutes(new Date(0), -utcOffset);
		if(!validateTime(time))
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidTime'),
			});

		let datetime = addTime(date, time);
		
		if(!dateStr && !isReminderLateEnough(datetime))
			datetime = addDays(datetime, 1);
		
		if(!isReminderLateEnough(datetime))
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('recordarReminderTooSoon', getUnixTime(datetime)),
			});

		const reminderCount = (await Reminder.find({ userId: compressedUserId })).length;
		if(reminderCount > maxReminderCountPerUser)
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('recordarTooManyReminders'),
			});

		await request.deferReply();

		const reminderId = compressId(request.id);
		const reminder = new Reminder({
			_id: reminderId,
			userId: compressedUserId,
			channelId: compressId(request.channelId),
			content: reminderContent,
			date: datetime,
		});

		await reminder.save();
		scheduleReminder(reminder);
		
		return request.editReply({
			flags: MessageFlags.IsComponentsV2,
			components: [makeReminderContainer(reminder, translator)],
		});
	})
	.setButtonResponse(async function viewReminder(interaction, reminderId) {
		const [ reminder, translator ] = await Promise.all([
			Reminder.findById(reminderId),
			Translator.from(interaction),
			interaction.deferReply({
				flags: MessageFlags.Ephemeral,
			}),
		]);

		if(!reminder)
			return interaction.editReply({
				content: translator.getText('recordarReminderNotFound'),
			});
		
		return interaction.editReply({
			flags: MessageFlags.IsComponentsV2,
			components: [makeReminderContainer(reminder, translator)],
		});
	}, { userFilterIndex: 1 })
	.setButtonResponse(async function promptAddReminder(interaction) {
		const userId = interaction.user.id;
		const [ translator, userConfigs ] = await Promise.all([
			Translator.from(interaction),
			UserConfigs.findOne({ userId }),
		]);

		if(!userConfigs)
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('userConfigRecommended', p_pure(interaction.guildId)),
			});

		const tzCode = userConfigs.tzCode ?? 'Etc/UTC';
		const sanitizedTzCode = sanitizeTzCode(tzCode);
		const utcOffset = toUtcOffset(sanitizedTzCode);

		const modal = makeReminderModal(interaction, translator, utcOffset);

		return interaction.showModal(modal);
	}, { userFilterIndex: 0 })
	.setButtonResponse(async function promptEditReminder(interaction, reminderId) {
		const userId = interaction.user.id;
		const [ reminder, translator, userConfigs ] = await Promise.all([
			Reminder.findById(reminderId),
			Translator.from(interaction),
			UserConfigs.findOne({ userId }),
		]);

		if(!userConfigs)
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('userConfigRecommended', p_pure(interaction.guildId)),
			});

		const tzCode = userConfigs.tzCode ?? 'Etc/UTC';
		const sanitizedTzCode = sanitizeTzCode(tzCode);
		const utcOffset = toUtcOffset(sanitizedTzCode);

		if(!reminder)
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('recordarReminderNotFound'),
			});

		const modal = makeReminderModal(interaction, translator, utcOffset, reminder);

		return interaction.showModal(modal);
	}, { userFilterIndex: 1 })
	.setModalResponse(async function addReminder(interaction) {
		const userId = interaction.user.id;
		const compressedUserId = compressId(userId);
		const [ translator, userConfigs ] = await Promise.all([
			Translator.from(interaction),
			UserConfigs.findOne({ userId }),
			interaction.deferUpdate(),
		]);

		if(!userConfigs)
			return interaction.editReply({
				content: translator.getText('userConfigRecommended', p_pure(interaction.guildId)),
			});

		const tzCode = userConfigs.tzCode ?? 'UTC';
		const sanitizedTzCode = sanitizeTzCode(tzCode);
		const utcOffset = toUtcOffset(sanitizedTzCode);

		const dateStr = interaction.fields.getTextInputValue('date');
		const timeStr = interaction.fields.getTextInputValue('time');
		const channel = interaction.fields.getSelectedChannels('channel')?.first();
		const reminderContent = interaction.fields.getTextInputValue('content');

		const informIssue = async (/**@type {string}*/content) => {
			await interaction.editReply({
				components: [await makeRemindersListContainer(compressedUserId, translator)],
			});
			await interaction.followUp({
				flags: MessageFlags.Ephemeral,
				content,
			});
		}

		if(reminderContent.length > 960)
			return informIssue(translator.getText('recordarReminderContentTooLong'));

		if(!channel?.isSendable() || !channel.isTextBased() || channel.isDMBased())
			return informIssue(translator.getText('invalidChannel'));

		const date = parseDateFromNaturalLanguage(dateStr, translator.locale, sanitizedTzCode);
		if(!validateDate(date, sanitizedTzCode))
			return informIssue(translator.getText('invalidDate'));

		const time = parseTimeFromNaturalLanguage(timeStr, utcOffset);
		if(!validateTime(time))
			return informIssue(translator.getText('invalidTime'));

		const datetime = addTime(date, time);
		if(!isReminderLateEnough(datetime))
			return informIssue(translator.getText('recordarReminderTooSoon', getUnixTime(datetime)));

		const reminderCount = (await Reminder.find({ userId: compressedUserId })).length;
		if(reminderCount > maxReminderCountPerUser)
			return informIssue(translator.getText('recordarTooManyReminders'));

		const reminderId = compressId(interaction.id);
		const reminder = new Reminder({
			_id: reminderId,
			userId: compressedUserId,
			channelId: compressId(channel.id),
			content: reminderContent,
			date: datetime,
		});

		await reminder.save();
		scheduleReminder(reminder);
		
		await interaction.editReply({
			components: [await makeRemindersListContainer(compressedUserId, translator)],
		});

		return interaction.followUp({
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
			components: [makeReminderContainer(reminder, translator)],
		});
	})
	.setModalResponse(async function editReminder(interaction, reminderId) {
		const [ reminder, translator, userConfigs ] = await Promise.all([
			Reminder.findById(reminderId),
			Translator.from(interaction),
			UserConfigs.findOne({ userId: interaction.user.id }),
		]);

		if(!userConfigs)
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('userConfigRecommended', p_pure(interaction.guildId)),
			});

		const tzCode = userConfigs.tzCode ?? 'Etc/UTC';
		const sanitizedTzCode = sanitizeTzCode(tzCode);
		const utcOffset = toUtcOffset(sanitizedTzCode);

		if(!reminder)
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('recordarReminderNotFound'),
			});

		const dateStr = interaction.fields.getTextInputValue('date');
		const timeStr = interaction.fields.getTextInputValue('time');
		const channel = interaction.fields.getSelectedChannels('channel')?.first();
		const reminderContent = interaction.fields.getTextInputValue('content');
		
		if(reminderContent.length > 960)
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('recordarReminderContentTooLong'),
			});
			
		if(!channel?.isSendable() || !channel.isTextBased() || channel.isDMBased())
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidChannel'),
			});

		const date = parseDateFromNaturalLanguage(dateStr, translator.locale, sanitizedTzCode);
		if(!validateDate(date, sanitizedTzCode))
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidDate'),
			});

		const time = parseTimeFromNaturalLanguage(timeStr, utcOffset);
		if(!validateTime(time))
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidTime'),
			});

		const datetime = addTime(date, time);
		if(!isReminderLateEnough(datetime)) {
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('recordarReminderTooSoon', getUnixTime(datetime)),
			});
		}

		reminder.date = datetime;
		reminder.content = reminderContent;
		reminder.channelId = compressId(channel.id);
		reminder.markModified('date');

		await interaction.deferUpdate();

		await reminder.save();
		scheduleReminder(reminder);

		return interaction.editReply({
			components: [makeReminderContainer(reminder, translator, translator.getText('recordarReminderEditSuccessTitle'))],
		});
	})
	.setButtonResponse(async function deleteReminder(interaction, reminderId) {
		const [ reminder, translator ] = await Promise.all([
			Reminder.findById(reminderId),
			Translator.from(interaction),
		]);

		if(!reminder)
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('recordarReminderNotFound'),
			});

		await interaction.deferUpdate(),

		await reminder.deleteOne();

		const textDisplay = new TextDisplayBuilder()
			.setContent(translator.getText('recordarReminderDeleteSuccess'));

		return interaction.editReply({
			components: [textDisplay],
		});
	}, { userFilterIndex: 1 })
	.setButtonResponse(async function refreshRemindersList(interaction, compressedUserId) {
		const [ translator ] = await Promise.all([
			Translator.from(interaction),
			interaction.deferUpdate(),
		]);

		return interaction.editReply({
			components: [await makeRemindersListContainer(compressedUserId, translator)],
		});
	}, { userFilterIndex: 0 });

module.exports = command;
