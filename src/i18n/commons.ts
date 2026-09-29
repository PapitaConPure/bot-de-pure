import Locales from './locales';
import type { LocaleKey } from './types';

export const validLocaleKeys: string[] = Object.values(Locales);
export function isValidLocaleKey(locale: unknown): locale is LocaleKey {
	return typeof locale === 'string' && validLocaleKeys.includes(locale);
}

export function paragraph(...lines: string[]) {
	return lines.join('\n');
}

/**
 * @param i Índice del valor de reemplazo
 * @param defaultValue Valor por defecto si no se ingresó un valor en el índice
 */
export function subl(i: number, defaultValue?: string) {
	if (i == null) throw ReferenceError('Se esperaba un índice de componente de traducción');

	const baseSub = `${i}{...}`;

	if (!defaultValue) return baseSub;

	return `${baseSub}<?{'${defaultValue}'}`;
}

/**
 * @param i Índice del valor a usar como operando izquierdo de la comprobación
 * @param condition Condición a evaluar con el valor de comprobación
 * @param Operando derecho de la operación. Un valor cualquiera, no un índice
 * @param whenTrue Valor de reemplazo en caso de verdadero
 * @param whenFalse Valor de reemplazo en caso de falso
 */
export function subif<TReplacement>(
	i: number,
	condition: ConditionString,
	rightOperand: TReplacement,
	whenTrue: string,
	whenFalse: string | null = '',
) {
	if (i == null) throw ReferenceError('Se esperaba un índice de componente de traducción');
	if (whenTrue == null)
		throw ReferenceError('Se esperaba un valor para verdadero en componente de traducción');

	const r = typeof rightOperand === 'boolean' ? `__${rightOperand}__` : rightOperand;

	return `${i}{...}<!{${condition}:${r}|'${whenTrue}'}<?{'${whenFalse}'}`;
}

export const ConditionFields = {
	Equal: '=',
	Distinct: '!=',
	Lesser: '<',
	Greater: '>',
	LesserOrEqual: '<=',
	GreaterOrEqual: '>=',
} as const;

export type ConditionString = (typeof ConditionFields)[keyof typeof ConditionFields];
