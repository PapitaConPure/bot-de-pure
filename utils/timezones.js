const timeZones = /**@const*/([
	{ offset: -12.0, aliases: ["IDLW"] },
	{ offset: -11.0, aliases: ["SST", "MIT"] },
	{ offset: -10.0, aliases: ["HST", "HAST"] },
	{ offset: -9.0, aliases: ["AKST", "YST"] },
	{ offset: -8.0, aliases: ["PST", "PST8PDT"] },
	{ offset: -7.0, aliases: ["MST"] },
	{ offset: -6.0, aliases: ["CST"] },
	{ offset: -5.0, aliases: ["EST"] },
	{ offset: -4.0, aliases: ["AST"] },
	{ offset: -3.5, aliases: ["NST"] },
	{ offset: -3.0, aliases: ["ART", "BRT"] },
	{ offset: -2.0, aliases: ["BRST", "FNT"] },
	{ offset: -1.0, aliases: ["CVT", "AZOT"] },
	{ offset: 0.0, aliases: ["GMT", "UTC", "WET"] },
	{ offset: 1.0, aliases: ["CET", "WAT"] },
	{ offset: 2.0, aliases: ["CAT", "EET"] },
	{ offset: 3.0, aliases: ["MSK", "EAT"] },
	{ offset: 3.5, aliases: ["IRDT"] },
	{ offset: 4.0, aliases: ["AZT", "GST"] },
	{ offset: 4.5, aliases: ["AFT"] },
	{ offset: 5.0, aliases: ["PKT", "YEK"] },
	{ offset: 5.5, aliases: ["IST", "SLT"] },
	{ offset: 5.75, aliases: ["NPT"] },
	{ offset: 6.0, aliases: ["BST", "ALMT"] },
	{ offset: 6.5, aliases: ["MMT"] },
	{ offset: 7.0, aliases: ["ICT", "KRAT"] },
	{ offset: 8.0, aliases: ["AWST"] },
	{ offset: 8.75, aliases: ["CWST"] },
	{ offset: 9.0, aliases: ["JST", "KST"] },
	{ offset: 9.5, aliases: ["ACST"] },
	{ offset: 10.0, aliases: ["AEST", "PGT"] },
	{ offset: 10.5, aliases: ["ACDT"] },
	{ offset: 11.0, aliases: ["VUT", "SAKT"] },
	{ offset: 11.5, aliases: ["NFT"] },
	{ offset: 12.0, aliases: ["NZST", "IDLE"] },
	{ offset: 12.75, aliases: ["CHAST"] },
	{ offset: 13.0, aliases: ["NZDT", "TOT"] },
	{ offset: 14.0, aliases: ["LINT"] },
]);

/**@type {Map<string, number>} */
const aliasToUtcMappings = new Map();
/**@type {Map<number, string>} */
const offsetToUtcMappings = new Map();

timeZones.forEach(timeZone => {
	offsetToUtcMappings.set(timeZone.offset, timeZone.aliases[0]);
	timeZone.aliases.forEach(alias => {
		aliasToUtcMappings.set(alias, timeZone.offset);
	});
});

/**@param {string | number} timeZone*/
function toUtcOffset(timeZone) {
	if(typeof timeZone !== 'string' && typeof timeZone !== 'number')
		return null;

	let offsetTimeZoneText = `${timeZone}`;
	if(offsetTimeZoneText.startsWith('UTC') || offsetTimeZoneText.startsWith('GMT'))
		offsetTimeZoneText = offsetTimeZoneText.slice(3);
	offsetTimeZoneText = offsetTimeZoneText.trim();
	if(!isNaN(+offsetTimeZoneText)) {
		const timezoneNumber = +offsetTimeZoneText;

		if(timezoneNumber < -12 || timezoneNumber > 14)
			return null;

		return timezoneNumber;
	}

	const timeZoneKey = `${timeZone}`.toUpperCase();
	if(aliasToUtcMappings.has(timeZoneKey))
		return aliasToUtcMappings.get(timeZoneKey);

	return null;
}

/**@param {number} utcOffset*/
function toTimeZoneAlias(utcOffset) {
	if(isNaN(utcOffset))
		return 'UTC';

	if(offsetToUtcMappings.has(utcOffset))
		return `${offsetToUtcMappings.get(utcOffset)} (${utcOffset >= 0 ? '+' : ''}${utcOffset})`;

	return `UTC+${utcOffset.toString()}`;
}

module.exports = {
	timeZones,
	aliasToUtcMappings,
	offsetToUtcMappings,
	toUtcOffset: toUtcOffset,
	toTimeZoneAlias,
};
