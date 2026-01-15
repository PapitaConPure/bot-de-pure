const { ValueKinds, makeText, makeBoolean, makeList, makeRegistry, coerceValue, makeNada } = require('../../values');
const { expectParam, makePredicateFn } = require('../nativeUtils');

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
 * @typedef {import('../../values').NativeFunction<RegistryValue, TArg, TResult>} RegistryMethod
 */

/**@type {RegistryMethod<[], ListValue>}*/
function registroClaves(self, []) {
	const keysArray = [ ...self.entries.keys() ];
	const keyRVals = keysArray.map(key => makeText(key));
	return makeList(keyRVals);
}

/**@type {RegistryMethod<[ TextValue ], BooleanValue>}*/
function registroContiene(self, [ clave ], scope) {
	const claveResult = expectParam('clave', clave, ValueKinds.TEXT, scope)
	return makeBoolean(self.entries.has(claveResult.value));
}

/**@type {RegistryMethod<[], ListValue>}*/
function registroEntradas(self, []) {
	const entriesArray = [ ...self.entries.entries() ];
	const entriesRVal = entriesArray.map(([ k, v ]) => makeList([ makeText(k), v ]));
	return makeList(entriesRVal);
}

/**@type {RegistryMethod<[ FunctionValue ], RegistryValue>}*/
function registroFiltrar(self, [ predicado ], scope) {
	const fn = makePredicateFn('filtro', predicado, scope);

	/**@type {Map<String, RuntimeValue>}*/
	const filtered = new Map();
	for(const [ key, value ] of self.entries) {
		const test = coerceValue(scope.interpreter, fn(makeText(key), value), ValueKinds.BOOLEAN);
		if(test.value)
			filtered.set(key, value);
	}

	return makeRegistry(filtered);
}

/**@type {RegistryMethod<[ FunctionValue ], NadaValue>}*/
function registroParaCada(self, [ predicado ], scope) {
	const fn = makePredicateFn('procedimiento', predicado, scope);

	const entries = new Map(self.entries);
	for(const [ key, value ] of entries)
		fn(makeText(key), value);

	return makeNada();
}

/**@type {RegistryMethod<[ TextValue ], BooleanValue>}*/
function registroQuitar(self, [ clave ], scope) {
	const claveResult = expectParam('clave', clave, ValueKinds.TEXT, scope);
	const deleted = self.entries.delete(claveResult.value);
	return makeBoolean(deleted);
}

/**@type {RegistryMethod<[], BooleanValue>}*/
function registroVacío(self, []) {
	return makeBoolean(self.entries.size === 0);
}

/**@type {RegistryMethod<[], ListValue>}*/
function registroValores(self, []) {
	const valuesArray = [ ...self.entries.values() ];
	return makeList(valuesArray);
}

/**@type {Map<String, RegistryMethod>}*/
const registryMethods = new Map();
registryMethods
	.set('claves', registroClaves)
	.set('contiene', registroContiene)
	.set('entradas', registroEntradas)
	.set('filtrar', registroFiltrar)
	.set('paraCada', registroParaCada)
	.set('quitar', registroQuitar)
	.set('vacio', registroVacío)
	.set('vacío', registroVacío)
	.set('valores', registroValores);

module.exports = {
	registryMethods,
};
