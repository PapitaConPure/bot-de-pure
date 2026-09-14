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

export async function attemptManyTimes(fn: () => Promise<unknown>, times: number): Promise<void> {
	try {
		times--;
		await fn();
	} catch (err) {
		if (times < 0) throw err;
	}
}
