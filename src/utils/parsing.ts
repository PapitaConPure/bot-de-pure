/**
 * Parses a duration string and obtains the amount in millisecods it represents. An empty string is considered 0ms.
 * @param input The duration string to parse
 * @returns The duration number in milliseconds. `NaN` if the string could not be parsed at all.
 */
export function parseDuration(input: string): number {
	input = input.trim();
	if (!input) return 0;

	const units = new Map<string, number>()
		.set('ms', 1)
		.set('s', 1e3)
		.set('m', 60e3)
		.set('h', 60 * 60e3)
		.set('d', 24 * 60 * 60e3);

	let total = 0;
	let matched = false;

	for (const match of input.matchAll(/((?:\.\d+)|\d+(?:\.\d+)?)\s*(ms|s|m|h|d)/gi)) {
		const magnitude = +match[1];
		const unitKey = match[2].toLowerCase();

		const unit = units.get(unitKey);
		if (!unit) return NaN;
		units.delete(unitKey);

		total += magnitude * unit;
		matched = true;
	}

	if (!matched) return NaN;

	return total;
}

export function parseSearchParams(searchParamsStr: string): Map<string, string> {
	if (searchParamsStr.startsWith('?')) searchParamsStr = searchParamsStr.slice(1);
	const searchParamsList = searchParamsStr.split('&');
	const searchParams = new Map<string, string>();

	for (const searchParam of searchParamsList) {
		const eq = searchParam.indexOf('=');
		const key = searchParam.slice(0, eq);
		const value = searchParam.slice(eq + 1);
		searchParams.set(key, value);
	}

	return searchParams;
}
