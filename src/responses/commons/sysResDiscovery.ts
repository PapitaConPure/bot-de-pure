import { getModuleNames, readdirFromSync } from '@/utils/runtimeFs';
import { AutoSystem } from './sysResBuilder';

export const actionFilenames = getModuleNames(readdirFromSync(import.meta.url, '../instances'));

interface FetchAutoSystemOptions {
	filter?: (system: AutoSystem<string>) => boolean;
}

/**@throws {FetchAutoSystemError}*/
export async function fetchAutoSystemsFromFiles(): Promise<AutoSystem<string>[]>;
/**@throws {FetchAutoSystemError}*/
export async function fetchAutoSystemsFromFiles(
	options: FetchAutoSystemOptions,
): Promise<AutoSystem<string>[]>;
export async function fetchAutoSystemsFromFiles(
	options: FetchAutoSystemOptions = {},
): Promise<AutoSystem<string>[]> {
	const { filter = null } = options;

	const matches: AutoSystem<string>[] = [];

	const pushOrDiscard = (system: AutoSystem<string>) => {
		let isValid: boolean = true;
		isValid &&= filter == null || filter(system);

		if (isValid) matches.push(system);
	};

	const commandModules = await Promise.all(
		actionFilenames.map(async (filename) => ({
			filename,
			commandModule: await import(`../instances/${filename}`),
		})),
	);

	for (const { filename, commandModule } of commandModules) {
		if (commandModule instanceof AutoSystem) pushOrDiscard(commandModule);
		else if (commandModule.default instanceof AutoSystem) pushOrDiscard(commandModule.default);
		else if (commandModule.command instanceof AutoSystem) pushOrDiscard(commandModule.command);
		else
			throw new FetchAutoSystemError(
				`No se encontró un comando en el módulo: ${filename} desde ${__dirname}`,
			);
	}

	return matches;
}

export class FetchAutoSystemError extends Error {
	constructor();
	constructor(message: string);
	constructor(message?: string) {
		super(message);
		this.name = 'FetchAutoSystemError';
	}
}
