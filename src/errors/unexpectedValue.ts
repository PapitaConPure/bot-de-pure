interface UnexpectedValueErrorOptions {
	expected?: string;
	received?: unknown;
}

export class UnexpectedValueError extends Error {
	#expected: string | undefined;
	#received: unknown;

	constructor(message?: string, options?: ErrorOptions & UnexpectedValueErrorOptions);
	constructor();
	constructor(message?: string, options?: ErrorOptions & UnexpectedValueErrorOptions) {
		const { expected, received } = options ?? {};

		let finalMessage = message;

		if (expected) finalMessage += `\nExpected: ${expected}`;

		if (received) finalMessage += `\nGot: ${received}`;

		super(finalMessage, options);
		this.#expected = expected;
		this.#received = received;
		this.name = UnexpectedValueError.name;
	}

	get expected() {
		return this.#expected;
	}

	get received() {
		return this.#received;
	}
}
