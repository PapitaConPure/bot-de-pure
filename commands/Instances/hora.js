const { CommandOptions, CommandTags, Command } = require('../Commons/');
const UserConfigs = require('../../models/userconfigs').default;
const { toUtcOffset, utcOffsetDisplay, sanitizeTzCode } = require('../../utils/timezones');
const { dateToUTCFormat } = require('../../func');
const { Translator } = require('../../i18n');
const { parseDateFromNaturalLanguage, addTime, utcStartOfTzToday } = require('../../utils/datetime');
const { isValid, getUnixTime, addMinutes } = require('date-fns');
const { ButtonBuilder, ButtonStyle } = require('discord.js');

const options = new CommandOptions()
	.addParam('hora', 'TIME', 'para establecer la hora a convertir', { optional: true })
	.addFlag('lzt', ['huso', 'franja', 'zona', 'zone', 'timezone', 'offset'], 'para especificar un huso horario de referencia', { name: 'tz', type: 'TEXT' })
	.addFlag(['f','d'], ['fecha', 'día', 'dia', 'date'], 'para ingresar un día', { name: 'dma', type: 'DATE' });

const tags = new CommandTags().add('COMMON');

const command = new Command('hora', tags)
	.setAliases(
		'horario',
		'time', 'schedule',
	)
	.setBriefDescription('Muestra una fecha y hora automáticamente adaptados según el huso horario que proporciones')
	.setLongDescription(
		'Muestra una `--fecha` y `<hora>` automáticamente adaptados a lo que ingreses.',
		'Puedes indicar el `--huso` horario que quieres usar como referencia. Si no se especifica un huso, se usará el de tu configuración de usuario ó UTC+0.',
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
		const translator = await Translator.from(request.user);

		const tzCode = args.parseFlagExpr('huso')
			?? (await UserConfigs.findOne({ userId: request.userId }))?.tzCode
			?? 'UTC';
		const sanitizedTzCode = sanitizeTzCode(tzCode);
		const utcOffset = toUtcOffset(sanitizedTzCode);

		const dateStr = args.parseFlagExpr('fecha');
		const date = parseDateFromNaturalLanguage(dateStr, translator.locale, sanitizedTzCode);
		const time = args.getTime('hora', utcOffset);

		if(!time) {
			if(isValid(date)) {
				return request.reply({
					content: translator.getText('horaDateButNoTime')
				});
			}

			const now = new Date(Date.now());
			const dateAtThisTime = addMinutes(now, utcOffset);
			return request.reply({
				content: `${dateToUTCFormat(dateAtThisTime, '`HH:mm:ss` `yyyy-MM-dd`', translator.locale)} — <:clock:1357498813144760603> ${utcOffsetDisplay(tzCode)}`,
			});
		}

		if(!isValid(time))
			return request.reply(translator.getText('invalidTime'));

		if(!date) {
			const issueDate = addTime(utcStartOfTzToday(sanitizedTzCode), time);
			const unixDate = getUnixTime(issueDate);

			return request.reply(`<t:${unixDate}:T> — :index_pointing_at_the_viewer: ${translator.getText('horaAdaptedToYourTimezone')}`);
		}

		if(!isValid(date))
			return request.reply(translator.getText('invalidDate'));

		const issueDate = addTime(date, time);
		const unixDate = getUnixTime(issueDate);
		
		return request.reply(`<t:${unixDate}:T> <t:${unixDate}:D> — :index_pointing_at_the_viewer: ${translator.getText('horaAdaptedToYourTimezone')}`);
	});

module.exports = command;
