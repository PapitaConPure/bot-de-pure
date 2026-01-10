const { PureVoiceUpdateHandler, getOrchestrator } = require('../systems/others/purevoice.js');

/**
 * Procesado de sistema PuréVoice
 * @param {import('discord.js').VoiceState} oldState 
 * @param {import('discord.js').VoiceState} state 
 */
async function onVoiceUpdate(oldState, state) {
	const guildId = state.guild.id;

	const updateHandler = new PureVoiceUpdateHandler(oldState, state);
	const orchestrator = getOrchestrator(guildId);
	orchestrator.orchestrateUpdate(updateHandler);
}

module.exports = {
	onVoiceUpdate,
}
