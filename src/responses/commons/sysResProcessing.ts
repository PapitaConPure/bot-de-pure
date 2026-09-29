import type { AnyCommandInteraction } from 'types/commands';
import {
	handleAndAuditError,
	handleComponentInteractionPermissions,
	handleHuskInteraction,
	handleUnknownInteraction,
} from '@/commands/commons';
import puré from '@/core/puréRegistry';
import Logger from '@/utils/logs';

const { debug, fatal } = Logger('DEBUG', 'SystemResponse');

export async function handleSystemInteraction(interaction: AnyCommandInteraction): Promise<void> {
	const stream = interaction.customId.slice(1).split('_');
	const systemName = stream.shift();
	const responseFnName = stream.shift();

	if (!systemName || !responseFnName) {
		debug(
			`Auto-System Interaction under the ID: "${interaction.id}" had a malformed custom ID: "${interaction.customId}".`,
		);
		return handleUnknownInteraction(interaction);
	}

	try {
		const system = puré.systems.get(systemName);
		if (!system)
			return fatal(
				new Error(`Auto-system "${systemName}" was not registered before action handling.`),
			);

		debug(
			`Received a genuine Component interaction for Auto-System "${systemName}", function "${responseFnName}", under the ID: "${interaction.id}".`,
		);
		debug(
			`The Component interaction "${interaction.id}" has the following arguments: [ ${stream.join(', ')} ]`,
		);

		const requestString = `!${systemName} -=-{\`${responseFnName}\`}`;

		if (!interaction.inCachedGuild()) {
			const globalResponseFn = system.getGlobalResponseFn(responseFnName);
			if (!globalResponseFn) return handleHuskInteraction(interaction);

			const hasPermission = await handleComponentInteractionPermissions(
				interaction,
				globalResponseFn.permissions,
				requestString,
			);
			if (!hasPermission) return;

			await globalResponseFn(interaction);
			return;
		}

		const responseFn = system.getResponseFn(responseFnName);
		if (!responseFn) return handleHuskInteraction(interaction);

		const hasPermission = await handleComponentInteractionPermissions(
			interaction,
			responseFn.permissions,
			requestString,
		);
		if (!hasPermission) return;

		await responseFn(interaction, ...stream);
	} catch (error) {
		handleAndAuditError(error, interaction, {
			details: `!${systemName}`,
		});
	}
}
