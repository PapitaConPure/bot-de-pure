const { addDays, addHours, addMinutes, addSeconds, addMilliseconds, startOfDay } = require('date-fns');
const { Translator } = require('../i18n');
const { tz, TZDate } = require('@date-fns/tz');
const { UTCDate } = require('@date-fns/utc');

//RECORDATORIO DIARIO DE QUE SATANÁS INVENTÓ LAS ZONAS HORARIAS
/**
 * @template {Date} DateType
 * @template {Date} [ResultDate=DateType]
 * @param {import('date-fns').DateArg<DateType>} date La fecha TZ de la cual obtener el día en TZ y el inicio horario en UTC
 * @param {import('date-fns').StartOfDayOptions<ResultDate>} [options] Código de zona horaria sanitizado (UTC por defecto)
 */
function utcStartOfTzDay(date, options) {
	const startOfTodayTZ = startOfDay(date, { in: options?.in });
	const startOfTodayTZnoUTCHours = new UTCDate(startOfTodayTZ.setUTCHours(0, 0, 0, 0));
	console.log({ startOfTodayTZ, startOfTodayTZnoUTCHours });
	return startOfTodayTZnoUTCHours;
};

/**@param {string} [sanitizedTzCode] Código de zona horaria sanitizado (UTC por defecto)*/
const utcStartOfTzToday     = (sanitizedTzCode = 'Etc/UTC') => utcStartOfTzDay(Date.now(), { in: tz(sanitizedTzCode) });
/**@param {string} [sanitizedTzCode] Código de zona horaria sanitizado (UTC por defecto)*/
const utcStartOfTzYesterday = (sanitizedTzCode = 'Etc/UTC') => utcStartOfTzDay(addDays(Date.now(), -1), { in: tz(sanitizedTzCode) });
/**@param {string} [sanitizedTzCode] Código de zona horaria sanitizado (UTC por defecto)*/
const utcStartOfTzTomorrow  = (sanitizedTzCode = 'Etc/UTC') => utcStartOfTzDay(addDays(Date.now(), +1), { in: tz(sanitizedTzCode) });

const relativeDates = /**@type {const}*/({
	beforeYesterday: {
		match: new Set([
			'anteayer',
			'before yesterday',
			'一昨日',
		]),
		getValue: (sanitizedTzCode = 'Etc/UTC') => addDays(utcStartOfTzToday(sanitizedTzCode), -2),
	},
	yesterday: {
		match: new Set([
			'ayer',
			'yesterday',
			'昨日',
		]),
		getValue: (sanitizedTzCode = 'Etc/UTC') => utcStartOfTzYesterday(sanitizedTzCode),
	},
	today: {
		match: new Set([
			'hoy',
			'today',
			'今日',
		]),
		getValue: (sanitizedTzCode = 'Etc/UTC') => utcStartOfTzToday(sanitizedTzCode),
	},
	tomorrow: {
		match: new Set([
			'mañana',
			'tomorrow',
			'明日',
		]),
		getValue: (sanitizedTzCode = 'Etc/UTC') => utcStartOfTzTomorrow(sanitizedTzCode),
	},
	afterTomorrow: {
		match: new Set([
			'pasado mañana',
			'after tomorrow',
			'明後日',
		]),
		getValue: (sanitizedTzCode = 'Etc/UTC') => addDays(utcStartOfTzToday(sanitizedTzCode), +2),
	},
});

const relativeTimes = /**@type {const}*/({
	today: {
		match: new Set([
			'ahora',
			'now',
			'今',
		]),
		getValue: () => {
			const now = new Date(Date.now());
			let time = new Date(0);
			time = addHours(time, now.getHours());
			time = addMinutes(time, now.getMinutes());
			time = addSeconds(time, now.getSeconds());
			time = addMilliseconds(time, now.getMilliseconds());
			return time;
		},
	},
});

/**
 * Obtiene componentes de fecha del string localizado indicado
 * @param {string} str El string localizado del cual obtener los componentes de fecha
 */
function getDateComponentsFromString(str) {
	if(!str)
		return;

	const seps = [ '/', '.', '-' ];
	const dateComponents = str.split(/[/.-]/).map(d => +(d.trim()));
	
	if(dateComponents.some(d => isNaN(d))) return;

	if(seps.some(s => str.startsWith(s)) || seps.some(s => str.endsWith(s)))
		return;
	
	return dateComponents;
}

