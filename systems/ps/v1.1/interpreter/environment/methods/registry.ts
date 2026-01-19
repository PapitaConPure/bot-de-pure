/* eslint-disable no-empty-pattern */

import { RuntimeValue, NativeFunction, ValueKinds, TextValue, BooleanValue, ListValue, RegistryValue, FunctionValue, NadaValue, makeText, makeBoolean, makeList, makeRegistry, makeNada, coerceValue } from '../../values';
import { makePredicateFn, expectParam } from '../nativeUtils';

export type RegistryMethod<TArg extends RuntimeValue[] = RuntimeValue[], TResult extends RuntimeValue = RuntimeValue>
	= NativeFunction<RegistryValue, TArg, TResult>;

const registroClaves: RegistryMethod<[], ListValue> = (self, []) => {
	const keysArray = [ ...self.entries.keys() ];
	const keyRVals = keysArray.map(key => makeText(key));
	return makeList(keyRVals);
};

const registroContiene: RegistryMethod<[ TextValue ], BooleanValue> = (self, [ clave ], scope) => {
	const claveResult = expectParam('clave', clave, ValueKinds.TEXT, scope);
	return makeBoolean(self.entries.has(claveResult.value));
};

const registroEntradas: RegistryMethod<[], ListValue> = (self, []) => {
	const entriesArray = [ ...self.entries.entries() ];
	const entriesRVal = entriesArray.map(([ k, v ]) => makeList([ makeText(k), v ]));
	return makeList(entriesRVal);
};

const registroFiltrar: RegistryMethod<[ FunctionValue ], RegistryValue> = (self, [ predicado ], scope) => {
	const fn = makePredicateFn('filtro', predicado, scope);

	const filtered = new Map<string, RuntimeValue>();
	for(const [ key, value ] of self.entries) {
		const test = coerceValue(scope.interpreter, fn(makeText(key), value), ValueKinds.BOOLEAN);
		if(test.value)
			filtered.set(key, value);
	}

	return makeRegistry(filtered);
};

const registroParaCada: RegistryMethod<[ FunctionValue ], NadaValue> = (self, [ predicado ], scope) => {
	const fn = makePredicateFn('procedimiento', predicado, scope);

	const entries = new Map(self.entries);
	for(const [ key, value ] of entries)
		fn(makeText(key), value);

	return makeNada();
};

const registroQuitar: RegistryMethod<[ TextValue ], BooleanValue> = (self, [ clave ], scope) => {
	const claveResult = expectParam('clave', clave, ValueKinds.TEXT, scope);
	const deleted = self.entries.delete(claveResult.value);
	return makeBoolean(deleted);
};

const registroVacío: RegistryMethod<[], BooleanValue> = (self, []) => {
	return makeBoolean(self.entries.size === 0);
};

const registroValores: RegistryMethod<[], ListValue> = (self, []) => {
	const valuesArray = [ ...self.entries.values() ];
	return makeList(valuesArray);
};

export const registryMethods = new Map<string, RegistryMethod>()
	.set('claves', registroClaves)
	.set('contiene', registroContiene)
	.set('entradas', registroEntradas)
	.set('filtrar', registroFiltrar)
	.set('paraCada', registroParaCada)
	.set('quitar', registroQuitar)
	.set('vacio', registroVacío)
	.set('vacío', registroVacío)
	.set('valores', registroValores);
