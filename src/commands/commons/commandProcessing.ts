import type { ValuesOf } from 'types';

export const CommandResults = Object.freeze({
	VOID: 0,
	SUCCEEDED: 1,
	FAILED: 2,
} as const satisfies Record<string, number>);

export type CommandResult = ValuesOf<typeof CommandResults>;
