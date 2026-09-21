import type {
	Interaction,
	MessageContextMenuCommandInteraction,
	UserContextMenuCommandInteraction,
} from 'discord.js';
import { handleAndAuditError } from '@/commands/commons/commandExceptions';
import { type CommandResult, CommandResults } from '@/commands/commons/commandProcessing';
import {
	handleAutocompleteInteraction,
	handleBlockedInteraction,
	handleComponent,
	handleSlashCommand,
	handleUnknownInteraction,
} from '@/commands/commons/interactionProcessing';
import { countGlobalStat } from '@/systems/others/statsCount';
import { channelIsBlocked, isUsageBanned } from '@/utils/discord';
import Logger from '@/utils/logs';
import puré from '../core/puréRegistry';
import { auditRequest } from '../systems/others/auditor';

const { debug, fatal } = Logger('DEBUG', 'Interaction');

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

async function handleAction(
	interaction:
		| UserContextMenuCommandInteraction<'cached'>
		| MessageContextMenuCommandInteraction<'cached'>,
): Promise<CommandResult> {
	const { commandName } = interaction;

	const contextMenu = puré.contextMenu.get(commandName);
	if (!contextMenu) return CommandResults.VOID;

	try {
		const action = puré.actions.get(commandName);

		if (!action)
			return fatal(
				new Error(`Action '${commandName}' was not registered before action handling.`),
			);

		debug(
			`Received a genuine context menu interaction for "${interaction.commandName}" under the ID: "${interaction.id}". The associated Action will execute promptly.`,
		);

		await action.execute(interaction);
		return CommandResults.SUCCEEDED;
	} catch (error) {
		const isPermissionsError = handleAndAuditError(error, interaction, {
			details: `/${commandName}`,
		});
		if (!isPermissionsError) return CommandResults.FAILED;
	}

	return CommandResults.VOID;
}
