const { ValueKinds, makeText, makeBoolean, makeList, makeRegistry, coerceValue, makeNada } = require('../../values');
const { expectParam, makePredicateFn } = require('../nativeUtils');
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
 * @param {RegistryValue} self
 * @param {[]} args
 * @param {Scope} scope
 * @returns {ListValue}
 */
function registroClaves(self, [], scope) {
	const keysArray = [ ...self.entries.keys() ];
	const keyRVals = keysArray.map(key => makeText(key));
	return makeList(keyRVals);
}

/**
 * @param {RegistryValue} self
 * @param {[ TextValue ]} args
 * @param {Scope} scope
 * @returns {BooleanValue}
 */
function registroContiene(self, [ clave ], scope) {
	const claveResult = expectParam('clave', clave, ValueKinds.TEXT, scope)
	return makeBoolean(self.entries.has(claveResult.value));
}

/**
 * @param {RegistryValue} self
 * @param {[]} args
 * @param {Scope} scope
 * @returns {ListValue}
 */
function registroEntradas(self, [], scope) {
	const entriesArray = [ ...self.entries.entries() ];
	const entriesRVal = entriesArray.map(([ k, v ]) => makeList([ makeText(k), v ]));
	return makeList(entriesRVal);
}

/**
 * @param {RegistryValue} self
 * @param {[ FunctionValue ]} args
 * @param {Scope} scope
 * @returns {RegistryValue}
 */
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

/**
 * @param {RegistryValue} self
 * @param {[ FunctionValue ]} args
 * @param {Scope} scope
 * @returns {NadaValue}
 */
function registroParaCada(self, [ predicado ], scope) {
	const fn = makePredicateFn('procedimiento', predicado, scope);

	const entries = new Map(self.entries);
	for(const [ key, value ] of entries)
		fn(makeText(key), value);

	return makeNada();
}

/**
 * @param {RegistryValue} self
 * @param {[ TextValue ]} args
 * @param {Scope} scope
 * @returns {BooleanValue}
 */
function registroQuitar(self, [ clave ], scope) {
	const claveResult = expectParam('clave', clave, ValueKinds.TEXT, scope);
	const deleted = self.entries.delete(claveResult.value);
	return makeBoolean(deleted);
}

/**
 * @param {RegistryValue} self
 * @param {[]} args
 * @param {Scope} scope
 * @returns {BooleanValue}
 */
function registroVacío(self, [], scope) {
	return makeBoolean(self.entries.size === 0);
}

/**
 * @param {RegistryValue} self
 * @param {[]} args
 * @param {Scope} scope
 * @returns {ListValue}
 */
function registroValores(self, [], scope) {
	const valuesArray = [ ...self.entries.values() ];
	return makeList(valuesArray);
}

/**@type Map<String, import('../../values').NativeFunction<RegistryValue>>*/
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
