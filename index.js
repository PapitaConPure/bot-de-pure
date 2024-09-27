console.time('Carga de inicio');
const globalConfigs = require('./localdata/config.json');
const argv = require('minimist')(process.argv.slice(2));
globalConfigs.remoteStartup = ((+!!argv.p) - (+!!argv.d)) > 0;

const client = require('./client.js');
const { registerCommandFiles } = require('./commandInit.js');
const { events, startupData, onCriticalError } = require('./events/events.js');

// @ts-ignore
globalConfigs.p_pure['0'] = { raw: 'p!', regex: /^[Pp] *![\n ]*/ };
globalConfigs.booruCredentials.apiKey = startupData.booruApiKey;
globalConfigs.booruCredentials.userId = startupData.booruUserId;
console.timeEnd('Carga de inicio');

console.time('Detección de archivos de comando');
registerCommandFiles(client);
console.timeEnd('Detección de archivos de comando');

console.time('Registro de eventos del cliente');
client.on('ready', events.onStartup);

client.on('messageCreate', message => events.onMessage(message, client).catch(onCriticalError));

client.on('interactionCreate', interaction => events.onInteraction(interaction, client).catch(onCriticalError));

client.on('voiceStateUpdate', (oldState, newState) => events.onVoiceUpdate(oldState, newState).catch(onCriticalError));

client.on('guildMemberAdd', member => { events.onGuildMemberAdd(member).catch(onCriticalError) });

client.on('guildMemberRemove', member => { events.onGuildMemberRemove(member).catch(onCriticalError) });

client.on('guildMemberUpdate', (oldMember, newMember) => { events.onGuildMemberUpdate(oldMember, newMember).catch(onCriticalError) });

client.rest.on('rateLimited', events.onRateLimit);

client.login(startupData.discordToken);
console.timeEnd('Registro de eventos del cliente');