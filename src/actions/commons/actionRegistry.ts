import type { ContextMenuCommandType } from 'discord.js';
import { ContextMenuCommandBuilder, InteractionContextType } from 'discord.js';
import puré from '@/core/puréRegistry';
import type { ContextMenuAction as Action } from './actionBuilder';

interface ActionRegistryLogTableRow {
	name: string;
	type: string;
	tid: string | null;
}

export function registerActions(actions: Action[], log: boolean = false) {
	const actionTableStack: ActionRegistryLogTableRow[] = [];

	for (const action of actions) {
		puré.actions.set(action.name, action);

		log
			&& actionTableStack.push({
				name: action.name,
				type: `${action.type}`,
				tid: null,
			});

		const contextMenu = new ContextMenuCommandBuilder()
			.setName(action.name)
			.setType(action.type as ContextMenuCommandType)
			.setContexts(InteractionContextType.Guild);

		for (const [localeId, localizedName] of action.localizations)
			contextMenu.setNameLocalization(localeId, localizedName);

		puré.contextMenu.set(action.name, contextMenu.toJSON());
	}

	log && console.table(actionTableStack);
}
