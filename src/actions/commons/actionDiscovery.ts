import { getModuleNames, readdirFromSync } from '@/utils/runtimeFs';
import { ContextMenuAction as Action } from './actionBuilder';

export const actionFilenames = getModuleNames(readdirFromSync(import.meta.url, '../instances'));

interface FetchActionOptions {
	filter?: (command: Action) => boolean;
}

/**@throws {FetchActionError}*/
export async function fetchActionsFromFiles(): Promise<Action[]>;
/**@throws {FetchActionError}*/
export async function fetchActionsFromFiles(options: FetchActionOptions): Promise<Action[]>;
export async function fetchActionsFromFiles(options: FetchActionOptions = {}): Promise<Action[]> {
	const { filter = null } = options;

	const matches: Action[] = [];

	const pushOrDiscard = (command: Action) => {
		let isValid: boolean = true;
		isValid &&= filter == null || filter(command);

		if (isValid) matches.push(command);
	};

	const commandModules = await Promise.all(
		actionFilenames.map(async (filename) => ({
			filename,
			commandModule: await import(`../instances/${filename}`),
		})),
	);

	for (const { filename, commandModule } of commandModules) {
		if (commandModule instanceof Action) pushOrDiscard(commandModule);
		else if (commandModule.default instanceof Action) pushOrDiscard(commandModule.default);
		else if (commandModule.command instanceof Action) pushOrDiscard(commandModule.command);
		else
			throw new FetchActionError(
				`No se encontró un comando en el módulo: ${filename} desde ${__dirname}`,
			);
	}

	return matches;
}

export class FetchActionError extends Error {
	constructor();
	constructor(message: string);
	constructor(message?: string) {
		super(message);
		this.name = 'FetchActionError';
	}
}
