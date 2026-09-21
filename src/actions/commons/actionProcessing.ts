import type {
	MessageContextMenuCommandInteraction,
	UserContextMenuCommandInteraction,
} from 'discord.js';
import { type CommandResult, CommandResults, handleAndAuditError } from '@/commands/commons';
import puré from '@/core/puréRegistry';
import Logger from '@/utils/logs';

const { debug, fatal } = Logger('DEBUG', 'Interaction');

export async function handleAction(
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
