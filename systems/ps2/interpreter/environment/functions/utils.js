const { ValueKinds, makeNumber, makeText, makeBoolean, makeNada } = require('../../values');
const { getParamOrNada, expectParam } = require('../nativeUtils');
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
 * @template {Array<RuntimeValue>} [TArg=Array<RuntimeValue>]
 * @template {RuntimeValue} [TResult=RuntimeValue]
 * @typedef {import('../../values').NativeFunction<null, TArg, TResult>} NativeFunction
 */

/**@type {NativeFunction<[ NumberValue, NumberValue ], NumberValue>}*/
function aleatorio(self, [ n, m ], scope) {
	const [ nExists, nResult ] = getParamOrNada('n', n, ValueKinds.NUMBER, scope);
	if(!nExists)
		return makeNumber(Math.random());
	
	const [ mExists, mResult ] = getParamOrNada('m', m, ValueKinds.NUMBER, scope);
	if(!mExists)
		return makeNumber(rand(nResult.value, false));

	return makeNumber(randRange(nResult.value, mResult.value, false));
}

/**@type {NativeFunction<[], TextValue>}*/
function colorAleatorio(self, [], scope) {
	const colorNumber = ((Math.random() * 0xfffffe) << 0) + 1;
	const colorString = '#' + colorNumber.toString(16).padStart(6, '0');
	return makeText(colorString);
}

/**@type {NativeFunction<[ NumberValue, NumberValue ], NumberValue>}*/
function dado(self, [ n, m ], scope) {
	const [ nExists, nResult ] = getParamOrNada('n', n, ValueKinds.NUMBER, scope);
	if(!nExists)
		return makeNumber(rand(6, true) + 1);
		
	const [ mExists, mResult ] = getParamOrNada('m', m, ValueKinds.NUMBER, scope);
	if(!mExists)
		return makeNumber(rand(nResult.value, true));

	return makeNumber(randRange(nResult.value, mResult.value, true));
}

/**@type {NativeFunction<Array<RuntimeValue>, RuntimeValue>}*/
function elegir(self, pool, scope) {
	if(pool.length === 0)
		throw scope.interpreter.TuberInterpreterError(`Se esperaba un valor para el parámetro requerido \`x1\` en Función nativa`);

	if(pool.length === 1)
		return pool[0];

	const idx = rand(pool.length, true);
	return pool[idx];
}

/**@type {NativeFunction<[], BooleanValue>}*/
function quedanEntradas(self, [], scope) {
	const test = scope.interpreter.hasArgs;
	return makeBoolean(test);
}

/**@type {NativeFunction<[ NumberValue, NumberValue ], NumberValue | NadaValue>}*/
function raíz(self, [ radicando, grado ], scope) {
	const radicandoValue = expectParam('radicando', radicando, ValueKinds.NUMBER, scope);
	const gradoValue = expectParam('grado', grado, ValueKinds.NUMBER, scope);

	const root = radicandoValue.value ** (1 / gradoValue.value);
	
	if(isNaN(root))
		return makeNada();

	return makeNumber(root);
}

/**@type {Array<{ id: String, fn: NativeFunction }>}*/
const utilFunctions = [
	{ id: 'aleatorio', fn: aleatorio },
	{ id: 'colorAleatorio', fn: colorAleatorio },
	{ id: 'dado', fn: dado },
	{ id: 'elegir', fn: elegir },
	{ id: 'quedanEntradas', fn: quedanEntradas },
	{ id: 'raiz', fn: raíz },
	{ id: 'raíz', fn: raíz },
];

module.exports = {
	utilFunctions,
};
