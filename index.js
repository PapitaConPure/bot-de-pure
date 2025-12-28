console.time('Carga de inicio');
const globalConfigs = require('./localdata/config.json');
const argv = require('minimist')(process.argv.slice(2));
globalConfigs.remoteStartup = ((+!!argv.p) - (+!!argv.d)) > 0;
globalConfigs.noDataBase = argv.nodb;
//process.env.DP_FORCE_YTDL_MOD = "@distube/ytdl-core"

const { initializeClient } = require('./client');
const { registerCommandFiles } = require('./commandInit.js');
const { events, startupData, onCriticalError } = require('./events/events');
console.timeEnd('Carga de inicio');

// @ts-expect-error
globalConfigs.p_pure['0'] = { raw: 'p!', regex: /^p *!\s*/i };
globalConfigs.booruCredentials.apiKey = startupData.booruApiKey;
globalConfigs.booruCredentials.userId = startupData.booruUserId;

console.time('Creación de cliente de Discord');
const client = initializeClient();
console.timeEnd('Creación de cliente de Discord');

console.time('Detección de archivos de comando');
registerCommandFiles();
console.timeEnd('Detección de archivos de comando');

console.time('Registro de eventos de proceso');
process.on('uncaughtException', events.onUncaughtException);
process.on('unhandledRejection', events.onUnhandledRejection);
console.timeEnd('Registro de eventos de proceso');

console.time('Registro de eventos del cliente');
client.on('clientReady', events.onStartup);
client.on('messageCreate', message => events.onMessage(message, client).catch(onCriticalError));
client.on('messageReactionAdd', (reaction, user, details) => events.onReactionAdd(reaction, user, details).catch(onCriticalError));
client.on('messageReactionRemove', (reaction, user, details) => events.onReactionRemove(reaction, user, details).catch(onCriticalError));
client.on('messageDelete', message => events.onMessageDelete(message).catch(onCriticalError));
client.on('interactionCreate', interaction => events.onInteraction(interaction, client).catch(onCriticalError));
client.on('voiceStateUpdate', (oldState, newState) => events.onVoiceUpdate(oldState, newState).catch(onCriticalError));
client.on('guildMemberAdd', member => { events.onGuildMemberAdd(member).catch(onCriticalError) });
client.on('guildMemberRemove', member => { events.onGuildMemberRemove(member).catch(onCriticalError) });
client.on('guildMemberUpdate', (oldMember, newMember) => { events.onGuildMemberUpdate(oldMember, newMember).catch(onCriticalError) });
client.rest.on('rateLimited', events.onRateLimit);

client.login(startupData.discordToken);
console.timeEnd('Registro de eventos del cliente');
