import type { PrefixPair } from '../data/globalProps';
import { prefixes } from '../data/globalProps';
import type { ComplexCommandRequest } from '../types/commands';

export const slashPrefixPair = { raw: '/', regex: /\//i } as const;

/**
 * @param context Contexto de servidor o request
 * @returns Un objeto conteniendo el texto crudo y RegExp del prefijo
 */
export function p_pure(context: ComplexCommandRequest | string = '0'): PrefixPair {
	if(typeof context === 'string')
		return prefixes[context] || prefixes['0'];

	return context.isInteraction ? slashPrefixPair : p_pure(context.guildId);
}
