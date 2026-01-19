import { Guild, GuildTextBasedChannel } from 'discord.js';
import { lookupService } from 'dns';
import { promisify } from 'util';
import path from 'path';
import { color } from 'bun';

import minimist from 'minimist';
const argv = minimist(process.argv.slice(2));


//Entorno
/**@description Si se está en un entorno de producción (`true`) o de desarrollo (`false`, por defecto).*/
export const remoteStartup: boolean = ((+!!argv.p) - (+!!argv.d)) > 0;

/**@description Si está prohibido el uso de base de datos (`true`) o permitido (`false`, por defecto).*/
export const noDataBase: boolean = !!argv.nodb;

/**
 * @description
 * La ruta hacia el .env casero cagada que hice para entornos locales (varía según {@linkcode remoteStartup}).
 *
 * Mamá: "tenemos .env en casa"
 *
 * El .env:
 */
export const envPath: string = path.join(__dirname, remoteStartup ? '../remoteenv.json' : '../localenv.json');


//Claves
/**
 * @description
 * El token de bot de Discord a usar para el proceso actual.
 *
 * ⚠️ **ATENCIÓN**: Si eres un desarrollador y estás hosteando una copia de Bot de Puré por tu cuenta,
 * **NO** introduzcas tu token aquí. En cambio, sigue las instrucciones en el GitHub de Bot de Puré e
 * introduce un token para una cuenta de bot de producción en `remoteenv.json` o un token para una cuenta
 * de bot de pruebas en `localenv.json`.
 *
 * @see https://github.com/PapitaConPure/bot-de-pure
 */
export const discordToken: string = process.env.I_LOVE_MEGUMIN ?? (require(envPath)?.token);

/**
 * @description
 * La clave de API de Gelbooru a usar para el proceso actual.
 *
 * ⚠️ **ATENCIÓN**: Si eres un desarrollador y estás hosteando una copia de Bot de Puré por tu cuenta,
 * **NO** introduzcas la clave aquí. En cambio, sigue las instrucciones en el GitHub de Bot de Puré e
 * introduce una clave de producción en `remoteenv.json` o una clave de pruebas en `localenv.json`.
 *
 * @see https://github.com/PapitaConPure/bot-de-pure
 * @see https://gelbooru.com/index.php?page=wiki&s=view&id=18780
 */
export const booruApiKey: string = process.env.BOORU_APIKEY ?? (require(envPath)?.booruapikey);

/**
 * @description
 * La ID de usuario de Gelbooru a usar para el proceso actual.
 *
 * ⚠️ **ATENCIÓN**: Si eres un desarrollador y estás hosteando una copia de Bot de Puré por tu cuenta,
 * **NO** introduzcas la ID aquí. En cambio, sigue las instrucciones en el GitHub de Bot de Puré e
 * introduce una ID de producción en `remoteenv.json` o una ID de pruebas en `localenv.json`.
 *
 * @see https://github.com/PapitaConPure/bot-de-pure
 * @see https://gelbooru.com/index.php?page=wiki&s=view&id=18780
 */
export const booruUserId: string = process.env.BOORU_USERID ?? (require(envPath)?.booruuserid);


//Prefijos
export type PrefixPair = { raw: string; regex: RegExp; };
export const prefixes: Record<string, PrefixPair> = {
	'0': {
		raw: 'p!',
		regex: /^p *!\s*/i,
	}
};


//Host
/**@description El nombre de host del proceso corriendo a Bot de Puré actualmente.*/
let hostname: string;

/**@description Obtiene el nombre de host del proceso corriendo a Bot de Puré actualmente.*/
export function getHostName() {
	if(hostname == null)
		throw new ReferenceError('Debes llamar resolveHost() antes de getHostName()');

	return hostname;
}

interface ResolveHostOptions {
	/**@description El nombre a darle a `hostname` si falla la resolución de nombre de host, en lugar de arrojar el error que ocasionó el fallo.*/
	fallback?: string;
	/**@description Un handler para cuando el nombre de host se resuelve correctamente.*/
	onSuccess?: (hostname: string) => unknown;
	/**@description Un handler por si falla la resolución de nombre de host, en lugar de arrojar el error que ocasionó el fallo.*/
	onFailure?: (err: Error) => unknown;
}

/**
 * @description Intenta resolver el nombre de host del proceso y establecerlo en la variable `hostname`.
 * @param options Opciones para el comportamiento al intentar resolver el nombre de host.
 */
export async function resolveHost(options: ResolveHostOptions = {}) {
	const {
		fallback = null,
		onSuccess = () => undefined,
		onFailure = () => undefined,
	} = options;

	try {
		const asyncLookupService = promisify(lookupService);
		const h = await asyncLookupService('127.0.0.1', 443);

		hostname = `${h.service}://${h.hostname}/`;
		onSuccess(hostname);
	} catch(err) {
		if(fallback == null && onFailure == null)
			throw err;

		hostname = fallback;
		onFailure(err);
	}
}


//Constantes varias
/**
 * @description Color de Tenshi — Celestial.
 * @returns #608cf3
 */
export const tenshiColor = color('#608cf3', 'number');

/**
 * @description Color alternativo de Tenshi — Lavanda.
 * @returns #bf94e4
 */
export const tenshiAltColor = color('#bf94e4', 'number');

/**
 * @description Color de resalte de Tenshi — Durazno.
 * @returns #ffe286
 */
export const tenshiPeachColor = color('#ffe286', 'number');

/**
 * @description
 * Formulario de Google para reporte de errores y dudas.
 *
 * ⚠️ **ATENCIÓN**: Si eres un desarrollador y estás hosteando una copia de Bot de Puré por tu cuenta,
 * usa un enlace diferente para esta constante (uno que te pertenezca).
 */
export const reportFormUrl = 'https://forms.gle/tHFXxbsTmuJTQm1z7';

/**
 * @description
 * Propiedades globales configurables (no necesariamente persistentes / relacionadas a la BDD).
 * Modificar propiedades de `globalConfigs` reflejará los cambios en todos los archivos.
 */
export const globalConfigs = {
	/**
	 * @description
	 * Controla la ejecución de comandos. Indica un modo de mantenimiento:
	 *
	 * * Si es un string vacío, no se está en mantenimiento de ninguna manera, así que no se bloquea la ejecución de comandos en ningún canal.
	 * * Si el valor comienza con `!`, se bloquea la ejecución de comandos en el canal con la ID después del `!` de la variable.
	 * * Si el valor no comienza con !, se bloquea la ejecución de comandos en todos los canales excepto aquel con una ID equivalente al valor de la variable.
	 */
	maintenance: '',
	/**@description Semilla para valores aleatorios.*/
	seed: 0,
	/**@description Fecha a la que se inició este proceso del bot.*/
	startupTime: 0,
	/**@description (Compatibilidad). Controla los usos globales del comando p!leche.*/
	lechitauses: 0,
	/**@description Servidores de Discords para utilidades varias de Bot de Puré.*/
	slots: {
		slot1: null as Guild,
		slot2: null as Guild,
		slot3: null as Guild,
	},
	/**@description Canal de logs de Bot de Puré.*/
	logch: null as GuildTextBasedChannel,
	/**@description Imagen de fondo de la Tabla de Puré.*/
	pureTableImage: null,
	/**@description Emojis cargados en memoria.*/
	loademotes: {},
};
