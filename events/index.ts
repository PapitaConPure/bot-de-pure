export { onUncaughtException, onUnhandledRejection } from './process';
export { onStartup } from './onStartup';
export { onMessage } from './onMessage';
export { onReactionAdd } from './onReactionAdd';
export { onReactionRemove } from './onReactionRemove';
export { onMessageDelete } from './onMessageDelete';
export { onInteraction } from './onInteraction';
export { onVoiceUpdate } from './onVoiceUpdate';
export { onRateLimit } from './onRateLimit';
export { onGuildMemberAdd } from './onGuildMemberAdd';
export { onGuildMemberRemove } from './onGuildMemberRemove';
export { onGuildMemberUpdate } from './onGuildMemberUpdate';
import { auditError } from '../systems/others/auditor';
import chalk from 'chalk';

/**Cuando se recibe un error inesperado durante un evento asíncrono*/
export function onCriticalError(error: Error) {
	console.log(chalk.bgRed.whiteBright('Ocurrió un error de evento inesperado'));
	console.error(error);
	auditError(error, { brief: 'Se rechazó inesperadamente una promesa de evento', ping: true });
}
