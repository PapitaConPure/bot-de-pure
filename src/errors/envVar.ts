export class EnvVarError extends Error {
	constructor(expected: string | { hint: string }) {
		if (typeof expected === 'string')
			super(
				[
					`Couldn't find an environment variable for: ${expected}.`,
					`Make sure you properly created a ${process.env.NODE_ENV === 'production' ? '".env.production"' : '".env.dev"'} file on the root directory before running the application.`,
					`Also check if you properly wrote the name "${expected}" and you assigned a corresponding value after the "=" operator`,
				].join('\n'),
			);
		else super(expected.hint);
	}
}
