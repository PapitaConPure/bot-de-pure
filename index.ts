console.time('Carga de inicio');
import { initializeClient } from './core/client';
import * as events from './events';
import { discordToken } from './data/globalProps';
console.timeEnd('Carga de inicio');

console.time('Creación de cliente de Discord');
const client = initializeClient();
console.timeEnd('Creación de cliente de Discord');

console.time('Registro de eventos de proceso');
process.on('uncaughtException', events.onUncaughtException);
process.on('unhandledRejection', events.onUnhandledRejection);
console.timeEnd('Registro de eventos de proceso');

console.time('Registro de eventos del cliente');
client.on('clientReady', events.onStartup);
client.on('messageCreate', message => events.onMessage(message).catch(events.onCriticalError));
client.on('messageReactionAdd', (reaction, user) => events.onReactionAdd(reaction, user).catch(events.onCriticalError));
client.on('messageReactionRemove', (reaction, user) => events.onReactionRemove(reaction, user).catch(events.onCriticalError));
client.on('messageDelete', message => events.onMessageDelete(message).catch(events.onCriticalError));
client.on('interactionCreate', interaction => events.onInteraction(interaction).catch(events.onCriticalError));
client.on('voiceStateUpdate', (oldState, newState) => events.onVoiceUpdate(oldState, newState).catch(events.onCriticalError));
client.on('guildMemberAdd', member => { events.onGuildMemberAdd(member).catch(events.onCriticalError) });
client.on('guildMemberRemove', member => { events.onGuildMemberRemove(member).catch(events.onCriticalError) });
client.on('guildMemberUpdate', (oldMember, newMember) => { events.onGuildMemberUpdate(oldMember, newMember).catch(events.onCriticalError) });
client.rest.on('rateLimited', events.onRateLimit);

client.login(discordToken);
console.timeEnd('Registro de eventos del cliente');
