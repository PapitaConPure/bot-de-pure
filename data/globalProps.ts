import { Guild, GuildTextBasedChannel } from 'discord.js';
import { lookupService } from 'dns';
import { promisify } from 'util';
import chalk from 'chalk';
import path from 'path';
import { color } from 'bun';

import minimist from 'minimist';
const argv = minimist(process.argv.slice(2));


//Entorno
export const remoteStartup: boolean = ((+!!argv.p) - (+!!argv.d)) > 0;

export const noDataBase: boolean = !!argv.nodb;

export const envPath = path.join(__dirname, remoteStartup ? '../remoteenv.json' : '../localenv.json');


//Claves
export const discordToken = process.env.I_LOVE_MEGUMIN ?? (require(envPath)?.token);
export const booruApiKey = process.env.BOORU_APIKEY ?? (require(envPath)?.booruapikey);
export const booruUserId = process.env.BOORU_USERID ?? (require(envPath)?.booruuserid);


//Prefijos
export type PrefixPair = { raw: string; regex: RegExp; };
export const prefixes: Record<string, PrefixPair> = {
	'0': {
		raw: 'p!',
		regex: /^p *!\s*/i,
	}
};


//Host
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


//Constantes varias
/**@description Color de Tenshi — Celestial.*/
export const tenshiColor = 0x608cf3;

/**
 * @description Color alternativo de Tenshi — Lavanda.
 * @returns #bf94e4
 */	
export const tenshiAltColor = color('#bf94e4', 'number');

/**@description Color de resalte de Tenshi — Durazno.*/
export const tenshiPeachColor = 0xffe286;

/**@description Formulario de Google para reporte de errores y dudas.*/
export const reportFormUrl = 'https://forms.gle/tHFXxbsTmuJTQm1z7';


/**
 * @description
 * Propiedades globales configurables (no necesariamente persistentes / relacionadas a la BDD).
 * Modificar propiedades de `globalConfigs` reflejará los cambios en todos los archivos.
 */
export const globalConfigs = {
	maintenance: '',
	seed: 0,
	startupTime: 0,
	lechitauses: 0,
	slots: {
		slot1: null as Guild,
		slot2: null as Guild,
		slot3: null as Guild,
	},
	logch: null as GuildTextBasedChannel,
	pureTableImage: null,
	loademotes: {},
}
