import { NativeFunction } from '../../values';
import { utilFunctions } from './utils';
import { kindFunctions } from './kinds';
import { discordFunctions } from './discord';

export interface NativeFunctionEntry {
	id: string;
	fn: NativeFunction;
}

export const NativeFunctions = [ ...utilFunctions, ...kindFunctions, ...discordFunctions ];
