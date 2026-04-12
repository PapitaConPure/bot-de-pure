// @ts-nocheck

import type { RuntimeValue } from './interpreter/values';
import type { RequireAtLeastOne } from './util/types';

export { Interpreter } from './interpreter';
export { declareContext, declareNatives } from './interpreter/environment';
export {
	EnvironmentProvider,
	PSChannel,
	PSGuild,
	PSMember,
	PSRole,
	PSUser,
} from './interpreter/environment/environmentProvider';
export { Input } from './interpreter/inputReader';
export { Scope } from './interpreter/scope';
export {
	coerceValue,
	makeBoolean,
	makeEmbed,
	makeFunction,
	makeLambda,
	makeList,
	makeNada,
	makeNativeFunction,
	makeNumber,
	makeRegistry,
	makeText,
	makeValue,
	ValueKinds,
} from './interpreter/values';
export { Lexer } from './lexer';
export { Token } from './lexer/tokens';
export { Parser } from './parser';

export { logPSAST, stringifyPSAST } from './util/debug';

export const PS_VERSION = 1.1;

export interface BaseTubercle {
	id: string;
	author: string;
	inputs?: unknown[][];
}

export interface PartialBasicTubercleData {
	advanced: false;
	content?: string;
	files?: string[];
}

export type BasicTubercleData = RequireAtLeastOne<PartialBasicTubercleData>;

export interface AdvancedTubercleData {
	advanced: true;
	content?: undefined;
	files?: undefined;
	script: string;
	saved: Map<string, RuntimeValue>;
	psVersion: number;
}

export type BasicTubercle = BaseTubercle & BasicTubercleData;

export type AdvancedTubercle = BaseTubercle & AdvancedTubercleData;

export type Tubercle = BasicTubercle | AdvancedTubercle;
