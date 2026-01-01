const { auditError } = require('../systems/others/auditor');
const Logger = require('../utils/logs');
const { shortenText } = require('../func');

const { warn, error, fatal, catastrophic } = Logger('WARN', 'PROCESO',);

/**
 * @param {Error} err 
 */
async function onUncaughtException(err) {
	const lookups = [
		err.message,
		err.cause == null ? null : `${err.cause}`,
		err.stack,
	].filter(l => l);
	if(lookups.some(l => l.includes('ECONNRESET') || l.includes('terminated'))) {
		warn('ECONNRESET RECIBIDO');
		return;
	}

	try {
		const details = 'CAPTURA GLOBAL DE RESPALDO EFECTUADA'
			+ `\n${err.cause || err.stack || '<No hay información adicional>'}`;
		await auditError(err, {
			brief: '💀 EXCEPCIÓN NO CAPTURADA 💀',
			details: shortenText(details, 1000),
			ping: true,
		});

		fatal(err);
	} catch {
		catastrophic(err);
	}
}

/**
 * @param {unknown} reason 
 * @param {Promise<unknown>} promise 
 */
async function onUnhandledRejection(reason, promise) {
	const err = new UnhandledRejectionError(`${reason}`);

	if(err.message.includes('ECONNRESET') || err.message.includes('terminated')) {
		warn('ECONNRESET RECIBIDO');
		return;
	}

	try {
		const details = 'CAPTURA GLOBAL DE RESPALDO EFECTUADA'
			+ `\n${promise}`;
		await auditError(err, {
			brief: '💀 PROMESA RECHAZADA INESPERADAMENTE 💀',
			details: shortenText(details, 1000),
			ping: true,
		});

		error(err);
	} catch {
		catastrophic(err);
	}
}

class UnhandledRejectionError extends Error {
	/**
	 * @param {string} [message]
	 */
	constructor(message = null) {
		super(message);
		this.name = 'UnhandledRejectionError';
	}
}

module.exports = {
	onUncaughtException,
	onUnhandledRejection,
};
