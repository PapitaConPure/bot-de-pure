import { getModuleNames, readdirFromSync } from '@/utils/runtimeFs';
import type { CommandTagResolvable } from './cmdTags';
import { Command } from './commandBuilder';

export const commandFilenames = getModuleNames(readdirFromSync(import.meta.url, '../instances'));

interface FetchCommandOptions {
	includeTags?: CommandTagResolvable | CommandTagResolvable[];
	excludeTags?: CommandTagResolvable | CommandTagResolvable[];
	filter?: (command: Command) => boolean;
}

/**@throws {FetchCommandError}*/
export async function fetchCommandsFromFiles(): Promise<Command[]>;
/**@throws {FetchCommandError}*/
export async function fetchCommandsFromFiles(options: FetchCommandOptions): Promise<Command[]>;
export async function fetchCommandsFromFiles(
	options: FetchCommandOptions = {},
): Promise<Command[]> {
	const { includeTags = null, excludeTags = null, filter = null } = options;

	const matches: Command[] = [];

	const pushOrDiscard = (command: Command) => {
		let isValid: boolean = true;
		isValid &&= includeTags == null || command.tags.has(includeTags);
		isValid &&= excludeTags == null || !command.tags.has(excludeTags);
		isValid &&= filter == null || filter(command);

		if (isValid) matches.push(command);
	};

	const commandModules = await Promise.all(
		commandFilenames.map(async (filename) => ({
			filename,
			commandModule: await import(`../instances/${filename}`),
		})),
	);

	for (const { filename, commandModule } of commandModules) {
		if (commandModule instanceof Command) pushOrDiscard(commandModule);
		else if (commandModule.default instanceof Command) pushOrDiscard(commandModule.default);
		else if (commandModule.command instanceof Command) pushOrDiscard(commandModule.command);
		else
			throw new FetchCommandError(
				`No se encontró un comando en el módulo: ${filename} desde ${__dirname}`,
			);
	}

	return matches;
}

export class FetchCommandError extends Error {
	constructor();
	constructor(message: string);
	constructor(message: string = undefined) {
		super(message);
		this.name = 'FetchCommandError';
	}
}
