const { CommandOptions, CommandTags, CommandManager } = require('../Commons/commands');

const options = new CommandOptions()
	.addParam('hora', 'TEXT', 'para establecer la hora a convertir')
	.addFlag('l', ['gmt', 'utc', 'huso'], 'para especificar tu huso horario', { name: 'l', type: 'NUMBER' })
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
		'Recuerda que no soy adivina, así que siempre ingresa tu huso local si no quieres que se tome como GMT+0',
	)
	.setOptions(options)
	.setExecution(async (request, args, isSlash) => {
		const gmt = options.fetchFlag(args, 'gmt', { callback: x => x * 1, fallback: 0 });

		//Definir fecha
		const dateStr = options.fetchFlag(args, 'fecha');
		let year, month, day;
		if(dateStr) {
			let isInvalidDate = false;
			const date = dateStr.split(/[\/ ]+/).map(d => d * 1);
			if(date.some(d => isNaN(d))) isInvalidDate = true;
			if(date.length < 3 || date.some(d => d < 1)) isInvalidDate = true;
			[ day, month, year ] = date;
			if(month > 12 || year > 9999) isInvalidDate = true;
			month -= 1;
			const lastDay = (new Date(year, month + 1, 0)).getDate();
			console.log(day, lastDay);
			if(day > lastDay) isInvalidDate = true;
			if(isInvalidDate) return request.reply('⚠️ Fecha inválida. Asegúrate de seguir el formato DD/MM/AAAA');
		} else {
			const now = new Date(Date.now());
			now.setTime(now.valueOf() + gmt * 60 * 60 * 1000);
			day = now.getUTCDate();
			month = now.getUTCMonth();
			year = now.getUTCFullYear();
		}

		/**@type {String}*/
		let rawTime = isSlash ? args.getString('hora') : args.shift();

		if(rawTime == undefined)
			return request.reply('⚠️ Debes ingresar una hora');
		
		let isShortened = false;
		let plus12;
		if(['am','pm'].some(m => rawTime.toLowerCase().endsWith(m))) {
			isShortened = true;
			plus12 = rawTime.toLowerCase().endsWith('pm');
			rawTime = rawTime.slice(0, -2);
		}
		/**@type {Array<Number>}*/
		const time = rawTime.split(':').map(t => (t * 1));
		
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

				const possibleMinutes = args.shift?.();
				if(possibleMinutes?.toLowerCase() === 'pm') {
					plus12 = true;
					break;
				}
				minutes = possibleMinutes ?? 0;

				const possibleSeconds = args.shift?.();
				if(possibleSeconds?.toLowerCase() === 'pm') {
					plus12 = true;
					break;
				}
				seconds = possibleSeconds ?? 0;

				break;
			}
		}

		if(!isSlash && args.shift()?.toLowerCase() === 'pm')
			plus12 = true;

		const isInvalidTime = (timeArray) => {
			if(timeArray.some(t => isNaN(t) || t < 0 || t >= 60)) return true;
			
			const [ hh, ..._ ] = timeArray;
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
		issueDate.setTime(issueDate.getTime() - gmt * 60 * 60 * 1000);
		const unixDate = issueDate.valueOf() / 1000;

		if(!dateStr)
			return request.reply(`<t:${unixDate}:T>`);
		return request.reply(`<t:${unixDate}:T> <t:${unixDate}:D>`);
	});

module.exports = command;