const { Scope } = require('../scope');
const { ValueKinds, coerceValue, isOperable, makeNada, makeNativeFunction, makeFunction, makeEmbed, makeRegistry, makeList, makeNumber, makeText, makeBoolean, isValidText } = require('../values');

const fileRegex = /(http:\/\/|https:\/\/)(www\.)?(([a-zA-Z0-9-]){1,}\.){1,4}([a-zA-Z]){2,6}\/[a-zA-Z-_\/\.0-9#:?=&;,]*\.(txt|png|jpg|jpeg|webp|gif|webm|mp4|mp3|wav|flac|ogg)[a-zA-Z-_\.0-9#:?=&;,]*/;
const imageRegex = /(http:\/\/|https:\/\/)(www\.)?(([a-zA-Z0-9-]){1,}\.){1,4}([a-zA-Z]){2,6}\/[a-zA-Z-_\/\.0-9#:?=&;,]*\.(png|jpg|jpeg|webp)[a-zA-Z-_\.0-9#:?=&;,]*/;
const linkRegex = /(http:\/\/|https:\/\/)(www\.)?(([a-zA-Z0-9-]){1,}\.){1,4}([a-zA-Z]){2,6}(\/[a-zA-Z-_\/\.0-9#:?=&;,]*)?/;

/**
 * @template {import('../values').ValueKind} T
 * @param {T} kind
 * @param {...*} values
 * @returns {Extract<import('../values').RuntimeValue, { kind: T }>}
 */
function makeKindFromValue(kind, ...values) {
	switch(kind) {
	case ValueKinds.NUMBER:
		return /**@type {Extract<import('../values').RuntimeValue, { kind: T }>}*/(makeNumber(values[0]));
	case ValueKinds.TEXT:
		return /**@type {Extract<import('../values').RuntimeValue, { kind: T }>}*/(makeText(values[0]));
	case ValueKinds.BOOLEAN:
		return /**@type {Extract<import('../values').RuntimeValue, { kind: T }>}*/(makeBoolean(values[0]));
	case ValueKinds.LIST:
		return /**@type {Extract<import('../values').RuntimeValue, { kind: T }>}*/(makeList(values[0]));
	case ValueKinds.REGISTRY:
		return /**@type {Extract<import('../values').RuntimeValue, { kind: T }>}*/(makeRegistry(values[0]));
	case ValueKinds.NATIVE_FN:
		return /**@type {Extract<import('../values').RuntimeValue, { kind: T }>}*/(makeNativeFunction(null, values[0]));
	case ValueKinds.FUNCTION:
		return /**@type {Extract<import('../values').RuntimeValue, { kind: T }>}*/(makeFunction(values[0], values[1], values[2]));
	case ValueKinds.EMBED:
		return /**@type {Extract<import('../values').RuntimeValue, { kind: T }>}*/(makeEmbed());
	case ValueKinds.NADA:
		return /**@type {Extract<import('../values').RuntimeValue, { kind: T }>}*/(makeNada());
	default:
		throw 'Tipo de dato inválido al intentar crear un RuntimeValue desde tipo de dato y valor primitivo';
	}
}

/**
 * @template {import('../values').ValueKind} T
 * @param {Extract<import('../values').RuntimeValue, { kind: T }>} coerced 
 * @param {T} kind 
 * @param {Scope} scope
 */
function verifyParam(coerced, kind, scope) {
	if(kind === ValueKinds.NUMBER && !isOperable(coerced))
		throw scope.interpreter.TuberInterpreterError('Se recibió un Número inválido como argumento de tipo Número');

	if(kind === ValueKinds.TEXT && !isValidText(coerced))
		throw scope.interpreter.TuberInterpreterError('Se recibió un Texto inválido como argumento de tipo Texto');
}

/**
 * Función de utilidad para asegurarse de que un parámetro existe y si es del tipo esperado.
 * 
 * Si el parámetro existe y puede ser convertido al valor esperado correctamente (si no lo era antes), devuelve el resultado de esa conversión. En cualquier otro caso, arroja un error
 * 
 * @template {import('../values').ValueKind} T
 * @param {import('../values').RuntimeValue} value 
 * @param {T} kind 
 * @param {Scope} scope 
 * @returns {Extract<import('../values').RuntimeValue, { kind: T }>}
 */
function expectParam(value, kind, scope) {
	if(value === null)
		throw scope.interpreter.TuberInterpreterError('Se esperaba un valor para un parámetro requerido en función nativa');

	const coerced = coerceValue(scope.interpreter, value, kind);
	verifyParam(coerced, kind, scope);

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
 * @template {import('../values').ValueKind} T
 * @param {import('../values').RuntimeValue} value 
 * @param {T} kind 
 * @param {Scope} scope 
 * @param {...*} fallback
 * @returns {Extract<import('../values').RuntimeValue, { kind: T }>}
 */
function getParamOrDefault(value, kind, scope, ...fallback) {
	if(value == null)
		return makeKindFromValue(kind, ...fallback);

	const coerced = coerceValue(scope.interpreter, value, kind);
	verifyParam(coerced, kind, scope);

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
 * @template {import('../values').ValueKind} T
 * @param {import('../values').RuntimeValue} value 
 * @param {T} kind 
 * @param {Scope} scope 
 * @returns {[ false, import('../values').NadaValue ] | [ true, Extract<import('../values').RuntimeValue, { kind: T }> ]}
 */
function getParamOrNada(value, kind, scope) {
	if(value == null)
		return [
			false,
			makeNada(),
		];

	const coerced = coerceValue(scope.interpreter, value, kind);
	verifyParam(coerced, kind, scope);

	return [
		true,
		coerced,
	];
}

/**
 * @param {number} value
 * @param {number} length
 */
function calculatePositionOffset(value, length) {
	value = Math.floor(value);

	if(value < 0)
		value = length + value;

	return value;
}

module.exports = {
	expectParam,
	getParamOrDefault,
	getParamOrNada,
	calculatePositionOffset,
	makeKindFromValue,
	fileRegex,
	imageRegex,
	linkRegex,
};