/**
 * Crea un objeto {@link Date} a partir de los componentes de fecha indicados, según el idioma.
 * @param {number} a El primer componente de fecha
 * @param {number} b El primer componente de fecha
 * @param {number} c El primer componente de fecha
 * @param {import('../i18n').LocaleKey} locale La clave del idioma en el cual interpretar la fecha
 * @param {string} sanitizedTzCode El código IANA de la zona horaria en la que se expresa la fecha, sanitizado
 */
function makeDateFromComponents(a, b, c, locale, sanitizedTzCode) {
	let { day, month, year } = Translator.mapReverseDateUTCComponents(locale, a, b, c);

	if(month > 12 || year > 9999) return;

	month -= 1;
	const lastDay = (new Date(year, month, 0)).getDate();
	if(day > lastDay) return;

	const dateResultTZ = new TZDate(year, month, day, 0, 0, 0, 0, sanitizedTzCode);
	const dateResultCrop = new UTCDate(dateResultTZ.setUTCHours(0, 0, 0, 0));

	return dateResultCrop;
}

/**
 * Interpreta el string de fecha localizado indicado y obtiene un objeto {@link Date},
 * compensado con la diferencia del huso horario de origen (`z`) indicado
 * @param {string} str El string localizado del cual obtener la fecha
 * @param {import('../i18n').LocaleKey} locale La clave del idioma en el cual interpretar la fecha
 * @param {string} sanitizedTzCode El código IANA de la zona horaria en la que se expresa la fecha, sanitizado (UTC por defecto)
 * @returns {UTCDate} La fecha correspondiente si el string pudo interpretarse,
 * una fecha inválida si el string estaba malformado,
 * o `undefined` si el string estaba vacío
 */
function parseDateFromNaturalLanguage(str, locale, sanitizedTzCode = 'Etc/UTC') {
	if(!str)
		return;

	str = str.toLowerCase();

	for(const relativeDate of Object.values(relativeDates))
		if(relativeDate.match.has(str)) {
			console.log({z: sanitizedTzCode})
			return relativeDate.getValue(sanitizedTzCode);
		}

	const dateComponents = getDateComponentsFromString(str);

	if(dateComponents == undefined) return invalidDate();
	
	const [ a, b, c ] = dateComponents;
	return makeDateFromComponents(a, b, c, locale, sanitizedTzCode);
}

/**
 * Interpreta el string de tiempo indicado y obtiene un objeto {@link Date} cuyos ticks equivalen a la hora ingresada,
 * usando UTC y compensado con la diferencia del huso horario de origen (`z`) indicado
 * @param {string} str El string del cual obtener la hora
 * @param {number} utcOffset El huso horario con el cual corregir la fecha UTC obtenida, en minutos
 * @returns {Date} El tiempo correspondiente si el string pudo interpretarse,
 * una fecha inválida si el string estaba malformado,
 * o `undefined` si el string estaba vacío
 */
