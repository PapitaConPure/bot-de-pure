export { onGuildMemberAdd } from './onGuildMemberAdd';
export { onGuildMemberRemove } from './onGuildMemberRemove';
export { onGuildMemberUpdate } from './onGuildMemberUpdate';
export { onInteraction } from './onInteraction';
export { onMessage } from './onMessage';
export { onMessageDelete } from './onMessageDelete';
export { onRateLimit } from './onRateLimit';
export { onReactionAdd } from './onReactionAdd';
export { onReactionRemove } from './onReactionRemove';
export { onStartup } from './onStartup';
export { onVoiceUpdate } from './onVoiceUpdate';
export { onShutdown, onUncaughtException, onUnhandledRejection } from './process';

import chalk from 'chalk';
import { auditError } from '../systems/others/auditor';

/**Cuando se recibe un error inesperado durante un evento asíncrono*/
export function onCriticalError(error: Error) {
	console.log(chalk.bgRed.whiteBright('Ocurrió un error de evento inesperado'));
	console.error(error);
	auditError(error, { brief: 'Se rechazó inesperadamente una promesa de evento', ping: true });
}
