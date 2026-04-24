import { UTCDate } from '@date-fns/utc';
import { addDays, addMinutes, getUnixTime, isBefore, isValid } from 'date-fns';
import {
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	ContainerBuilder,
	MessageFlags,
	ModalBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';
import type { AnyRequest } from 'types/commands';
import { tenshiColor } from '@/data/globalProps';
import { Translator } from '@/i18n';
import ReminderModel, { type ReminderDocument } from '@/models/reminders';
import UserConfigModel from '@/models/userconfigs';
import { clearScheduledReminder, scheduleReminder } from '@/systems/others/remindersScheduler';
import {
	addTime,
	parseDateFromNaturalLanguage,
	parseTimeFromNaturalLanguage,
	utcStartOfTzToday,
} from '@/utils/datetime';
import { getBotEmoji, getBotEmojiResolvable } from '@/utils/emojis';
import { compressId, decompressId } from '@/utils/encoding';
import { shortenText } from '@/utils/misc';
import { p_pure } from '@/utils/prefixes';
import { sanitizeTzCode, toUtcOffset } from '@/utils/timezones';
import {
	Command,
	CommandFlagExpressive,
	CommandOptions,
	CommandParam,
	CommandTags,
} from '../commons';

const maxReminderCountPerUser = 5;
const maxReminderContentLength = 960;

/**@description Crea un contenedor con un listado CRUD de recordatorios.*/
async function makeRemindersListContainer(compressedUserId: string, translator: Translator) {
	const reminders = await ReminderModel.find({ userId: compressedUserId });

	const container = new ContainerBuilder()
		.setAccentColor(tenshiColor)
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(translator.getText('recordarRemindersListTitle')),
		);

	if (!reminders?.length) {
		container
			.addSeparatorComponents((separator) => separator.setDivider(true))
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(translator.getText('recordarNoReminders')),
			);
	} else {
		reminders.forEach((reminder) => {
			const unix = getUnixTime(reminder.date);
			container
				.addSeparatorComponents((separator) => separator.setDivider(true))
				.addSectionComponents((section) =>
					section
						.addTextDisplayComponents((textDisplay) =>
							textDisplay.setContent(
								[
									`-# ${getBotEmoji('bellAccent')} <t:${unix}:R> → <#${decompressId(reminder.channelId)}> ${getBotEmoji('clockAccent')} <t:${unix}:t>`,
									shortenText(reminder.content, 64),
								].join('\n'),
							),
						)
						.setButtonAccessory(
							new ButtonBuilder()
								.setCustomId(
									`recordar_viewReminder_${reminder._id}_${compressedUserId}`,
								)
								.setEmoji(getBotEmojiResolvable('eyeAccent'))
								.setLabel(translator.getText('buttonView'))
								.setStyle(ButtonStyle.Secondary),
						),
				);
		});
	}

	container
		.addSeparatorComponents((separator) =>
			separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large),
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`recordar_promptAddReminder_${compressedUserId}`)
					.setEmoji(getBotEmojiResolvable('plusWhite'))
					.setLabel(translator.getText('buttonCreate'))
					.setStyle(ButtonStyle.Success)
					.setDisabled(reminders.length >= maxReminderCountPerUser),
				new ButtonBuilder()
					.setCustomId(`recordar_refreshRemindersList_${compressedUserId}`)
					.setEmoji(getBotEmojiResolvable('refreshWhite'))
					.setLabel(translator.getText('buttonRefresh'))
					.setStyle(ButtonStyle.Primary),
			),
		)
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(
				translator.getText(
					'recordarRemindersListFooter',
					reminders.length,
					maxReminderCountPerUser,
				),
			),
		);

	return container;
}

/**
 * @description Crea un contenedor en base al recordatorio indicado, con opciones para editar y eliminar.
 * @param reminder Recordatorio a mostrar.
 * @param title Título alternativo.
 */
