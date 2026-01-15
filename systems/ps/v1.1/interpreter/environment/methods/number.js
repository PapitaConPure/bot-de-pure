const { makeNumber, makeText, ValueKinds } = require('../../values');
const { expectParam, getParamOrDefault } = require('../nativeUtils');
const { improveNumber, clamp } = require('../../../utils/utils');

/**
 * @typedef {import('../../values').NumberValue} NumberValue
 * @typedef {import('../../values').TextValue} TextValue
 * @typedef {import('../../values').BooleanValue} BooleanValue
 * @typedef {import('../../values').ListValue} ListValue
 * @typedef {import('../../values').RegistryValue} RegistryValue
 * @typedef {import('../../values').NativeFunctionValue} NativeFunctionValue
 * @typedef {import('../../values').FunctionValue} FunctionValue
 * @typedef {import('../../values').NadaValue} NadaValue
 * @typedef {import('../../values').RuntimeValue} RuntimeValue
 */

/**
 * @template {Array<RuntimeValue>} [TArg=Array<RuntimeValue>]
 * @template {RuntimeValue} [TResult=RuntimeValue]
 * @typedef {import('../../values').NativeFunction<NumberValue, TArg, TResult>} NumberMethod
 */

/**@type {NumberMethod<[], NumberValue>}*/
function númeroAbsoluto(self, []) {
	return makeNumber(Math.abs(self.value));
}

/**@type {NumberMethod<[], NumberValue>}*/
function númeroAEntero(self, []) {
	return makeNumber(Math.trunc(self.value));
}

/**@type {NumberMethod<[ NumberValue ], TextValue>}*/
function númeroAFijo(self, [ precisión ], scope) {
	const precisiónResult = expectParam('precisión', precisión, ValueKinds.NUMBER, scope);

	if(precisiónResult.value < 0 || precisiónResult.value > 100)
		throw scope.interpreter.TuberInterpreterError('La precisión especificada debe ser un Número entre 1 y 100');

	const text = self.value.toFixed(precisiónResult.value);
	return makeText(text);
}

/**@type {NumberMethod<[ NumberValue ], TextValue>}*/
function númeroAPrecisión(self, [ precisión ], scope) {
	const precisiónResult = expectParam('precisión', precisión, ValueKinds.NUMBER, scope);

	if(precisiónResult.value < 0 || precisiónResult.value > 100)
		throw scope.interpreter.TuberInterpreterError('La precisión especificada debe ser un Número entre 0 y 100');

	const text = (+self.value.toFixed(precisiónResult.value)).toString();
	return makeText(text);
}

/**@type {NumberMethod<[ NumberValue ], TextValue>}*/
function númeroATexto(self, [ base ], scope) {
	const baseResult = getParamOrDefault('base', base, ValueKinds.NUMBER, scope, 10);

	if(baseResult.value < 2 || baseResult.value > 36)
		throw scope.interpreter.TuberInterpreterError('La base numérica de la conversión a Texto debe ser un Número entre 2 y 36 inclusive');

	return makeText(self.value.toString(baseResult.value));
}

/**@type {NumberMethod<[ BooleanValue, NumberValue ], TextValue>}*/
function númeroFormatear(self, [ acortar, mínimoDígitos ], scope) {
	const acortarResult = expectParam('acortar', acortar, ValueKinds.BOOLEAN, scope);
	const mínimoResult = expectParam('mínimoDígitos', mínimoDígitos, ValueKinds.NUMBER, scope);
	if(mínimoResult.value < 1 || mínimoResult.value > 10)
		throw scope.interpreter.TuberInterpreterError(`El parámetro requerido \`mínimoDígitos\` debe ser un Número entre 1 y 10`);

	return makeText(`${improveNumber(self.value, acortarResult.value, mínimoResult.value)}`);
}

/**@type {NumberMethod<[ BooleanValue, NumberValue ], NumberValue>}*/
function númeroLimitar(self, [ mínimo, máximo ], scope) {
	const mínimoValue = expectParam('mínimo', mínimo, ValueKinds.NUMBER, scope).value;
	const máximoValue = expectParam('máximo', máximo, ValueKinds.NUMBER, scope).value;

	const clamped = clamp(self.value, mínimoValue, máximoValue);
	return makeNumber(clamped);
}

/**@type {NumberMethod<[], NumberValue>}*/
function númeroSigno(self, []) {
	return makeNumber(Math.sign(self.value));
}

/**@type {NumberMethod<[], NumberValue>}*/
function númeroSuelo(self, []) {
	return makeNumber(Math.floor(self.value));
}

/**@type {NumberMethod<[], NumberValue>}*/
function númeroTecho(self, []) {
	return makeNumber(Math.ceil(self.value));
}

/**@type {NumberMethod<[], NumberValue>}*/
function númeroRedondear(self, []) {
	return makeNumber(Math.round(self.value));
}

/**@type {Map<string, NumberMethod>}*/
const numberMethods = new Map();
numberMethods
	.set('absoluto', númeroAbsoluto)
	.set('aEntero', númeroAEntero)
	.set('aFijo', númeroAFijo)
	.set('aFormateado', númeroFormatear)
	.set('aPrecision', númeroAPrecisión)
	.set('aPrecisión', númeroAPrecisión)
	.set('aRedondeado', númeroRedondear)
	.set('aTexto', númeroATexto)
	.set('aTruncado', númeroAEntero)
	.set('entero', númeroAEntero)
	.set('formatear', númeroFormatear)
	.set('limitar', númeroLimitar)
	.set('redondear', númeroRedondear)
	.set('signo', númeroSigno)
	.set('suelo', númeroSuelo)
	.set('techo', númeroTecho)
	.set('truncar', númeroAEntero);

module.exports = {
	numberMethods,
};
