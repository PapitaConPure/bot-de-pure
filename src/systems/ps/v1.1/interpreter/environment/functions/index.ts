// @ts-nocheck

import type { NativeFunction } from '../../values';
import { discordFunctions } from './discord';
import { kindFunctions } from './kinds';
import { utilFunctions } from './utils';

export interface NativeFunctionEntry {
	id: string;
	fn: NativeFunction;
}

export const NativeFunctions = [...utilFunctions, ...kindFunctions, ...discordFunctions];
