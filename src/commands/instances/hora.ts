import { addMinutes, getUnixTime, isValid } from 'date-fns';
import { ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { dateToUTCFormat } from '@/func';
import { Translator } from '@/i18n';
import UserConfigModel from '@/models/userconfigs';
import { addTime, parseDateFromNaturalLanguage, utcStartOfTzToday } from '@/utils/datetime';
import { getBotEmoji, getBotEmojiResolvable } from '@/utils/emojis';
import { sanitizeTzCode, toUtcOffset, utcOffsetDisplay } from '@/utils/timezones';
import { Command, CommandOptions, CommandTags } from '../commons';

const options = new CommandOptions()
	.addParam('hora', 'TIME', 'para establecer la hora a convertir', { optional: true })
	.addFlag(
		'lzt',
		['huso', 'franja', 'zona', 'zone', 'timezone', 'offset'],
		'para especificar un huso horario de referencia',
		{ name: 'tz', type: 'TEXT' },
	)
	.addFlag(['f', 'd'], ['fecha', 'día', 'dia', 'date'], 'para ingresar un día', {
		name: 'dma',
		type: 'DATE',
	});

const tags = new CommandTags().add('COMMON');

const command = new Command(
	{
		es: 'hora',
		en: 'time',
		ja: 'time',
	},
	tags,
)
	.setAliases('horario', 'time', 'schedule')
	.setBriefDescription(
		'Muestra una fecha y hora automáticamente adaptados según el huso horario que proporciones',
	)
	.setLongDescription(
		'Muestra una `--fecha` y `<hora>` automáticamente adaptados a lo que ingreses.',
		'Puedes indicar el `--huso` horario que quieres usar como referencia. Si no se especifica un huso, se usará el de tu configuración de usuario ó UTC+0.',
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
		const translator = await Translator.from(request.user);

		const tzCode =
			args.parseFlagExpr('huso')
			?? (await UserConfigModel.findOne({ userId: request.userId }))?.tzCode
			?? 'UTC';
		const sanitizedTzCode = sanitizeTzCode(tzCode);
		const utcOffset = toUtcOffset(sanitizedTzCode) ?? 0;

		const dateStr = args.parseFlagExpr('fecha');
		const date = dateStr
			? parseDateFromNaturalLanguage(dateStr, translator.locale, sanitizedTzCode)
			: undefined;
		const time = args.getTime('hora', utcOffset);

		if (!time) {
			if (isValid(date)) {
				return request.reply({
					content: translator.getText('horaDateButNoTime'),
				});
			}

			const now = new Date(Date.now());
			const dateAtThisTime = addMinutes(now, utcOffset);
			return request.reply({
				content: `${dateToUTCFormat(dateAtThisTime, '`HH:mm:ss` `yyyy-MM-dd`', translator.locale)} — ${getBotEmoji('clockAccent')} ${utcOffsetDisplay(tzCode)}`,
			});
		}

		if (!isValid(time))
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidTime'),
			});

		if (!date) {
			const issueDate = addTime(utcStartOfTzToday(sanitizedTzCode), time);
			const unixDate = getUnixTime(issueDate);

			return request.reply({
				content: `<t:${unixDate}:T> — :index_pointing_at_the_viewer: ${translator.getText('horaAdaptedToYourTimezone')}`,
			});
		}

		if (!isValid(date))
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidDate'),
			});

		const issueDate = addTime(date, time);
		const unixDate = getUnixTime(issueDate);

		return request.reply({
			content: `<t:${unixDate}:T> <t:${unixDate}:D> — :index_pointing_at_the_viewer: ${translator.getText('horaAdaptedToYourTimezone')}`,
		});
	});

export default command;
