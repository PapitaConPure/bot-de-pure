const { onUncaughtException, onUnhandledRejection } = require('./process');
const { onStartup, discordToken, booruApiKey, booruUserId } = require('./onStartup');
const { onMessage } = require('./onMessage');
const { onReactionAdd } = require('./onReactionAdd');
const { onReactionRemove } = require('./onReactionRemove');
const { onMessageDelete } = require('./onMessageDelete');
const { onInteraction } = require('./onInteraction');
const { onVoiceUpdate } = require('./onVoiceUpdate');
const { onRateLimit } = require('./onRateLimit');
const { onGuildMemberAdd } = require('./onGuildMemberAdd');
const { onGuildMemberRemove } = require('./onGuildMemberRemove');
const { onGuildMemberUpdate } = require('./onGuildMemberUpdate');
const { auditError } = require('../systems/others/auditor');
const chalk = require('chalk');

/**
 * Cuando se recibe un error inesperado durante un evento asíncrono
 * @param {Error} error 
 */
function onCriticalError(error) {
    console.log(chalk.bgRed.whiteBright('Ocurrió un error de evento inesperado'));
    console.error(error);
    auditError(error, { brief: 'Se rechazó inesperadamente una promesa de evento', ping: true });
}

module.exports = {
    events: {
        onUncaughtException,
        onUnhandledRejection,
        onStartup,
        onMessage,
        onReactionAdd,
        onReactionRemove,
        onMessageDelete,
        onInteraction,
        onVoiceUpdate,
        onRateLimit,
        onGuildMemberAdd,
        onGuildMemberRemove,
        onGuildMemberUpdate,
    },
    startupData: {
        discordToken,
        booruApiKey,
        booruUserId,
    },
    onCriticalError,
};
