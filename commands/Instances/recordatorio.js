const globalConfigs = require('../../data/config.json');
const { Command, CommandTags, CommandOptions, CommandParam, CommandFlagExpressive, CommandOptionSolver } = require('../Commons/commands');
const { p_pure } = require('../../utils/prefixes');
const { Translator } = require('../../i18n');
const { parseDateFromNaturalLanguage, parseTimeFromNaturalLanguage } = require('../../utils/datetime');
const { MessageFlags, ContainerBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { shortenText, compressId, decompressId } = require('../../func');
const UserConfigs = require('../../models/userconfigs');
const Reminder = require('../../models/reminders');
const { startOfToday, isValid, addDays, isBefore } = require('date-fns');

/**
 * 
 * @param {string} userId 
 * @param {Translator} translator 
 */
async function makeRemindersContainer(userId, translator) {
	const reminders = await Reminder.find({ userId });

	const container = new ContainerBuilder()
		.setAccentColor(globalConfigs.tenshiColor)
		.addTextDisplayComponents(textDisplay =>
			textDisplay.setContent(translator.getText('recordarRemindersListTitle'))
		);

	if(!reminders) {
		container.addTextDisplayComponents(textDisplay =>
			textDisplay.setContent(translator.getText('recordarNoReminders'))
		);
		return;
	}

	reminders.forEach(reminder => {
		container
			.addSeparatorComponents(separator => separator.setDivider(true))
			.addSectionComponents(section =>
				section
					.addTextDisplayComponents(textDisplay =>
						textDisplay.setContent(`-# #${decompressId(reminder._id)}\n${shortenText(reminder.content, 64)}`)
					)
					.setButtonAccessory(
						new ButtonBuilder()
							.setCustomId(`recordar_promptViewReminder_${reminder._id}`)
							.setEmoji('1356977730754842684')
							.setLabel(translator.getText('buttonExpand'))
							.setStyle(ButtonStyle.Secondary)
					)
			);
	});

	return container;
}

/**@param {Date} date*/
const validateDate = (date) => isValid(date) && !isBefore(date, startOfToday());

/**@param {Date} time*/
const validateTime = (time) => isValid(time) && Math.abs(+time) < (+addDays(new Date(0), 2));

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
		new CommandFlagExpressive('dmy', 'TIME')
			.setShort('ht')
			.setLong([ 'hora', 'hour', 'time' ])
			.setDesc('para indicar la fecha en la cual emitir el recordatorio'),
	);

const command = new Command('recordatorio', tags)
	.setAliases('recordar', 'recordarme', 'recuerdame', 'recuérdame', 'reminder', 'remindme')
	.setLongDescription(
		'Establece un <recordatorio> a emitir a la --fecha y/o --hora especificada.',
		'Si no se indica fecha ni hora, mostraré un asistente para elegir ambas.',
		'',
		'Usar el comando sin especificar ninguna opción mostrará un editor de recordatorios pendientes.',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const [ translator, userConfigs] = await Promise.all([
			Translator.from(request),
			UserConfigs.findOne({ userId: request.userId }),
		]);

		if(!userConfigs)
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('userConfigRecommended', p_pure(request)),
			});

		const utcOffset = userConfigs?.utcOffset ?? 0;
		
		const dateStr = CommandOptionSolver.asString(args.parseFlagExpr('fecha'));
		const timeStr = CommandOptionSolver.asString(args.parseFlagExpr('hora'));
		const reminderContent = args.getString('recordatorio', true);

		if(!dateStr && !timeStr) {
			if(reminderContent)
				return translator.getText('recordarDateOrTimeRequired');

			return request.reply({
				flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
				components: [await makeRemindersContainer(request.userId, translator)],
			});
		}
		
		if(reminderContent.length > 960)
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('recordarReminderContentTooLong')
			});

		const date = parseDateFromNaturalLanguage(dateStr, translator.locale, utcOffset) ?? startOfToday();
		if(!validateDate(date))
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidDate'),
			});

		const time = parseTimeFromNaturalLanguage(timeStr) ?? new Date(0);
		if(!validateTime(time))
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidTime'),
			});

		const reminderCount = (await Reminder.find({ userId: request.userId })).length;
		if(reminderCount > 5)
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('recordarTooManyReminders'),
			});

		await request.deferReply();

		const datetime = (+date) + (+time);
		const reminderId = compressId(request.id);

		const container = new ContainerBuilder()
			.setAccentColor(globalConfigs.tenshiColor)
			.addTextDisplayComponents(
				textDisplay => textDisplay.setContent(translator.getText('recordarReminderCreateTitle')),
				textDisplay => textDisplay.setContent(
					translator.getText('recordarReminderCreateDateDescription', +datetime / 1000)
				),
			)
			.addSeparatorComponents(separator => separator.setDivider(false))
			.addTextDisplayComponents(textDisplay =>
				textDisplay.setContent(
					`${translator.getText('recordarReminderCreateContentSubtitle')}\n${reminderContent}`
				)
			)
			.addSeparatorComponents(separator => separator.setDivider(false))
			.addActionRowComponents(actionRow =>
				actionRow.addComponents(
					new ButtonBuilder()
						.setCustomId(`recordar_promptEditReminder_${reminderId}`)
						.setEmoji('1288444896331698241')
						.setLabel(translator.getText('buttonEdit'))
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId(`recordar_promptDeleteReminder_${reminderId}`)
						.setEmoji('1458130451834081513')
						.setLabel(translator.getText('buttonDelete'))
						.setStyle(ButtonStyle.Danger),
				)
			);

		const reminder = new Reminder({
			_id: reminderId,
			userId: request.userId,
			channelId: request.channelId,
			content: reminderContent,
			date: datetime,
		});

		await reminder.save();
		
		return request.editReply({
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
			components: [container],
		});
	});

module.exports = command
