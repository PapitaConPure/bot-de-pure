import { readFileSync } from 'node:fs';
import { EnvVarError } from '@/errors/envVar';
import { getRuntimeEnvHint } from '@/utils/runtime';

let redacted = false;

export const databaseUri = {
	redact: () => {
		process.env.MONGODB_URI = undefined;
		process.env.MONGODB_PASSWORD = undefined;
		redacted = true;
		databaseUri.resolve = () => {
			throw new Error('Database URI was redacted.');
		};
		databaseUri.redact = () => {
			throw new Error('Database URI was already redacted.');
		};
	},
	resolve() {
		if (redacted) throw new Error('Access to this method was blocked by the application.');

		if (process.env?.MONGODB_URI) return process.env?.MONGODB_URI;

		if (process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD) {
			const config = getSecretConfig();
			return `mongodb://${config.username}:${config.password}@db-prod-local:27017/bot-prod-local?authSource=admin`;
		}

		const hint = getRuntimeEnvHint();
		throw new EnvVarError({ hint: `Missing MongoDB database environment variable.\n\n${hint}` });
	},
};

function getSecretConfig() {
	return JSON.parse(readFileSync('/run/secrets/mongo_config', 'utf-8'));
}