function makeReminderContainer(
	reminder: import('@/models/reminders').ReminderDocument,
	translator: Translator,
	title?: string,
) {
	const container = new ContainerBuilder()
		.setAccentColor(tenshiColor)
		.addTextDisplayComponents(
			(textDisplay) =>
				textDisplay.setContent(title ?? translator.getText('recordarReminderCreateTitle')),
			(textDisplay) =>
				textDisplay.setContent(
					translator.getText(
						'recordarReminderCreateDateDescription',
						getUnixTime(reminder.date),
					),
				),
		)
		.addSeparatorComponents((separator) => separator.setDivider(false))
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(
				`${translator.getText('recordarReminderCreateContentSubtitle')}\n${reminder.content}`,
			),
		)
		.addSeparatorComponents((separator) => separator.setDivider(false))
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`recordar_promptEditReminder_${reminder._id}_${reminder.userId}`)
					.setEmoji(getBotEmojiResolvable('pencilWhite'))
					.setLabel(translator.getText('buttonEdit'))
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId(`recordar_deleteReminder_${reminder._id}_${reminder.userId}`)
					.setEmoji(getBotEmojiResolvable('trashWhite'))
					.setLabel(translator.getText('buttonDelete'))
					.setStyle(ButtonStyle.Danger),
			),
		);

	return container;
}

/**@description Crea un formulario modal para crear o editar un recordatorio.*/
function makeReminderModal(
	request: AnyRequest,
	translator: Translator,
	utcOffset: number,
	reminder: ReminderDocument | undefined = undefined,
) {
	const reminderId = reminder?._id;
	const reminderLocalizedDate = new UTCDate(
		addMinutes(reminder?.date ?? new Date(Date.now()), utcOffset),
	);

	const modal = new ModalBuilder()
		.setCustomId(reminder ? `reminder_editReminder_${reminderId}` : 'reminder_addReminder')
		.setTitle(
			translator.getText(
				reminderId ? 'recordarEditReminderModalTitle' : 'recordarCreateReminderModalTitle',
			),
		);

	if (reminderId)
		modal.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(
				`-# ${reminderId ? `#${decompressId(reminderId)}` : 'NUEVO RECORDATORIO'}`,
			),
		);

	modal.addLabelComponents(
		(label) =>
			label
				.setLabel(translator.getText('reminderEditReminderModalDateLabel'))
				.setDescription(translator.getText('reminderEditReminderModalDatePlaceholder'))
				.setTextInputComponent((input) =>
					input
						.setCustomId('date')
						.setMinLength(1)
						.setMaxLength(16)
						.setValue(reminderLocalizedDate.toLocaleDateString(translator.locale))
						.setPlaceholder(
							translator.getText('reminderEditReminderModalDatePlaceholder'),
						)
						.setStyle(TextInputStyle.Short)
						.setRequired(true),
				),
		(label) =>
			label
				.setLabel(translator.getText('reminderEditReminderModalTimeLabel'))
				.setDescription(translator.getText('reminderEditReminderModalTimePlaceholder'))
				.setTextInputComponent((input) =>
					input
						.setCustomId('time')
						.setMinLength(1)
						.setMaxLength(20)
						.setValue(reminderLocalizedDate.toLocaleTimeString(translator.locale))
						.setPlaceholder(
							translator.getText('reminderEditReminderModalTimePlaceholder'),
						)
						.setStyle(TextInputStyle.Short)
						.setRequired(true),
				),
		(label) =>
			label
				.setLabel(translator.getText('reminderEditReminderModalChannelLabel'))
				.setChannelSelectMenuComponent((input) =>
					input
						.setCustomId('channel')
						.setChannelTypes(
							ChannelType.GuildText,
							ChannelType.GuildVoice,
							ChannelType.GuildAnnouncement,
							ChannelType.PublicThread,
							ChannelType.PrivateThread,
						)
						.setDefaultChannels([
							reminder?.channelId
								? decompressId(reminder.channelId)
								: request.channelId,
						])
						.setRequired(true),
				),
	);

	const contentTextInput = new TextInputBuilder()
		.setCustomId('content')
		.setMinLength(1)
		.setMaxLength(maxReminderContentLength)
		.setRequired(true)
		.setStyle(TextInputStyle.Paragraph);

	if (reminder?.content) contentTextInput.setValue(reminder.content);

	modal.addLabelComponents((label) =>
		label
			.setLabel(translator.getText('reminderEditReminderModalContentLabel'))
			.setTextInputComponent(contentTextInput),
	);

	return modal;
}

