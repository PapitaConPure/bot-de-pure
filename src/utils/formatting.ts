export function millisecondsToDuration(ms: number): string {
	const units = [
		['d', 24 * 60 * 60e3],
		['h', 60 * 60e3],
		['m', 60e3],
		['s', 1e3],
		['ms', 1],
	] as const;

	const parts: string[] = [];

	for (const [unit, value] of units) {
		const amount = Math.floor(ms / value);
		if (amount > 0) {
			parts.push(`${amount}${unit}`);
			ms %= value;
		}
	}

	return parts.join(' ') || '0ms';
}
