const { PureVoiceUpdateHandler, PureVoiceOrchestrator } = require('../systems/others/purevoice.js');
const chalk = require('chalk');

/**@type {Map<String, PureVoiceOrchestrator>}*/
const orchestrators = new Map();

/**
 * 
 * @param {import('discord.js').VoiceState} oldState 
 * @param {import('discord.js').VoiceState} state 
 */
async function onVoiceUpdate(oldState, state) {
    const guildId = state.guild.id;
    const pv = new PureVoiceUpdateHandler(oldState, state);
    const orchestrator = orchestrators.get(guildId) || new PureVoiceOrchestrator(guildId);
    orchestrator.orchestrate(pv)
    if(!orchestrators.has(guildId))
        orchestrators.set(guildId, orchestrator);
    
    return Promise.resolve();
}

module.exports = {
    onVoiceUpdate,
}