const { makeNumber, makeText, ValueKinds } = require('../../values');
const { Scope } = require('../../scope');
const { expectParam, getParamOrDefault } = require('../nativeUtils');
const { improveNumber, clamp } = require('../../../../../func');

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
 * 
 * @param {NumberValue} self
 * @param {[]} args 
 * @param {Scope} scope 
 * @returns {NumberValue}
 */
function númeroAbsoluto(self, [], scope) {
	return makeNumber(Math.abs(self.value));
}

/**
 * 
 * @param {NumberValue} self
 * @param {[]} args 
 * @param {Scope} scope 
 * @returns {NumberValue}
 */
function númeroAEntero(self, [], scope) {
	return makeNumber(Math.trunc(self.value));
}

/**
 * 
 * @param {NumberValue} self
 * @param {[ NumberValue ]} args 
 * @param {Scope} scope 
 * @returns {TextValue}
 */
function númeroAFijo(self, [ precisión ], scope) {
	const precisiónResult = expectParam('precisión', precisión, ValueKinds.NUMBER, scope);

	if(precisiónResult.value < 0 || precisiónResult.value > 100)
		throw scope.interpreter.TuberInterpreterError('La precisión especificada debe ser un Número entre 1 y 100');

	const text = self.value.toFixed(precisiónResult.value);
	return makeText(text);
}

/**
 * 
 * @param {NumberValue} self
 * @param {[ NumberValue ]} args 
 * @param {Scope} scope 
 * @returns {TextValue}
 */
function númeroAPrecisión(self, [ precisión ], scope) {
	const precisiónResult = expectParam('precisión', precisión, ValueKinds.NUMBER, scope);

	if(precisiónResult.value < 0 || precisiónResult.value > 100)
		throw scope.interpreter.TuberInterpreterError('La precisión especificada debe ser un Número entre 0 y 100');

	const text = (+self.value.toFixed(precisiónResult.value)).toString();
	return makeText(text);
}

/**
 * 
 * @param {NumberValue} self
 * @param {[ NumberValue ]} args 
 * @param {Scope} scope 
 * @returns {TextValue}
 */
function númeroATexto(self, [ base ], scope) {
	const baseResult = getParamOrDefault('base', base, ValueKinds.NUMBER, scope, 10);

	if(baseResult.value < 2 || baseResult.value > 36)
		throw scope.interpreter.TuberInterpreterError('La base numérica de la conversión a Texto debe ser un Número entre 2 y 36 inclusive');

	return makeText(self.value.toString(baseResult.value));
}

/**
 * 
 * @param {NumberValue} self
 * @param {[ BooleanValue, NumberValue ]} args 
 * @param {Scope} scope 
 * @returns {TextValue}
 */
function númeroFormatear(self, [ acortar, mínimoDígitos ], scope) {
	const acortarResult = expectParam('acortar', acortar, ValueKinds.BOOLEAN, scope);
	const mínimoResult = expectParam('mínimoDígitos', mínimoDígitos, ValueKinds.NUMBER, scope);
	if(mínimoResult.value < 1 || mínimoResult.value > 10)
		throw scope.interpreter.TuberInterpreterError(`El parámetro requerido \`mínimoDígitos\` debe ser un Número entre 1 y 10`);

	return makeText(`${improveNumber(self.value, acortarResult.value, mínimoResult.value)}`);
}

/**
 * 
 * @param {NumberValue} self
 * @param {[ BooleanValue, NumberValue ]} args 
 * @param {Scope} scope 
 * @returns {NumberValue}
 */
function númeroLimitar(self, [ mínimo, máximo ], scope) {
	const mínimoValue = expectParam('mínimo', mínimo, ValueKinds.NUMBER, scope).value;
	const máximoValue = expectParam('máximo', máximo, ValueKinds.NUMBER, scope).value;

	const clamped = clamp(self.value, mínimoValue, máximoValue);
	return makeNumber(clamped);
}

/**
 * 
 * @param {NumberValue} self
 * @param {[]} args 
 * @param {Scope} scope 
 * @returns {NumberValue}
 */
function númeroSigno(self, [], scope) {
	return makeNumber(Math.sign(self.value));
}

/**
 * 
 * @param {NumberValue} self
 * @param {[]} args 
 * @param {Scope} scope 
 * @returns {NumberValue}
 */
function númeroSuelo(self, [], scope) {
	return makeNumber(Math.floor(self.value));
}

/**
 * 
 * @param {NumberValue} self
 * @param {[]} args 
 * @param {Scope} scope 
 * @returns {NumberValue}
 */
function númeroTecho(self, [], scope) {
	return makeNumber(Math.ceil(self.value));
}

/**
 * 
 * @param {NumberValue} self
 * @param {[]} args 
 * @param {Scope} scope 
 * @returns {NumberValue}
 */
function númeroRedondear(self, [], scope) {
	return makeNumber(Math.round(self.value));
}

/**@type Map<String, import('../../values').NativeFunction<NumberValue>>*/
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
