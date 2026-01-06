const { addHours, addMinutes, addSeconds, addMilliseconds } = require('date-fns');
const { Translator } = require('../i18n');

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
 * 
 * @param {number} a El primer componente de fecha
 * @param {number} b El primer componente de fecha
 * @param {number} c El primer componente de fecha
 * @param {import('../i18n').LocaleKey} locale La clave del idioma en el cual interpretar la fecha
 * @param {number} z El huso horario con el cual corregir la fecha UTC+0 obtenida
 */
function makeDateFromComponents(a, b, c, locale, z) {
	let { day, month, year } = Translator.mapReverseDateUTCComponents(locale, a, b, c);

	if(month > 12 || year > 9999) return;

	month -= 1;
	const lastDay = (new Date(year, month, 0)).getDate();
	if(day > lastDay) return;

	const dateResultUTC = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
	const dateResultTZ = addHours(dateResultUTC, -z);

	return dateResultTZ;
}

/**
 * Interpreta el string de fecha localizado indicado y obtiene un objeto {@link Date}, compensado con la diferencia del huso horario de origen (`z`) indicado
 * @param {string} str El string localizado del cual obtener la fecha
 * @param {import('../i18n').LocaleKey} locale La clave del idioma en el cual interpretar la fecha
 * @param {number} z El huso horario con el cual corregir la fecha UTC+0 obtenida
 */
function parseDateFromNaturalLanguage(str, locale, z = 0) {
	const dateComponents = getDateComponentsFromString(str);

	if(dateComponents == undefined) return;
	
	const [ a, b, c ] = dateComponents;
	return makeDateFromComponents(a, b, c, locale, z);
}

/**
 * Interpreta el string de hora indicado y obtiene un objeto {@link Date} cuyos ticks equivalen a la hora ingresada,
 * usando UTC y compensado con la diferencia del huso horario de origen (`z`) indicado
 * @param {string} str El string del cual obtener la hora
 * @param {number} z El huso horario con el cual corregir la fecha UTC obtenida
 */
function parseTimeFromNaturalLanguage(str, z = 0) {
	if(!str)
		return;

	str = str
		.toLowerCase()
		.replace(/\s+/g, '');

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
			return;

		if(str.length > 2 && str.length != 4 && str.length != 6)
			return;

		const matches = str.match(/([0-9]{1,2})([0-9]{2})?([0-9]{2})?/);

		if(!matches)
			return;

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
			return;

		if(usesGozen && !(str.startsWith(gozen) || str.endsWith(gozen)))
			return;
		
		if(usesGogo && !(str.startsWith(gogo) || str.endsWith(gogo)))
			return;

		const usesHan = str.includes(han);
		const hMatch = str.match(/([0-9]{1,2})時/);
		const mMatch = str.match(/([0-9]{1,2})分/);
		const sMatch = str.match(/([0-9]{1,2})(?:\.([0-9]{1,3}))?秒/);
		
		if(usesHan && (mMatch || sMatch || !str.endsWith(han)))
			return;
		
		if(!hMatch)
			return;

		timeComponents.h = +hMatch[1];

		if(usesHan)
			timeComponents.m = 30;
		else {
			if(mMatch) timeComponents.m = +mMatch[1];
			if(sMatch) {
				timeComponents.s = +sMatch[1];
				timeComponents.ms = +(sMatch[2] || 0);
			}
		}

		const isShortFormat = usesGozen || usesGogo;

		if(isShortFormat) {
			rangesInclusive.h[1] = 12;
			if(timeComponents.h > 12) return;
			if(timeComponents.h === 12) hoursPeriodOffset -= 12;
			if(usesGogo) hoursPeriodOffset += 12;
		} else
			rangesInclusive.h[1] = 30;
	} else { //Horas largas y cortas
		let meridiem1 = '', meridiem2 = '';
		let h = '0', m = '0', s = '0', ms = '0';

		if(str.includes(':')) { //H:mm:ss.S
			const matches = str.match(/(am|pm)?([0-9]{1,2}):([0-9]{2})(?::([0-9]{2}))?(?:.([0-9]{1,3}))?(am|pm)?/);

			if(!matches)
				return;

			[ , meridiem1, h, m, s, ms, meridiem2 ] = matches;
		} else { //H
			const matches = str.match(/(am|pm)?([0-9]{1,2})(am|pm)?/);

			if(!matches)
				return;

			[ , meridiem1, h, meridiem2 ] = matches;
		}

		if(meridiem1 && meridiem2)
			return;
			
		timeComponents.h = +h;
		timeComponents.m = +(m || 0);
		timeComponents.s = +(s || 0);
		timeComponents.ms = +(ms || 0);

		const isShortFormat = !!(meridiem1 || meridiem2);
		const isPostMeridiem = (meridiem1 === 'pm' || meridiem2 === 'pm');

		rangesInclusive.h[0] = 1;
		if(isShortFormat) {
			rangesInclusive.h[1] = 12;
			if(timeComponents.h === 12) hoursPeriodOffset -= 12;
			if(isPostMeridiem) hoursPeriodOffset += 12;
		} else
			rangesInclusive.h[1] = 30;
	}

	if(rangesInclusive.h[0] > timeComponents.h || timeComponents.h > rangesInclusive.h[1]) return;
	if(rangesInclusive.m[0] > timeComponents.m || timeComponents.m > rangesInclusive.m[1]) return;
	if(rangesInclusive.s[0] > timeComponents.s || timeComponents.s > rangesInclusive.s[1]) return;
	if(rangesInclusive.ms[0] > timeComponents.ms || timeComponents.ms > rangesInclusive.ms[1]) return;

	let time = new Date(0);
	time = addHours(time, timeComponents.h);
	time = addMinutes(time, timeComponents.m);
	time = addSeconds(time, timeComponents.s);
	time = addMilliseconds(time, timeComponents.ms);
	return addHours(time, hoursPeriodOffset - z);
}

module.exports = {
	getDateComponentsFromString,
	makeDateFromComponents,
	parseDateFromNaturalLanguage,
	parseTimeFromNaturalLanguage,
};