const validateDate = (date: Date | null | undefined, sanitizedTzCode: string): date is Date =>
	isValid(date) && !isBefore(date as Date, utcStartOfTzToday(sanitizedTzCode));

const validateTime = (time: Date | null | undefined): time is Date =>
	isValid(time) && Math.abs(+(time as Date)) < +addDays(new Date(0), 2);

const isReminderLateEnough = (datetime: Date) => {
	const inAMinute = addMinutes(new Date(Date.now()), 1);
	return datetime >= inAMinute;
};

const options = new CommandOptions().addOptions(
	new CommandParam('recordatorio', 'TEXT')
		.setDesc('para indicar el contenido a recordar')
		.setOptional(true),
	new CommandFlagExpressive('dmy', 'DATE')
		.setShort('fd')
		.setLong(['fecha', 'date'])
		.setDesc('para indicar la fecha en la cual emitir el recordatorio'),
	new CommandFlagExpressive('hms', 'TIME')
		.setShort('ht')
		.setLong(['hora', 'hour', 'time'])
		.setDesc('para indicar la fecha en la cual emitir el recordatorio'),
	new CommandFlagExpressive('tz', 'TEXT')
		.setShort('lzt')
		.setLong(['huso', 'franja', 'zona', 'zone', 'timezone', 'offset'])
		.setDesc('para especificar un huso horario de referencia'),
);

const tags = new CommandTags().add('COMMON');

