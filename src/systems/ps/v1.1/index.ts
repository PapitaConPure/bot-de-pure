import { RuntimeValue } from './interpreter/values';
import { RequireAtLeastOne } from './util/types';

export { Token } from './lexer/tokens';
export { Lexer } from './lexer';
export { Parser } from './parser';

export { Interpreter } from './interpreter';
export { Scope } from './interpreter/scope';
export { Input } from './interpreter/inputReader';
export {
	ValueKinds,
	coerceValue,
	makeValue,
	makeNumber,
	makeText,
	makeBoolean,
	makeList,
	makeRegistry,
	makeNativeFunction,
	makeFunction,
	makeLambda,
	makeEmbed,
	makeNada,
} from './interpreter/values';

export { declareNatives, declareContext } from './interpreter/environment';
export {
	EnvironmentProvider,
	PSGuild,
	PSChannel,
	PSRole,
	PSUser,
	PSMember,
} from './interpreter/environment/environmentProvider';

export { stringifyPSAST, logPSAST } from './util/debug';

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
