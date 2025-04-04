const { onStartup, discordToken, booruApiKey, booruUserId } = require('../events/onStartup.js');
const { onMessage } = require('../events/onMessage.js');
const { onReactionAdd } = require('../events/onReactionAdd.js');
const { onReactionRemove } = require('../events/onReactionRemove.js');
const { onMessageDelete } = require('../events/onMessageDelete.js');
const { onInteraction } = require('../events/onInteraction.js');
const { onVoiceUpdate } = require('../events/onVoiceUpdate.js');
const { onRateLimit } = require('../events/onRateLimit.js');
const { onGuildMemberAdd } = require('../events/onGuildMemberAdd.js');
const { onGuildMemberRemove } = require('../events/onGuildMemberRemove.js');
const { onGuildMemberUpdate } = require('../events/onGuildMemberUpdate.js');
const { auditError } = require('../systems/others/auditor.js');
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