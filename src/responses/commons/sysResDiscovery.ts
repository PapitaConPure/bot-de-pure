import { getModuleNames, readdirFromSync } from '@/utils/runtimeFs';
import { SystemResponses } from './sysResBuilder';

export const actionFilenames = getModuleNames(readdirFromSync(import.meta.url, '../instances'));

interface FetchSystemResponsesOptions {
	filter?: (sysres: SystemResponses<string>) => boolean;
}

/**@throws {FetchSystemResponsesError}*/
export async function fetchSystemsResponsesFromFiles(): Promise<SystemResponses<string>[]>;
/**@throws {FetchSystemResponsesError}*/
export async function fetchSystemsResponsesFromFiles(
	options: FetchSystemResponsesOptions,
): Promise<SystemResponses<string>[]>;
export async function fetchSystemsResponsesFromFiles(
	options: FetchSystemResponsesOptions = {},
): Promise<SystemResponses<string>[]> {
	const { filter = null } = options;

	const matches: SystemResponses<string>[] = [];

	const pushOrDiscard = (sysres: SystemResponses<string>) => {
		let isValid: boolean = true;
		isValid &&= filter == null || filter(sysres);

		if (isValid) matches.push(sysres);
	};

	const commandModules = await Promise.all(
		actionFilenames.map(async (filename) => ({
			filename,
			commandModule: await import(`../instances/${filename}`),
		})),
	);

	for (const { filename, commandModule } of commandModules) {
		if (commandModule instanceof SystemResponses) pushOrDiscard(commandModule);
		else if (commandModule.default instanceof SystemResponses)
			pushOrDiscard(commandModule.default);
		else if (commandModule.command instanceof SystemResponses)
			pushOrDiscard(commandModule.command);
		else
			throw new FetchSystemResponsesError(
				`No se encontró un comando en el módulo: ${filename} desde ${__dirname}`,
			);
	}

	return matches;
}

export class FetchSystemResponsesError extends Error {
	constructor();
	constructor(message: string);
	constructor(message?: string) {
		super(message);
		this.name = 'FetchSystemResponsesError';
	}
}
