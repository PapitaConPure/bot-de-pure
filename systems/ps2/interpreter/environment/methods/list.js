const { ValueKinds, makeText, makeBoolean, makeList, makeRegistry, makeNada, coerceValue } = require('../../values');
const { expectParam, getParamOrNada } = require('../nativeUtils');
const { Scope } = require('../../scope');
const { stringifyPSAST } = require('../../../debug');

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
 * @param {ListValue} self
 * @param {[]} args
 * @param {Scope} scope
 * @returns {ListValue}
 */
function listaAInvertido(self, [], scope) {
	return makeList(self.elements.toReversed());
}

/**
 * @param {ListValue} self
 * @param {[]} args
 * @param {Scope} scope
 * @returns {ListValue}
 */
function listaAOrdenado(self, [], scope) {
	return makeList(self.elements.toSorted((a, b) => a.compareTo(b).value));
}

/**
 * @param {ListValue} self
 * @param {[]} args
 * @param {Scope} scope 
 * @returns {RegistryValue}
 */
function listaARegistro(self, [], scope) {
	const entries = new Map(self.elements.map((el, i) => [ `${i}`, el ]));
	return makeRegistry(entries);
}

/**
 * @param {ListValue} self
 * @param {[ RuntimeValue ]} args
 * @param {Scope} scope 
 * @returns {BooleanValue}
 */
function listaContiene(self, [ x ], scope) {
	const test = self.elements.some(el => el.equals(x));
	return makeBoolean(test);
}

/**
 * @param {ListValue} self
 * @param {[ NumberValue, NumberValue ]} args
 * @param {Scope} scope
 * @returns {ListValue}
 */
function listaCortar(self, [ inicio, fin ], scope) {
	const [ inicioExists, inicioResult ] = getParamOrNada(inicio, ValueKinds.NUMBER, scope);
	if(!inicioExists)
		return self;

	const [ finExists, finResult ] = getParamOrNada(fin, ValueKinds.NUMBER, scope);
	if(!finExists)
		return makeList(self.elements.slice(inicioResult.value));

	return makeList(self.elements.slice(inicioResult.value, finResult.value));
}

/**
 * @param {ListValue} self
 * @param {[]} args
 * @param {Scope} scope
 * @returns {NadaValue}
 */
function listaInvertir(self, [], scope) {
	self.elements.reverse();
	return makeNada();
}

/**
 * @param {ListValue} self
 * @param {[]} args
 * @param {Scope} scope
 * @returns {NadaValue}
 */
function listaOrdenar(self, [], scope) {
	self.elements.sort((a, b,) => a.compareTo(b).value);
	return makeNada();
}

/**
 * @param {ListValue} self
 * @param {[ NumberValue ]} args
 * @param {Scope} scope
 * @returns {RuntimeValue}
 */
function listaRobar(self, [ índice ], scope) {
	const índiceResult = expectParam(índice, ValueKinds.NUMBER, scope);

	if(índiceResult.value < 0 || índiceResult.value >= self.elements.length)
		return makeNada();

	const removed = self.elements.splice(índiceResult.value, 1);
	if(!removed.length || removed[0] == null)
		return makeNada();
	
	return removed[0];
}

/**
 * @param {ListValue} self
 * @param {[]} args
 * @param {Scope} scope
 * @returns {RuntimeValue}
 */
function listaRobarPrimero(self, [], scope) {
	if(!self.elements.length)
		return makeNada();
	
	return self.elements.shift();
}

/**
 * @param {ListValue} self
 * @param {[]} args
 * @param {Scope} scope
 * @returns {RuntimeValue}
 */
function listaRobarÚltimo(self, [], scope) {
	if(!self.elements.length)
		return makeNada();
	
	return self.elements.pop();
}

/**
 * @param {ListValue} self
 * @param {[ TextValue ]} args
 * @param {Scope} scope
 * @returns {TextValue}
 */
function listaUnir(self, [ separador ], scope) {
	if(!self.elements.length)
		return makeText('');

	console.log(`llegó: ${stringifyPSAST({ separador, elements: self.elements })}`);
	const separadorResult = expectParam(separador, ValueKinds.TEXT, scope);
	const elementTextValues = self.elements.map(el => {
		console.log(`Convirtiending: ${stringifyPSAST(el)}`);
		return coerceValue(scope.interpreter, el, ValueKinds.TEXT).value;
	});
	console.log(`llegó: ${stringifyPSAST({ elementTextValues })}`);
	return makeText(elementTextValues.join(separadorResult.value));
}

/**
 * @param {ListValue} self
 * @param {[]} args
 * @param {Scope} scope
 * @returns {BooleanValue}
 */
function listaVacía(self, [], scope) {
	return makeBoolean(self.elements.length === 0);
}

/**@type Map<String, import('../../values').NativeFunction<ListValue>>*/
const listMethods = new Map();
listMethods
	.set('aInvertida', listaAInvertido)
	.set('aInvertido', listaAInvertido)
	.set('aOrdenada', listaAOrdenado)
	.set('aOrdenado', listaAOrdenado)
	.set('aRegistro', listaARegistro)
	.set('contiene', listaContiene)
	.set('cortar', listaCortar)
	.set('invertir', listaInvertir)
	.set('ordenar', listaOrdenar)
	.set('robar', listaRobar)
	.set('robarPrimero', listaRobarPrimero)
	.set('robarUltimo', listaRobarÚltimo)
	.set('robarÚltimo', listaRobarÚltimo)
	.set('unir', listaUnir)
	.set('vacia', listaVacía)
	.set('vacía', listaVacía);

module.exports = {
	listMethods,
};
