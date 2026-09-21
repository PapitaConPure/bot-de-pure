import type { Interaction } from 'discord.js';
import { handleAction } from '@/actions/commons/actionProcessing';
import {
	type CommandResult,
	CommandResults,
	handleAutocompleteInteraction,
	handleBlockedInteraction,
	handleComponent,
	handleSlashCommand,
	handleUnknownInteraction,
} from '@/commands/commons';
import { auditRequest } from '@/systems/others/auditor';
import { countGlobalStat } from '@/systems/others/statsCount';
import { channelIsBlocked, isUsageBanned } from '@/utils/discord';
import Logger from '@/utils/logs';

const { debug } = Logger('DEBUG', 'Interaction');

export async function onInteraction(interaction: Interaction): Promise<void> {
	if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
		if (await isUsageBanned(interaction.user))
			return handleBlockedInteraction(interaction).catch(console.error);

		return handleComponent(interaction);
	}

	if (!interaction.inCachedGuild())
		return handleBlockedInteraction(interaction).catch(console.error);

	const { channel, user } = interaction;

	if (channelIsBlocked(channel) || (await isUsageBanned(user)))
		return handleBlockedInteraction(interaction).catch(console.error);

	if (interaction.isAutocomplete()) return handleAutocompleteInteraction(interaction);

	auditRequest(interaction);

	let commandResult: CommandResult | undefined;
	if (interaction.isChatInputCommand()) commandResult = await handleSlashCommand(interaction);
	if (interaction.isContextMenuCommand()) commandResult = await handleAction(interaction);

	if (commandResult == null) {
		debug(`Interaction of type «${interaction.type}» is not yet supported.`);
		return handleUnknownInteraction(interaction);
	}

	switch (commandResult) {
		case CommandResults.SUCCEEDED:
			countGlobalStat('commands.succeeded');
			break;
		case CommandResults.FAILED:
			countGlobalStat('commands.failed');
			break;
	}
}
