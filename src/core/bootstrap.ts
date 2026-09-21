import { discordToken } from '../data/globalProps';
import * as events from '../events';
import { initializeClient } from './client';
import { databaseUri } from './db';

export async function bootstrap() {
	console.log('Inicializando bot...');

	databaseUri.resolve();

	console.time('Creación de cliente de Discord');
	const client = initializeClient();
	console.timeEnd('Creación de cliente de Discord');

	console.time('Registro de eventos de proceso');
	process.on('uncaughtException', events.onUncaughtException);
	process.on('unhandledRejection', events.onUnhandledRejection);
	process.on('SIGTERM', events.onShutdown);
	console.timeEnd('Registro de eventos de proceso');

	console.time('Registro de eventos del cliente');
	client.on('clientReady', events.onStartup);
	client.on('messageCreate', events.onMessage);
	client.on('messageReactionAdd', events.onReactionAdd);
	client.on('messageReactionRemove', events.onReactionRemove);
	client.on('messageUpdate', events.onMessageUpdate);
	client.on('messageDelete', events.onMessageDelete);
	client.on('interactionCreate', events.onInteraction);
	client.on('voiceStateUpdate', events.onVoiceUpdate);
	client.on('guildMemberAdd', events.onGuildMemberAdd);
	client.on('guildMemberRemove', events.onGuildMemberRemove);
	client.on('guildMemberUpdate', events.onGuildMemberUpdate);
	client.rest.on('rateLimited', events.onRateLimit);
	client.on('error', events.onCriticalError);

	client.login(discordToken);
	console.timeEnd('Registro de eventos del cliente');
}
