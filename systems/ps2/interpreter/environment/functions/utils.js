const { ValueKinds, makeNumber, makeText } = require('../../values');
const { getParamOrNada } = require('../nativeUtils');
const { Scope } = require('../../scope');
const { rand, randRange } = require('../../../../../func');

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
 * @param {null} self
 * @param {[ NumberValue, NumberValue ]} args 
 * @param {Scope} scope 
 * @returns {NumberValue}
 */
function dado(self, [ n, m ], scope) {
	const [ nExists, nResult ] = getParamOrNada(n, ValueKinds.NUMBER, scope);
	if(!nExists)
		return makeNumber(rand(6, true) + 1);
		
	const [ mExists, mResult ] = getParamOrNada(m, ValueKinds.NUMBER, scope);
	if(!mExists)
		return makeNumber(rand(nResult.value, true));

	return makeNumber(randRange(nResult.value, mResult.value, true));
}

/**
 * 
 * @param {null} self
 * @param {[ NumberValue, NumberValue ]} args 
 * @param {Scope} scope 
 * @returns {NumberValue}
 */
function aleatorio(self, [ n, m ], scope) {
	const [ nExists, nResult ] = getParamOrNada(n, ValueKinds.NUMBER, scope);
	if(!nExists)
		return makeNumber(Math.random());
	
	const [ mExists, mResult ] = getParamOrNada(m, ValueKinds.NUMBER, scope);
	if(!mExists)
		return makeNumber(rand(nResult.value, false));

	return makeNumber(randRange(nResult.value, mResult.value, false));
}

/**
 * 
 * @param {null} self
 * @param {[]} args 
 * @param {Scope} scope 
 * @returns {TextValue}
 */
function colorAleatorio(self, [], scope) {
	const colorNumber = ((Math.random() * 0xfffffe) << 0) + 1;
	const colorString = colorNumber.toString(16).padStart(6, '0');
	return makeText(colorString);
}

/**@type {Array<{ id: String, fn: import('../../values').NativeFunction }>}*/
const utilFunctions = [
	{ id: 'dado', fn: dado },
	{ id: 'aleatorio', fn: aleatorio },
	{ id: 'colorAleatorio', fn: colorAleatorio },
];

module.exports = {
	utilFunctions,
};