function parseTimeFromNaturalLanguage(str, utcOffset = 0) {
	if(!str)
		return;

	str = str.toLowerCase();

	for(const relativeTime of Object.values(relativeTimes))
		if(relativeTime.match.has(str))
			return addMinutes(relativeTime.getValue(), -utcOffset);

	str = str.replace(/\s+/g, '');
		
	const timeComponents = { h: 0, m: 0, s: 0, ms: 0 };
	const rangesInclusive = {
		h: [ 0, 24 ],
		m: [ 0, 59 ],
		s: [ 0, 59 ],
		ms: [ 0, 999 ],
	};
	
	let hoursPeriodOffset = 0;

	if(!isNaN(+str)) { //Hora militar sencilla: HHmmss
		if(str.includes('-'))
			return invalidDate();

		if(str.length > 2 && str.length != 4 && str.length != 6)
			return invalidDate();

		const matches = str.match(/([0-9]{1,2})([0-9]{2})?([0-9]{2})?/);

		if(!matches)
			return invalidDate();

		rangesInclusive.h[1] = 23;
		timeComponents.h = +matches[1];
		timeComponents.m = +(matches[2] || 0);
		timeComponents.s = +(matches[3] || 0);
	} else if(/[午前後時分秒半]/.test(str)) { //Hora japonesa
		const gozen = '午前';
		const gogo = '午後';
		const han = '半';

		const usesGozen = str.includes(gozen);
		const usesGogo = str.includes(gogo);

		if(usesGozen && usesGogo)
			return invalidDate();

		if(usesGozen && !(str.startsWith(gozen) || str.endsWith(gozen)))
			return invalidDate();
		
		if(usesGogo && !(str.startsWith(gogo) || str.endsWith(gogo)))
			return invalidDate();

		const usesHan = str.includes(han);
		const hMatch = str.match(/([0-9]{1,2})時/);
		const mMatch = str.match(/([0-9]{1,2})分/);
		const sMatch = str.match(/([0-9]{1,2})(?:\.([0-9]{1,3}))?秒/);
		
		if(usesHan && (mMatch || sMatch || !str.endsWith(han)))
			return invalidDate();
		
		if(!hMatch)
			return invalidDate();

		timeComponents.h = +hMatch[1];

		if(usesHan)
			timeComponents.m = 30;
		else {
			if(mMatch) timeComponents.m = +mMatch[1];
			if(sMatch) {
				timeComponents.s = +sMatch[1];
				timeComponents.ms = +(sMatch[2]?.padEnd(3, '0') || 0);
			}
		}

		const isShortFormat = usesGozen || usesGogo;

		if(isShortFormat) {
			rangesInclusive.h[1] = 12;
			if(timeComponents.h === 12) hoursPeriodOffset -= 12;
			if(usesGogo) hoursPeriodOffset += 12;
		} else {
			rangesInclusive.h[1] = 30;
		}
	} else { //Horas largas y cortas
		let meridiem1 = '', meridiem2 = '';
		let h = '0', m = '0', s = '0', ms = '0';

		if(str.includes(':')) { //H:mm:ss.S
			const matches = str.match(/(am|pm)?([0-9]{1,2}):([0-9]{2})(?::([0-9]{2}))?(?:\.([0-9]{1,3}))?(am|pm)?/);

			if(!matches)
				return invalidDate();

			[ , meridiem1, h, m, s, ms, meridiem2 ] = matches;
		} else { //H
			const matches = str.match(/(am|pm)?([0-9]{1,2})(am|pm)?/);

			if(!matches)
				return invalidDate();

			[ , meridiem1, h, meridiem2 ] = matches;
		}

		if(meridiem1 && meridiem2)
			return invalidDate();
			
		timeComponents.h = +h;
		timeComponents.m = +(m || 0);
		timeComponents.s = +(s || 0);
		timeComponents.ms = +(ms?.padEnd(3, '0') || 0);

		const isShortFormat = !!(meridiem1 || meridiem2);
		const isPostMeridiem = (meridiem1 === 'pm' || meridiem2 === 'pm');

		if(isShortFormat) {
			rangesInclusive.h = [1, 12];
			if(timeComponents.h === 12) hoursPeriodOffset -= 12;
			if(isPostMeridiem) hoursPeriodOffset += 12;
		} else
			rangesInclusive.h[1] = 30; //Noche extendida
	}

	if(rangesInclusive.h[0] > timeComponents.h || timeComponents.h > rangesInclusive.h[1]) return invalidDate();
	if(rangesInclusive.m[0] > timeComponents.m || timeComponents.m > rangesInclusive.m[1]) return invalidDate();
	if(rangesInclusive.s[0] > timeComponents.s || timeComponents.s > rangesInclusive.s[1]) return invalidDate();
	if(rangesInclusive.ms[0] > timeComponents.ms || timeComponents.ms > rangesInclusive.ms[1]) return invalidDate();

	let time = new Date(0);
	time = addHours(time, timeComponents.h + hoursPeriodOffset);
	time = addMinutes(time, timeComponents.m);
	time = addSeconds(time, timeComponents.s);
	time = addMilliseconds(time, timeComponents.ms);
	return addMinutes(time, -utcOffset);
}

function invalidDate() {
	return new UTCDate(NaN);
}

/**
 * @param {Date} date 
 * @param {Date} time 
 * @returns {UTCDate}
 */
function addTime(date, time) {
	const datetime = new UTCDate(+date + +time);
	console.log({ date, time, datetime });

	return datetime;
}

module.exports = {
	relativeDates,
	relativeTimes,
	getDateComponentsFromString,
	makeDateFromComponents,
	parseDateFromNaturalLanguage,
	parseTimeFromNaturalLanguage,
	utcStartOfTzYesterday,
	utcStartOfTzToday,
	utcStartOfTzTomorrow,
	invalidDate,
	addTime,
};
