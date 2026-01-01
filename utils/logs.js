const chalk = require('chalk');

const LogLevels = /**@type {const}*/({
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4,
    CATAS: 5,
});
/**
 * @typedef {import('types').ValuesOf<LogLevels>} LogLevel
 */

/**@satisfies {Record<keyof LogLevels, `{${keyof LogLevels}}`>}*/
const LogLevelNames = /**@type {const}*/({
    DEBUG: '{DEBUG}',
    INFO: '{INFO}',
    WARN: '{WARN}',
    ERROR: '{ERROR}',
    FATAL: '{FATAL}',
    CATAS: '{CATAS}',
});

/**@satisfies {Record<keyof LogLevels, chalk.Chalk>}*/
const LogLevelColors = /**@type {const}*/({
    DEBUG: chalk.white,
    INFO: chalk.blueBright,
    WARN: chalk.rgb(255, 140, 70),
    ERROR: chalk.redBright,
    FATAL: chalk.whiteBright.bgRgb(0, 0, 255),
    CATAS: chalk.whiteBright.bgRgb(0, 0, 255),
});

const longestLogLevelName = Object.values(LogLevelNames)
    .map(name => name.length)
    .reduce((a, b) => a > b ? a : b, 0);

/**@param {keyof LogLevels} logLevel*/
const logLevelPrefix = logLevel => LogLevelColors[logLevel](LogLevelNames[logLevel].padEnd(longestLogLevelName));

/**@param {keyof LogLevels} logLevel*/
const logLevelOutput = (logLevel, ...data) => LogLevelColors[logLevel](...data);

/**
 * @param {keyof LogLevels} logLevel 
 * @param {string} prefix 
 */
function Logger(logLevel, prefix = '') {
    const LOG_LEVEL = LogLevels[logLevel];

    prefix = prefix.trim();
    if(!prefix.startsWith('['))
        prefix = '[' + prefix;
    if(!prefix.endsWith(']'))
        prefix = prefix + ']';
    prefix = chalk.cyanBright(prefix);

    /**
     * Realiza auditoría de depuración.
     * Requiere un nivel de advertencias de "DEBUG".
     * @param {Array<*>} data Los datos de interés del evento.
     */
    function debug(...data) {
        LOG_LEVEL <= LogLevels.DEBUG && console.log(logLevelPrefix('DEBUG'), prefix, logLevelOutput('DEBUG', ...data));
    }

    /**
     * Realiza auditoría de información.
     * Requiere un nivel de advertencias hasta "INFO".
     * @param {Array<*>} data Los datos de interés del evento.
     */
    function info(...data) {
        LOG_LEVEL <= LogLevels.INFO && console.info(logLevelPrefix('INFO'), prefix, logLevelOutput('INFO', ...data));
    }

    /**
     * Realiza la auditoría de una advertencia.
     * Requiere un nivel de advertencias hasta "WARN".
     * @param {Array<*>} data Los datos de interés del evento.
     */
    function warn(...data) {
        LOG_LEVEL <= LogLevels.WARN && console.warn(logLevelPrefix('WARN'), prefix, logLevelOutput('WARN', ...data));
    }

    /**
     * Realiza la auditoría de un error junto a la pila de ejecución, sin arrojar el error.
     * La auditoría primaria requiere un nivel de advertencias hasta "ERROR".
     * @param {Error} err El error que ocasionó este evento.
     * @param {Array<*>} data Los datos de interés del evento.
     */
    function error(err, ...data) {
        LOG_LEVEL <= LogLevels.ERROR && console.error(logLevelPrefix('ERROR'), prefix, logLevelOutput('ERROR', err, ...data));
        console.error(err);
    }

    /**
     * Realiza la auditoría de un error fatal junto a la pila de ejecución y arroja el error
     * La auditoría primaria requiere un nivel de advertencias hasta "FATAL".
     * El error se arrojará sin importar el nivel de auditoría.
     * @param {Error} err El error que ocasionó este evento.
     * @param {Array<*>} data Los datos de interés del evento.
     */
    function fatal(err, ...data) {
        LOG_LEVEL <= LogLevels.FATAL && console.error(logLevelPrefix('FATAL'), prefix, logLevelOutput('FATAL', err, ...data));
        throw err;
    }

    /**
     * Realiza la auditoría de un error fatal junto a la pila de ejecución y arroja el error
     * Resultará en una auditoría y la interrupción del proceso sin importar el nivel de auditoría.
     * @param {Error} err El error que ocasionó este evento.
     * @param {Array<*>} data Los datos de interés del evento.
     */
    function catastrophic(err, ...data) {
        console.error(logLevelPrefix('CATAS'), prefix, logLevelOutput('CATAS', err, ...data));
        process.exit(1);
    }

    return { debug, info, warn, error, fatal, catastrophic };
}

module.exports = Logger;
