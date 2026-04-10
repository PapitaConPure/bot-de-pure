import { PureVoiceUpdateHandler, getOrchestrator } from '../systems/others/purevoice.js';

export async function onVoiceUpdate(oldState: import('discord.js').VoiceState, state: import('discord.js').VoiceState) {
	const guildId = state.guild.id;

	const updateHandler = new PureVoiceUpdateHandler(oldState, state);
	const orchestrator = getOrchestrator(guildId);
	orchestrator.orchestrateUpdate(updateHandler);
}
