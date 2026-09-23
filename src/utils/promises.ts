export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
	]);
}

export function makeTimeoutRejectionPromise(ms: number = 20_000): Promise<never> {
	return new Promise<never>((_, reject) =>
		setTimeout(() => reject(new Error('DB took too long')), ms),
	);
}

export async function attemptManyTimes<T>(
	fn: () => Promise<T>,
	times: number,
	options: {
		onEachCatch?: (remaining: number, err: Error) => void;
		onReattempt?: (remaining: number) => void;
		getFallback?: () => T;
	} = {},
): Promise<T> {
	if (times < 1) throw new RangeError('Invalid repetitions.');

	const { onEachCatch, onReattempt, getFallback } = options;

	while (times-- > 0) {
		try {
			const result = await fn();
			return result;
		} catch (err) {
			onEachCatch?.(times, Error.isError(err) ? err : new Error(err));
			if (times <= 0) {
				if (getFallback) return getFallback();
				throw err;
			}
			onReattempt?.(times);
		}
	}

	return undefined as never;
}
