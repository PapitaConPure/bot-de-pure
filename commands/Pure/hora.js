const { CommandOptions, CommandTags, CommandManager, CommandOptionSolver } = require('../Commons/commands');
const UserConfigs = require('../../localdata/models/userconfigs');
const { toUtcOffset, toTimeZoneAlias } = require('../../timezones');
const { dateToUTCFormat } = require('../../func');
const { Translator } = require('../../internationalization');

/**@param {string} text*/
const hasShortenedFormat = text => text && (['am','pm'].some(m => text.toLowerCase().endsWith(m)));

const options = new CommandOptions()
	.addParam('hora', 'TEXT', 'para establecer la hora a convertir', { optional: true })
	.addFlag('lzt', ['huso', 'franja', 'zona', 'zone', 'timezone', 'offset'], 'para especificar un huso horario de referencia', { name: 'z', type: 'TEXT' })
	.addFlag(['f','d'], ['fecha','día','dia'], 'para ingresar un día en formato DD/MM/AAAA', { name: 'dma', type: { name: 'dma', expression: 'dd/MM/AAAA' } });
const flags = new CommandTags().add('COMMON');
const command = new CommandManager('hora', flags)
	.setAliases(
		'horario',
		'time', 'schedule',
	)
	.setBriefDescription('Muestra una fecha y hora automáticamente adaptados según el huso horario que proporciones')
	.setLongDescription(
		'Muestra una `--fecha` y `<hora>` automáticamente adaptados a lo que ingreses.',
		'Puedes indicar el `--huso` horario que quieres usar como referencia. Si no se especifica un huso, se usará el de tu configuración de usuario ó GMT+0',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const translator = await Translator.from(request.user);

		const utcOffset = toUtcOffset(CommandOptionSolver.asString(args.parseFlagExpr('huso')))
			?? (await UserConfigs.findOne({ userId: request.userId }))?.utcOffset
			?? 0;

		//Definir fecha
		const dateStr = CommandOptionSolver.asString(args.parseFlagExpr('fecha'));
		let year, month, day;
		if(dateStr) {
			let isInvalidDate = false;
			const date = dateStr.split(/[/ ]+/).map(d => +d);
			if(date.some(d => isNaN(d))) isInvalidDate = true;
			if(date.length < 3 || date.some(d => d < 1)) isInvalidDate = true;
			[ day, month, year ] = date;
			if(month > 12 || year > 9999) isInvalidDate = true;
			month -= 1;
			const lastDay = (new Date(year, month + 1, 0)).getDate();
			if(day > lastDay) isInvalidDate = true;
			if(isInvalidDate) return request.reply('⚠️ Fecha inválida. Asegúrate de seguir el formato DD/MM/AAAA');
		} else {
			const now = new Date(Date.now());
			now.setTime(now.valueOf() + utcOffset * 60 * 60 * 1000);
			day = now.getUTCDate();
			month = now.getUTCMonth();
			year = now.getUTCFullYear();
		}

		/**@type {String}*/
		const argTime = args.getString('hora');
		let rawTime = argTime
			?? dateToUTCFormat(new Date(Date.now() + utcOffset * 60 * 60e3), 'HH:mm:ss');

		if(rawTime == undefined)
			return request.reply('⚠️ Debes ingresar una hora');
		
		let isShortened = false;
		let plus12;
		if(hasShortenedFormat(rawTime)) {
			isShortened = true;
			plus12 = rawTime.toLowerCase().endsWith('pm');
			rawTime = rawTime.slice(0, -2);
		}
		/**@type {Array<Number>}*/
		const time = rawTime.split(':').map(t => (+t));
		
		let hours, minutes, seconds;
		minutes = seconds = 0;
		switch(time.length) {
			case 3: {
				[ hours, minutes, seconds ] = time;
				break;
			}
			case 2: [ hours, minutes, seconds ] = [ ...time, 0 ]; break;
			case 1: {
				[ hours ] = time;
				
				if(request.isMessage) {
					const possibleMinutes = args.next();
					if(hasShortenedFormat(possibleMinutes)) {
						plus12 = possibleMinutes.toLowerCase().endsWith('pm');
						isShortened = true;
						break;
					}
					minutes = (possibleMinutes != null) ? +possibleMinutes : 0;

					const possibleSeconds = args.next();
					if(hasShortenedFormat(possibleSeconds)) {
						plus12 = possibleSeconds.toLowerCase().endsWith('pm');
						isShortened = true;
						break;
					}
					seconds = (possibleSeconds != null) ? +possibleSeconds : 0;
				}

				break;
			}
		}

		if(request.isMessage) {
			const finalTestArg = args.next();

			if(hasShortenedFormat(finalTestArg)) {
				plus12 = finalTestArg.toLowerCase().endsWith('pm');
				isShortened = true;
			}
		}

		
		const isInvalidTime = (timeArray) => {
			if(timeArray.some(t => isNaN(t) || t < 0 || t >= 60)) return true;
			
			const [ hh ] = timeArray;
			if(isShortened && (hh < 1 || hh > 12)) return true;
			if(hh >= 24) return true;
			
			return false;
		};

		if(isInvalidTime([ hours, minutes, seconds ]))
			return request.reply('⚠️ Debes ingresar una hora válida');
		
		if(isShortened) {
			if(hours === 12) hours -= 12;
			if(plus12) hours += 12;
		}

		const issueDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
		issueDate.setTime(issueDate.getTime() - utcOffset * 60 * 60 * 1000);
		const unixDate = issueDate.valueOf() / 1000;

		if(!argTime) {
			const originDate = new Date(Date.now() + utcOffset * 60 * 60e3);
			const localeMappings = /**@type {const}*/({
				'es': 'es-ES',
				'en': 'en-US',
				'ja': 'ja-JP',
			});
			const mappedLocale = localeMappings[translator.locale];
			
			return request.reply(`${dateToUTCFormat(originDate, '`HH:mm:ss` `yyyy-MM-dd`', mappedLocale)} — <:clock:1357498813144760603> ${toTimeZoneAlias(utcOffset)}`);
		}

		if(!dateStr)
			return request.reply(`<t:${unixDate}:T> — :index_pointing_at_the_viewer: Adaptado a tu huso horario`);
		
		return request.reply(`<t:${unixDate}:T> <t:${unixDate}:D> — :index_pointing_at_the_viewer: Adaptado a tu huso horario`);
	});

module.exports = command;
