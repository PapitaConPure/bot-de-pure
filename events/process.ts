import { auditError } from '../systems/others/auditor';
import { shortenText } from '../func';

import Logger from '../utils/logs';
const { warn, error, fatal, catastrophic } = Logger('WARN', 'PROCESO');

export async function onUncaughtException(err: Error, origin: NodeJS.UncaughtExceptionOrigin) {
	err = new UnhandledRejectionError(err, `${err}`);

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

		fatal(err, origin);
	} catch {
		catastrophic(err, origin);
	}
}

export async function onUnhandledRejection(reason: unknown, promise: Promise<unknown>) {
	const err = new UnhandledRejectionError(new Error(`${reason}`), `${reason}`);

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

		error(err, reason, promise);
	} catch {
		catastrophic(err, reason, promise);
	}
}

class UnhandledRejectionError extends Error {
	constructor(parent: Error, message: string = null) {
		super(message, { cause: parent });
		this.name = 'UnhandledRejectionError';
	}
}
