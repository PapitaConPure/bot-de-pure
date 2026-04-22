import type {
	RESTPostAPIChatInputApplicationCommandsJSONBody,
	RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from 'discord.js';
import { Collection } from 'discord.js';
import type { ContextMenuAction } from '../actions/commons/actionBuilder';
import type { Command } from '../commands/commons';

const puré = {
	commands: new Collection<string, Command>(),
	actions: new Collection<string, ContextMenuAction>(),
	slash: new Collection<string, RESTPostAPIChatInputApplicationCommandsJSONBody>(),
	contextMenu: new Collection<string, RESTPostAPIContextMenuApplicationCommandsJSONBody>(),
} as const;

export default puré;
