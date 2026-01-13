console.time('Carga de inicio');
import { initializeClient } from './core/client';
import { registerCommandFiles } from './core/commandInit.js';
import { onCriticalError, onGuildMemberAdd, onGuildMemberRemove, onGuildMemberUpdate, onInteraction, onMessage, onMessageDelete, onRateLimit, onReactionAdd, onReactionRemove, onStartup, onUncaughtException, onUnhandledRejection, onVoiceUpdate } from './events/';
import { discordToken } from './data/globalProps';
console.timeEnd('Carga de inicio');

console.time('Creación de cliente de Discord');
const client = initializeClient();
console.timeEnd('Creación de cliente de Discord');

console.time('Detección de archivos de comando');
registerCommandFiles(false);
console.timeEnd('Detección de archivos de comando');

console.time('Registro de eventos de proceso');
process.on('uncaughtException', onUncaughtException);
process.on('unhandledRejection', onUnhandledRejection);
console.timeEnd('Registro de eventos de proceso');

console.time('Registro de eventos del cliente');
client.on('clientReady', onStartup);
client.on('messageCreate', message => onMessage(message).catch(onCriticalError));
client.on('messageReactionAdd', (reaction, user) => onReactionAdd(reaction, user).catch(onCriticalError));
client.on('messageReactionRemove', (reaction, user) => onReactionRemove(reaction, user).catch(onCriticalError));
client.on('messageDelete', message => onMessageDelete(message).catch(onCriticalError));
client.on('interactionCreate', interaction => onInteraction(interaction, client).catch(onCriticalError));
client.on('voiceStateUpdate', (oldState, newState) => onVoiceUpdate(oldState, newState).catch(onCriticalError));
client.on('guildMemberAdd', member => { onGuildMemberAdd(member).catch(onCriticalError) });
client.on('guildMemberRemove', member => { onGuildMemberRemove(member).catch(onCriticalError) });
client.on('guildMemberUpdate', (oldMember, newMember) => { onGuildMemberUpdate(oldMember, newMember).catch(onCriticalError) });
client.rest.on('rateLimited', onRateLimit);

client.login(discordToken);
console.timeEnd('Registro de eventos del cliente');
