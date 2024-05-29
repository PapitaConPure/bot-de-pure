const { makeNumber, makeText } = require('../../values');
const { Scope } = require('../../scope');

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
 * @returns {TextValue}
 */
function númeroATexto(self, [], scope) {
	return makeText(`${self.value}`);
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
	.set('aTexto', númeroATexto)
	.set('aEntero', númeroAEntero)
	.set('entero', númeroAEntero)
	.set('redondear', númeroRedondear)
	.set('suelo', númeroSuelo)
	.set('techo', númeroTecho)
	.set('truncar', númeroAEntero);

module.exports = {
	numberMethods,
};
