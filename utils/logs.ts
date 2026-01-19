import chalk from 'chalk';
import { ValuesOf } from 'types';

const LogLevels = ({
	DEBUG: 0,
	INFO: 1,
	WARN: 2,
	ERROR: 3,
	FATAL: 4,
	CATAS: 5,
}) as const;

export type LogLevelKey = keyof typeof LogLevels;
export type LogLevel = ValuesOf<typeof LogLevels>;

/**@satisfies {Record<LogLevelKey, `{${LogLevelKey}}`>}*/
const LogLevelNames = ({
	DEBUG: '{DEBUG}',
	INFO: '{INFO}',
	WARN: '{WARN}',
	ERROR: '{ERROR}',
	FATAL: '{FATAL}',
	CATAS: '{CATAS}',
}) as const;

/**@satisfies {Record<LogLevelKey, chalk.Chalk>}*/
const LogLevelColors = ({
	DEBUG: chalk.white,
	INFO: chalk.blueBright,
	WARN: chalk.rgb(255, 140, 70),
	ERROR: chalk.redBright,
	FATAL: chalk.whiteBright.bgRgb(0, 0, 255),
	CATAS: chalk.whiteBright.bgRgb(0, 0, 255),
}) as const;

const longestLogLevelName = Object.values(LogLevelNames)
	.map(name => name.length)
	.reduce((a, b) => a > b ? a : b, 0);

const logLevelPrefix = (logLevel: LogLevelKey) => LogLevelColors[logLevel](LogLevelNames[logLevel].padEnd(longestLogLevelName));

const logLevelOutput = (logLevel: LogLevelKey, ...data) => LogLevelColors[logLevel](...data);

/**
 * @param {LogLevelKey} logLevel
 * @param {string} prefix
 */
export default function Logger(logLevel: LogLevelKey, prefix: string = '') {
	const LOG_LEVEL = LogLevels[logLevel];

	prefix = prefix.trim();
	if(!prefix.startsWith('['))
		prefix = '[' + prefix;
	if(!prefix.endsWith(']'))
		prefix = prefix + ']';
	prefix = chalk.cyanBright(prefix);

    /**
     * @description
     * Realiza auditoría de depuración.
     * Requiere un nivel de advertencias de "DEBUG".
     * @param data Los datos de interés del evento.
     */
	function debug(...data: unknown[]) {
		LOG_LEVEL <= LogLevels.DEBUG && console.log(logLevelPrefix('DEBUG'), prefix, logLevelOutput('DEBUG', ...data));
	}

    /**
     * @description
     * Realiza auditoría de información.
     * Requiere un nivel de advertencias hasta "INFO".
     * @param data Los datos de interés del evento.
     */
	function info(...data: unknown[]) {
		LOG_LEVEL <= LogLevels.INFO && console.info(logLevelPrefix('INFO'), prefix, logLevelOutput('INFO', ...data));
	}

    /**
     * @description
     * Realiza la auditoría de una advertencia.
     * Requiere un nivel de advertencias hasta "WARN".
     * @param data Los datos de interés del evento.
     */
	function warn(...data: unknown[]) {
		LOG_LEVEL <= LogLevels.WARN && console.warn(logLevelPrefix('WARN'), prefix, logLevelOutput('WARN', ...data));
	}

    /**
     * @description
     * Realiza la auditoría de un error junto a la pila de ejecución, sin arrojar el error.
     * La auditoría primaria requiere un nivel de advertencias hasta "ERROR".
     * @param err El error que ocasionó este evento.
     * @param data Los datos de interés del evento.
     */
	function error(err: Error, ...data: unknown[]) {
		LOG_LEVEL <= LogLevels.ERROR && console.error(logLevelPrefix('ERROR'), prefix, logLevelOutput('ERROR', err, ...data));
		console.error(err);
	}

    /**
     * @description
     * Realiza la auditoría de un error fatal junto a la pila de ejecución y arroja el error.
     * La auditoría primaria requiere un nivel de advertencias hasta "FATAL".
     * El error se arrojará sin importar el nivel de auditoría.
     * @param err El error que ocasionó este evento.
     * @param data Los datos de interés del evento.
     */
	function fatal(err: Error, ...data: unknown[]) {
		LOG_LEVEL <= LogLevels.FATAL && console.error(logLevelPrefix('FATAL'), prefix, logLevelOutput('FATAL', err, ...data));
		throw err;
	}

    /**
     * @description
     * Realiza la auditoría de un error fatal junto a la pila de ejecución y arroja el error.
     * Resultará en una auditoría y la interrupción del proceso sin importar el nivel de auditoría.
     * @param err El error que ocasionó este evento.
     * @param data Los datos de interés del evento.
     */
	function catastrophic(err: Error, ...data: unknown[]) {
		console.error(logLevelPrefix('CATAS'), prefix, logLevelOutput('CATAS', err, ...data));
		process.exit(1);
	}

	return { debug, info, warn, error, fatal, catastrophic };
}
