const runtime = (() => {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// biome-ignore lint/suspicious/noTsIgnore: Comprobación de runtime
	//@ts-ignore Comprobación de runtime
	if (typeof Bun !== 'undefined') return 'bun';
	
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// biome-ignore lint/suspicious/noTsIgnore: Comprobación de runtime
	//@ts-ignore Comprobación de runtime
	if (typeof Deno !== 'undefined') return 'deno';
	
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// biome-ignore lint/suspicious/noTsIgnore: Comprobación de runtime
	//@ts-ignore Comprobación de runtime
	if (typeof process !== 'undefined' && process.versions?.node) return 'node';

	return 'unknown';
})();

export default runtime;

export function getRuntimeEnvHint() {
	switch (runtime) {
		case 'bun':
			return `Bun should auto-load .env files.
Make sure a .env.dev or .env.production file exists in the project root.`;

		case 'node':
			return `Node does NOT load .env automatically.

Run with:
node --env-file=.env.dev index.js
or
node --env-file=.env.production index.js

Or set the variable manually in your shell.`;

		case 'deno':
			return `Deno requires explicit permissions and env loading.

Run with:
deno run --allow-env --env-file=.env.dev index.ts
or
deno run --allow-env --env-file=.env.production index.ts`;

		default:
			return `Ensure the environment variable is set before running the app.`;
	}
}
