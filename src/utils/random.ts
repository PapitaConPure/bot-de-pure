import { globalConfigs } from '@/data/globalProps';

export interface WeightedDecision<TValue> {
	value: TValue;
	weight: number;
}

/**
 * @description
 * Selects a value from a list of weighted options using a random distribution.
 *
 * Each option's probability is proportional to its `weight` relative to the total weight.
 * For example, an option with weight `2` is twice as likely to be selected as an option with weight `1`.
 * @param options An array of weighted options to choose from.
 * @returns The randomly selected value based on weight, or `undefined` if no options are provided.
 *
 * @example
 * const result = makeWeightedDecision([
 *   { value: 'common', weight: 80 },
 *   { value: 'rare', weight: 15 },
 *   { value: 'legendary', weight: 5 }
 * ]);
 *
 * // 'common' is most likely, 'legendary' is least likely
 * console.log(result);
 */

export function makeWeightedDecision<TValue = unknown>(
	options: WeightedDecision<TValue>[],
): TValue {
	if (!options.length) return undefined as TValue;

	const optionCount = options.length;

	let totalWeight = 0;
	for (const option of options) totalWeight += option.weight;

	if (totalWeight === 0) {
		const r = Math.floor(Math.random() * optionCount);
		return options[r].value;
	}

	let r = Math.random() * totalWeight;
	for (let i = 0; i < optionCount; i++) {
		if (r < options[i].weight) return options[i].value;
		else r -= options[i].weight;
	}

	return options[optionCount - 1].value;
} /**
 * @description Devuelve un valor aleatorio entre 0 y otro valor.
 * @param maxExclusive Máximo valor; excluído del resultado. 1 por defecto.
 * @param [round=false] Si el número debería ser redondeado hacia abajo. `true` por defecto.
 */

export function rand(maxExclusive: number, round: boolean = true) {
	maxExclusive = +maxExclusive;
	const negativeHandler = maxExclusive < 0 ? -1 : 1;
	maxExclusive = maxExclusive * negativeHandler;
	const value =
		((globalConfigs.seed + maxExclusive * Math.random()) % maxExclusive) * negativeHandler;
	return round ? Math.floor(value) : value;
}
/**
 * @description Devuelve un valor aleatorio dentro de un rango entre 2 valores.
 * @param minInclusive Mínimo valor; puede ser incluído en el resultado.
 * @param maxExclusive Máximo valor; excluído del resultado.
 * @param round Si el número debería ser redondeado hacia abajo. `false` por defecto.
 */

export function randRange(minInclusive: number, maxExclusive: number, round: boolean = true) {
	minInclusive = 1 * minInclusive;
	maxExclusive = 1 * maxExclusive;
	const range = maxExclusive - minInclusive;
	const value = minInclusive + ((globalConfigs.seed + range * Math.random()) % range);
	return round ? Math.floor(value) : value;
}
