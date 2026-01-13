import { Guild, GuildTextBasedChannel } from 'discord.js';
import { lookupService } from 'dns';
import { promisify } from 'util';
import chalk from 'chalk';
import path from 'path';

const argv = require('minimist')(process.argv.slice(2));

export const remoteStartup: boolean = ((+!!argv.p) - (+!!argv.d)) > 0;

export const noDataBase: boolean = !!argv.nodb;

export const envPath = path.join(__dirname, remoteStartup ? '/remoteenv.json' : '../localenv.json');

//Claves
export const discordToken = process.env.I_LOVE_MEGUMIN ?? (require(envPath)?.token);
export const booruApiKey = process.env.BOORU_APIKEY ?? (require(envPath)?.booruapikey);
export const booruUserId = process.env.BOORU_USERID ?? (require(envPath)?.booruuserid);

//p_pure
export type PrefixPair = { raw: string; regex: RegExp; };
export const prefixes: Record<string, PrefixPair> = {
	'0': {
		raw: 'p!',
		regex: /^p *!\s*/i,
	}
};

let host;
export async function resolveHost() {
	try {
		const asyncLookupService = promisify(lookupService);
		const h = await asyncLookupService('127.0.0.1', 443);
		host = `${h.service}://${h.hostname}/`;
		confirm();
	} catch(err) {
		host = 'Desconocido';
		console.log(chalk.red('Fallido.'));
		console.error(err);
	}
}

export let globalConfigs = {
	maintenance: '',
	seed: 0,
	startupTime: 0,
	lechitauses: 0,
	tenshiColor: 6327283,
	tenshiAltColor: 12555492,
	slots: {
		slot1: null as Guild,
		slot2: null as Guild,
		slot3: null as Guild,
	},
	logch: null as GuildTextBasedChannel,

	reportFormUrl: 'https://forms.gle/tHFXxbsTmuJTQm1z7',

	pureTableImage: null,
	loademotes: {},
}
