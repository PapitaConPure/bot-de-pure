import { RuntimeValue, AssertedRuntimeValue, RuntimeInternalValue, ValueKinds, ValueKind, ValueKindTranslationLookups, FunctionValue, NativeFunction, NadaValue, makeList, makeRegistry, makeEmbed, makeFunction, makeNativeFunction, makeNada, valueMakers, coerceValue, isOperable, isValidText } from '../values';
import { ArgumentExpression } from '../../ast/expressions';
import { BlockStatement } from '../../ast/statements';
import { EmbedData } from '../../embedData';
import { Scope } from '../scope';

export const psFileRegex = /(http:\/\/|https:\/\/)(www\.)?(([a-zA-Z0-9-]){1,}\.){1,4}([a-zA-Z]){2,6}\/[a-zA-Z-_/.0-9#:?=&;,]*\.(txt|png|jpg|jpeg|webp|gif|webm|mp4|mp3|wav|flac|ogg)[a-zA-Z-_.0-9#:?=&;,]*/i;
export const psImageRegex = /(http:\/\/|https:\/\/)(www\.)?(([a-zA-Z0-9-]){1,}\.){1,4}([a-zA-Z]){2,6}\/[a-zA-Z-_/.0-9#:?=&;,]*\.(png|jpg|jpeg|webp)[a-zA-Z-_.0-9#:?=&;,]*/i;
export const psLinkRegex = /(http:\/\/|https:\/\/)(www\.)?(([a-zA-Z0-9-]){1,}\.){1,4}([a-zA-Z]){2,6}(\/[a-zA-Z-_/.0-9#:?=&;,]*)?/i;

export function makeKindFromValue<TKind extends ValueKind>(kind: TKind, ...values: [ RuntimeInternalValue<TKind>, ...unknown[] ]): AssertedRuntimeValue<TKind> {
	switch(kind) {
	case ValueKinds.NUMBER:
	case ValueKinds.TEXT:
	case ValueKinds.BOOLEAN: {
		const valueMaker = valueMakers[kind];
		return valueMaker(values[0]);
	}

	case ValueKinds.LIST:
		return makeList(Array.isArray(values[0]) ? values[0] : (values as RuntimeValue[])) as AssertedRuntimeValue<TKind>;

	case ValueKinds.REGISTRY:
		return makeRegistry(values[0] as Map<string, RuntimeValue>) as AssertedRuntimeValue<TKind>;

	case ValueKinds.NATIVE_FN:
		return makeNativeFunction(null, values[0] as NativeFunction) as AssertedRuntimeValue<TKind>;

	case ValueKinds.FUNCTION:
		return makeFunction(values[0] as unknown as BlockStatement, values[1] as ArgumentExpression[], values[2] as Scope) as AssertedRuntimeValue<TKind>;

	case ValueKinds.EMBED: {
		const embed = makeEmbed();
		embed.value = values[0] as EmbedData;
		return;
	}

	case ValueKinds.NADA:
		return makeNada() as AssertedRuntimeValue<TKind>;

	default:
		throw 'Tipo de dato inválido al intentar crear un RuntimeValue desde tipo de dato y valor primitivo';
	}
}

/**
 * @param name El nombre públicamente representativo del argumento que se pide del usuario.
 * @param coerced El valor ya convertido de este argumento de la Función nativa.
 * @param kind El tipo de valor del argumento de la Función nativa.
 * @param scope El {@link Scope} de la Función nativa que llama esta función.
 */
function verifyParam<TKind extends ValueKind>(name: string, coerced: AssertedRuntimeValue<TKind>, kind: TKind, scope: Scope) {
	if(kind === ValueKinds.NUMBER && !isOperable(coerced))
		throw scope.interpreter.TuberInterpreterError(`Se recibió un valor inválido para parámetro de tipo **Número**: \`${name}\``);

	if(kind === ValueKinds.TEXT && !isValidText(coerced))
		throw scope.interpreter.TuberInterpreterError(`Se recibió un valor inválido para parámetro de tipo **Texto**: \`${name}\``);
}

/**
 * Función de utilidad para asegurarse de que un parámetro existe y si es del tipo esperado.
 *
 * Si el parámetro existe y puede ser convertido al valor esperado correctamente (si no lo era antes), devuelve el resultado de esa conversión. En cualquier otro caso, arroja un error.
 *
 * @param name El nombre públicamente representativo del argumento que se pide del usuario.
 * @param value El valor del argumento tal como fue facilitado por el usuario, si existe.
 * @param kind El tipo de valor del argumento de la Función nativa.
 * @param scope El {@link Scope} de la Función nativa que llama esta función.
 */
export function expectParam<TKind extends ValueKind>(name: string, value: RuntimeValue, kind: TKind, scope: Scope): AssertedRuntimeValue<TKind> {
	if(value == null)
		throw scope.interpreter.TuberInterpreterError(`Se esperaba un valor para el parámetro requerido \`${name}\` en Función nativa`);

	if(value.kind === ValueKinds.NADA)
		throw scope.interpreter.TuberInterpreterError(`Se esperaba un **${ValueKindTranslationLookups.get(kind)}** para el parámetro requerido \`${name}\` en Función nativa, pero se recibió **Nada**`);

	const coerced = coerceValue(scope.interpreter, value, kind);
	verifyParam(name, coerced, kind, scope);

	return coerced;
}

/**
 * Función de utilidad para recibir un parámetro opcional y siempre conseguir un valor del tipo deseado.
 * Usado para parámetros opcionales que necesitan ser de un tipo específico y tienen un valor por defecto del mismo tipo.
 *
 * Devuelve un {@link RuntimeValue} "resultado" cuyo tipo es el tipo especificado y cuyos valores dependen de si el parámetro existe o no:
 * * Si el parámetro existe y puede ser convertido al tipo esperado correctamente, el resultado es el valor convertido al tipo deseado (si no lo era de antemano).
 * * Si el parámetro existe y no puede ser convertido al tipo esperado o su valor no corresponde, se lanzará un error.
 * * Si el parámetro no existe, se devuelve el valor por defecto especificado envuelto en un {@link RuntimeValue} del tipo especificado.
 *
 * @param name El nombre públicamente representativo del argumento que se pide del usuario.
 * @param value El valor del argumento tal como fue facilitado por el usuario, si existe.
 * @param kind El tipo de valor del argumento de la Función nativa.
 * @param scope El {@link Scope} de la Función nativa que llama esta función.
 * @param {...*} fallback Definición del valor por defecto. Para la mayoría de tipos, solo se pasa un parámetro que es meramente el valor. Para Listas puedes pasar un argumento de Array o varios argumentos de sus elementos. Para tipos de Función no-nativa, se pasan el cuerpo de la Función, los argumentos y el {@link Scope} de la misma.
 */
export function getParamOrDefault<TKind extends ValueKind>(name: string, value: RuntimeValue, kind: TKind, scope: Scope, ...fallback: [ RuntimeInternalValue<TKind>, ...unknown[] ]): AssertedRuntimeValue<TKind> {
	if(value == null || value.kind === ValueKinds.NADA)
		return makeKindFromValue(kind, ...fallback);

	const coerced = coerceValue(scope.interpreter, value, kind);
	verifyParam(name, coerced, kind, scope);

	return coerced;
}

/**
 * Función de utilidad para verificar si un parámetro existe y si es del tipo esperado. Usado para parámetros opcionales que necesitan ser de un tipo específico.
 *
 * Devuelve un arreglo de 2 elementos cuyos valores dependen de si el parámetro existe o no.
 *
 * El primer elemento del arreglo indica si el parámetro existe. El segundo devuelve un {@link RuntimeValue} "resultado" cuyo tipo depende de si el parámetro existe o no:
 * * Si el parámetro existe y puede ser convertido al tipo esperado correctamente, el resultado es el valor convertido al tipo deseado (si no lo era de antemano).
 * * Si el parámetro existe y no puede ser convertido al tipo esperado o su valor no corresponde, se lanzará un error.
 * * Si el parámetro no existe, se devuelve Nada independientemente del tipo.
 *
 * @param value El valor del argumento tal como fue facilitado por el usuario, si existe.
 * @param kind El tipo de valor del argumento de la Función nativa.
 * @param scope El {@link Scope} de la Función nativa que llama esta función.
 */
export function getParamOrNada<TKind extends ValueKind>(name, value: RuntimeValue, kind: TKind, scope: Scope): [ false, NadaValue ] | [ true, AssertedRuntimeValue<TKind> ] {
	if(value == null)
		return [
			false,
			makeNada(),
		];

	const coerced = coerceValue(scope.interpreter, value, kind);
	verifyParam(name, coerced, kind, scope);

	return [
		true,
		coerced,
	];
}

export function calculatePositionOffset(value: number, length: number) {
	value = Math.floor(value);

	if(value < 0)
		value = length + value;

	return value;
}

/**
 * Dispone una evaluación de llamado de PuréScript por medio de una Función nativa
 * @returns Una Función que recibe parámetros RuntimeValue y realiza una evaluación de PuréScript
 */
export function makePredicateFn(name: string, fn: FunctionValue, scope: Scope): (...args: RuntimeValue[]) => RuntimeValue {
	const it = scope.interpreter;

	if(fn == null)
		throw it.TuberInterpreterError(`Se esperaba un valor para el parámetro requerido \`${name}\` en Función nativa`);

	if(!it.isAnyOf(fn, ValueKinds.FUNCTION, ValueKinds.NATIVE_FN))
		throw it.TuberInterpreterError(`Se esperaba una Función para el parámetro requerido \`${name}\` en Función nativa`);

	return (...args) => it.callFunction(fn, args, scope);
}