const command = new Command(
	{
		es: 'recordatorio',
		en: 'remind',
		ja: 'remind',
	},
	tags,
)
	.setAliases(
		'recordar',
		'recordatorios',
		'recordarme',
		'recuerdame',
		'recuérdame',
		'alarma',
		'reminder',
		'reminders',
		'remindme',
		'alarm',
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
			.setEmoji(getBotEmojiResolvable('commandPrimary'))
			.setLabel('¿Cómo indico mi huso horario?')
			.setStyle(ButtonStyle.Primary),
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const userId = request.userId;
		const compressedUserId = compressId(userId);
		const [translator, userConfigs] = await Promise.all([
			Translator.from(request),
			UserConfigModel.findOne({ userId }),
		]);

		if (!userConfigs)
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('userConfigRecommended', p_pure(request)),
			});

		const tzCode = args.parseFlagExpr('huso') ?? userConfigs.tzCode ?? 'UTC';
		const sanitizedTzCode = sanitizeTzCode(tzCode);
		const utcOffset = toUtcOffset(sanitizedTzCode) ?? 0;

		const dateStr = args.parseFlagExpr('fecha');
		const timeStr = args.parseFlagExpr('hora');
		const reminderContent = args.getString('recordatorio', true);

		if (!dateStr && !timeStr) {
			if (reminderContent)
				return request.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('recordarDateOrTimeRequired'),
				});

			return request.reply({
				flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
				components: [await makeRemindersListContainer(compressedUserId, translator)],
			});
		}

		if ((reminderContent?.length ?? 0) > 960)
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('recordarReminderContentTooLong'),
			});

		const date =
			(dateStr ? parseDateFromNaturalLanguage(dateStr, translator.locale) : undefined)
			?? utcStartOfTzToday(sanitizedTzCode);
		if (!validateDate(date, sanitizedTzCode))
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidDate'),
			});

		const time =
			(timeStr ? parseTimeFromNaturalLanguage(timeStr, utcOffset) : undefined)
			?? addMinutes(new Date(0), -utcOffset);
		if (!validateTime(time))
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidTime'),
			});

		let datetime = addTime(date, time);

		if (!dateStr && !isReminderLateEnough(datetime)) datetime = addDays(datetime, 1);

		if (!isReminderLateEnough(datetime))
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('recordarReminderTooSoon', getUnixTime(datetime)),
			});

		const reminderCount = (await ReminderModel.find({ userId: compressedUserId })).length;
		if (reminderCount > maxReminderCountPerUser)
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('recordarTooManyReminders'),
			});

		await request.deferReply();

		const reminderId = compressId(request.id);
		const reminder = new ReminderModel({
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
	.setButtonResponse(
		async function viewReminder(interaction, reminderId) {
			const [reminder, translator] = await Promise.all([
				ReminderModel.findById(reminderId),
				Translator.from(interaction),
				interaction.deferReply({
					flags: MessageFlags.Ephemeral,
				}),
			]);

			if (!reminder)
				return interaction.editReply({
					content: translator.getText('recordarReminderNotFound'),
				});

			return interaction.editReply({
				flags: MessageFlags.IsComponentsV2,
				components: [makeReminderContainer(reminder, translator)],
			});
		},
		{ userFilterIndex: 1 },
	)
	.setButtonResponse(
		async function promptAddReminder(interaction) {
			const userId = interaction.user.id;
			const [translator, userConfigs] = await Promise.all([
				Translator.from(interaction),
				UserConfigModel.findOne({ userId }),
			]);

			if (!userConfigs)
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText(
						'userConfigRecommended',
						p_pure(interaction.guildId),
					),
				});

			const tzCode = userConfigs.tzCode ?? 'Etc/UTC';
			const sanitizedTzCode = sanitizeTzCode(tzCode);
			const utcOffset = toUtcOffset(sanitizedTzCode) ?? 0;

			const modal = makeReminderModal(interaction, translator, utcOffset);

			return interaction.showModal(modal);
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(
		async function promptEditReminder(interaction, reminderId) {
			const userId = interaction.user.id;
			const [reminder, translator, userConfigs] = await Promise.all([
				ReminderModel.findById(reminderId),
				Translator.from(interaction),
				UserConfigModel.findOne({ userId }),
			]);

			if (!userConfigs)
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText(
						'userConfigRecommended',
						p_pure(interaction.guildId),
					),
				});

			const tzCode = userConfigs.tzCode ?? 'Etc/UTC';
			const sanitizedTzCode = sanitizeTzCode(tzCode);
			const utcOffset = toUtcOffset(sanitizedTzCode) ?? 0;

			if (!reminder)
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('recordarReminderNotFound'),
				});

			const modal = makeReminderModal(interaction, translator, utcOffset, reminder);

			return interaction.showModal(modal);
		},
		{ userFilterIndex: 1 },
	)
	.setModalResponse(async function addReminder(interaction) {
		const userId = interaction.user.id;
		const compressedUserId = compressId(userId);
		const [translator, userConfigs] = await Promise.all([
			Translator.from(interaction),
			UserConfigModel.findOne({ userId }),
			interaction.deferUpdate(),
		]);

		if (!userConfigs)
			return interaction.editReply({
				content: translator.getText('userConfigRecommended', p_pure(interaction.guildId)),
			});

		const tzCode = userConfigs.tzCode ?? 'UTC';
		const sanitizedTzCode = sanitizeTzCode(tzCode);
		const utcOffset = toUtcOffset(sanitizedTzCode) ?? 0;

		const dateStr = interaction.fields.getTextInputValue('date');
		const timeStr = interaction.fields.getTextInputValue('time');
		const channel = interaction.fields.getSelectedChannels('channel')?.first();
		const reminderContent = interaction.fields.getTextInputValue('content');

		const informIssue = async (/**@type {string}*/ content: string) => {
			await interaction.editReply({
				components: [await makeRemindersListContainer(compressedUserId, translator)],
			});
			await interaction.followUp({
				flags: MessageFlags.Ephemeral,
				content,
			});
		};

		if (reminderContent.length > 960)
			return informIssue(translator.getText('recordarReminderContentTooLong'));

		if (!channel?.isSendable() || !channel.isTextBased() || channel.isDMBased())
			return informIssue(translator.getText('invalidChannel'));

		const date = parseDateFromNaturalLanguage(dateStr, translator.locale, sanitizedTzCode);
		if (!validateDate(date, sanitizedTzCode))
			return informIssue(translator.getText('invalidDate'));

		const time = parseTimeFromNaturalLanguage(timeStr, utcOffset);
		if (!validateTime(time)) return informIssue(translator.getText('invalidTime'));

		const datetime = addTime(date, time);
		if (!isReminderLateEnough(datetime))
			return informIssue(
				translator.getText('recordarReminderTooSoon', getUnixTime(datetime)),
			);

		const reminderCount = (await ReminderModel.find({ userId: compressedUserId })).length;
		if (reminderCount > maxReminderCountPerUser)
			return informIssue(translator.getText('recordarTooManyReminders'));

		const reminderId = compressId(interaction.id);
		const reminder = new ReminderModel({
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
		const [reminder, translator, userConfigs] = await Promise.all([
			ReminderModel.findById(reminderId),
			Translator.from(interaction),
			UserConfigModel.findOne({ userId: interaction.user.id }),
		]);

		if (!userConfigs)
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('userConfigRecommended', p_pure(interaction.guildId)),
			});

		const tzCode = userConfigs.tzCode ?? 'Etc/UTC';
		const sanitizedTzCode = sanitizeTzCode(tzCode);
		const utcOffset = toUtcOffset(sanitizedTzCode) ?? 0;

		if (!reminder)
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('recordarReminderNotFound'),
			});

		const dateStr = interaction.fields.getTextInputValue('date');
		const timeStr = interaction.fields.getTextInputValue('time');
		const channel = interaction.fields.getSelectedChannels('channel')?.first();
		const reminderContent = interaction.fields.getTextInputValue('content');

		if (reminderContent.length > 960)
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('recordarReminderContentTooLong'),
			});

		if (!channel?.isSendable() || !channel.isTextBased() || channel.isDMBased())
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidChannel'),
			});

		const date = parseDateFromNaturalLanguage(dateStr, translator.locale, sanitizedTzCode);
		if (!validateDate(date, sanitizedTzCode))
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidDate'),
			});

		const time = parseTimeFromNaturalLanguage(timeStr, utcOffset);
		if (!validateTime(time))
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidTime'),
			});

		const datetime = addTime(date, time);
		if (!isReminderLateEnough(datetime)) {
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
			components: [
				makeReminderContainer(
					reminder,
					translator,
					translator.getText('recordarReminderEditSuccessTitle'),
				),
			],
		});
	})
	.setButtonResponse(
		async function deleteReminder(interaction, reminderId) {
			const [reminder, translator] = await Promise.all([
				ReminderModel.findById(reminderId),
				Translator.from(interaction),
			]);

			if (!reminder)
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('recordarReminderNotFound'),
				});

			await interaction.deferUpdate();

			clearScheduledReminder(reminder);
			await reminder.deleteOne();

			const textDisplay = new TextDisplayBuilder().setContent(
				translator.getText('recordarReminderDeleteSuccess'),
			);

			return interaction.editReply({
				components: [textDisplay],
			});
		},
		{ userFilterIndex: 1 },
	)
	.setButtonResponse(
		async function refreshRemindersList(interaction, compressedUserId) {
			const [translator] = await Promise.all([
				Translator.from(interaction),
				interaction.deferUpdate(),
			]);

			return interaction.editReply({
				components: [await makeRemindersListContainer(compressedUserId, translator)],
			});
		},
		{ userFilterIndex: 0 },
	);

export default command;
