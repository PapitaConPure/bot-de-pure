const { fetchFlag, fetchSentence } = require('../../func.js');
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const options = new CommandOptionsManager()
	.addParam('hora', 'TEXT', 'para establecer la hora a convertir')
	.addFlag('l', ['gmt', 'utc', 'huso'], 'para especificar tu huso horario', { name: 'l', type: 'NUMBER' })
	.addFlag(['f','d'], ['fecha','día','dia'], 'para ingresar un día en formato DD/MM/AAAA', { name: 'dma', type: { name: 'dma', expression: 'dd/MM/AAAA' } });
const flags = new CommandMetaFlagsManager().add('COMMON');
const command = new CommandManager('hora', flags)
	.setAliases(
		'horario',
		'time', 'schedule',
	)
	.setLongDescription(
		'Muestra una fecha y hora automáticamente adaptada según la `<fecha>` que ingreses.',
		'Recuerda que no soy adivina, así que siempre ingresa tu huso local si no quieres que se tome como GMT+0',
	)
	.setOptions(options)
	.setExecution(async (request, args, isSlash) => {
		const gmt = options.fetchFlag(args, 'gmt', { callback: x => x * 1, fallback: 0 });
		console.log(gmt);
		if(!args.length) return request.reply('⚠ Debes ingresar una hora');

		//Definir fecha
		const dateStr = isSlash ? args.getString('fecha') : fetchFlag(args, { property: true, ...options.flags.get('fecha').structure, callback: fetchSentence });
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
			if(isInvalidDate) return request.reply('⚠ Fecha inválida. Asegúrate de seguir el formato DD/MM/AAAA');
		} else {
			const now = new Date(Date.now());
			now.setTime(now.valueOf() + gmt * 60 * 60 * 1000);
			day = now.getUTCDate();
			month = now.getUTCMonth();
			year = now.getUTCFullYear();
		}

		if(!args.length) return request.reply('⚠ Debes ingresar una hora');

		/**@type {String}*/
		let rawTime = args.shift();
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
				minutes = args.shift() ?? 0;
				seconds = args.shift() ?? 0;
				break;
			}
		}

		if(args.shift()?.toLowerCase() === 'pm')
			plus12 = true;

		const isInvalidTime = (timeArray) => {
			if(timeArray.some(t => isNaN(t) || t < 0 || t >= 60)) return true;
			
			const [ hh, ..._ ] = timeArray;
			if(isShortened && (hh < 1 || hh > 12)) return true;
			if(hh >= 24) return true;
			
			return false;
		};

		if(isInvalidTime([ hours, minutes, seconds ]))
			return request.reply('⚠ Debes ingresar una hora válida');
		
		if(isShortened) {
			if(hours === 12) hours -= 12;
			if(plus12) hours += 12;
		}

		const issueDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
		issueDate.setTime(issueDate.getTime() - gmt * 60 * 60 * 1000);
		const unixDate = issueDate.valueOf() / 1000;

		if(dateStr)
			return request.reply(`<t:${unixDate}:T> <t:${unixDate}:D>`);
		else
			return request.reply(`<t:${unixDate}:T>`);
	});

module.exports = command;