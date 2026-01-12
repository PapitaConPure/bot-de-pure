const { TZDate } = require("@date-fns/tz");

const isoToIANA = /**@type {const}*/({
	acst: 'Australia/South',
	acdt: 'Australia/South',
	adt: 'Canada/Atlantic',
	aest: 'Australia/Canberra',
	aedt: 'Australia/Canberra',
	akst: 'America/Juneau',
	akdt: 'America/Juneau',
	art: 'America/Argentina/Buenos_Aires',
	ast: 'Canada/Atlantic',
	awst: 'Australia/Perth',
	brt: 'America/Sao_Paulo',
	bst: 'Europe/London',
	cat: 'Africa/Maputo',
	cdt: 'US/Central',
	cest: 'Europe/Rome',
	cet: 'Europe/Rome',
	chst: 'Pacific/Guam',
	clt: 'America/Santiago',
	clst: 'America/Santiago',
	cst: 'Mexico/General',
	eat: 'Africa/Nairobi',
	eest: 'Europe/Athens',
	eet: 'Europe/Athens',
	est: 'America/New_York',
	gmt: 'Europe/London',
	hdt: 'America/Adak',
	hkt: 'Asia/Hong_Kong',
	hst: 'America/Adak',
	idt: 'Asia/Jerusalem',
	ist: 'Asia/Jerusalem',
	jst: 'Asia/Tokyo',
	kst: 'Asia/Seoul',
	mdt: 'America/Denver',
	msk: 'Europe/Moscow',
	mst: 'America/Denver',
	ndt: 'America/St_Johns',
	nst: 'America/St_Johns',
	nzdt: 'Pacific/Auckland',
	nzst: 'Pacific/Auckland',
	pdt: 'America/Tijuana',
	pkt: 'Asia/Karachi',
	pst: 'America/Tijuana',
	sast: 'Africa/Johannesburg',
	sst: 'Pacific/Pago_Pago',
	utc: 'Etc/UTC',
	wat: 'Africa/Lagos',
	west: 'Europe/Lisbon',
	wet: 'Europe/Lisbon',
	wib: 'Asia/Jakarta',
	wit: 'Asia/Jayapura',
	wita: 'Asia/Makassar',
});

const spacesRegex = /\s+/g;
const gmtUtcStartRegex = /^gmt|utc_?/;
const standardTimeEndRegex = /(?:_standard)?_time$/;
const utcOffsetClockRegex = /([+-])?_?([0-9]{1,2})_?:?_?([0-9]{2})?/;

/**@param {string | number} tzCode*/
function sanitizeTzCode(tzCode) {
	tzCode = `${tzCode}`.toLowerCase();

	const isoExtractedIANA = isoToIANA[tzCode];
	if(isoExtractedIANA)
		return isoExtractedIANA;

	return tzCode
		.trim()
		.replace(spacesRegex, '_') //IANA no acepta espacios
		.replace(gmtUtcStartRegex, '') //No complicarlo de más
		.replace(standardTimeEndRegex, '') //IANA no usa Standard Time de ISO
		.replace(utcOffsetClockRegex, (_, sign, hour, minute) => {
			//Número a formato válido de offset para IAMA (+XX:XX/-XX:XX)
			if(!minute)
				return `${sign || '+'}${hour.padStart(2, '0')}:00`;

			return `${sign || '+'}${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
		})
		.trim();
}

/**
 * Obtiene el huso horario especificado en minutos
 * @param {string} sanitizedTzCode
 */
function toUtcOffset(sanitizedTzCode) {
	if(typeof sanitizedTzCode !== 'string')
		return null;

	const tzDate = new TZDate(Date.now(), sanitizedTzCode);
	const utcOffset = -tzDate.getTimezoneOffset();

	if(isNaN(utcOffset))
		return null;

	return utcOffset;
}

/**
 * "UTC+XX:XX", "UTC-XX:XX", ""
 * @param {string} sanitizedTzCode 
 */
function utcOffsetDisplay(sanitizedTzCode) {
	if(!sanitizedTzCode?.length)
		return '';

	const utcOffset = toUtcOffset(sanitizedTzCode);
	let str = `UTC${utcOffset < 0 ? '-' : '+'}`;
	str += `${Math.floor(Math.abs(utcOffset) / 60)}`.padStart(2, '0');
	str += ':';
	str += `${Math.abs(utcOffset) % 60}`.padStart(2, '0');
	return str;
}

/**
 * " (UTC+XX:XX)", "(UTC-XX:XX)", ""
 * @param {string} sanitizedTzCode 
 */
function utcOffsetDisplayFull(sanitizedTzCode) {
	if(!sanitizedTzCode?.length || /^utc|gmt/i.test(sanitizedTzCode))
		return sanitizedTzCode.toUpperCase();

	const formattedCode = (sanitizedTzCode.length <= 4)
		? sanitizedTzCode.toUpperCase()
		: sanitizedTzCode.replace(/([a-z])([a-z]*)/gi, (_, first, rest) => first.toUpperCase() + rest.toLowerCase());

	return `\`${formattedCode}\` (${utcOffsetDisplay(sanitizedTzCode)})`;
}

module.exports = {
	toUtcOffset,
	utcOffsetDisplay,
	utcOffsetDisplayFull,
	sanitizeTzCode,
};
