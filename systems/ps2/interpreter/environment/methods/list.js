const { ValueKinds, makeText, makeBoolean, makeList, makeRegistry, makeNada, coerceValue, makeNumber } = require('../../values');
const { expectParam, getParamOrNada, makePredicateFn } = require('../nativeUtils');
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
	const [ inicioExists, inicioResult ] = getParamOrNada('inicio', inicio, ValueKinds.NUMBER, scope);
	if(!inicioExists)
		return self;

	const [ finExists, finResult ] = getParamOrNada('fin', fin, ValueKinds.NUMBER, scope);
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
 * @param {[ NumberValue ]} args
 * @param {Scope} scope
 * @returns {RuntimeValue}
 */
function listaRobar(self, [ índice ], scope) {
	const índiceResult = expectParam('índice', índice, ValueKinds.NUMBER, scope);

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

	const separadorResult = expectParam('separador', separador, ValueKinds.TEXT, scope);
	const elementTextValues = self.elements.map(el => coerceValue(scope.interpreter, el, ValueKinds.TEXT).value);
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

/**
 * @param {ListValue} self
 * @param {[ FunctionValue ]} args
 * @param {Scope} scope
 * @returns {ListValue}
 */
function listaFiltrar(self, [ predicado ], scope) {
	const fn = makePredicateFn('filtro', predicado, scope);
	const processedElements = self.elements.filter((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value);
	return makeList(processedElements);
}

/**
 * @param {ListValue} self
 * @param {[ FunctionValue ]} args
 * @param {Scope} scope
 * @returns {ListValue}
 */
function listaMapear(self, [ predicado ], scope) {
	const fn = makePredicateFn('mapeo', predicado, scope);
	const processedElements = self.elements.map((el, i) => fn(el, makeNumber(i), self));
	return makeList(processedElements);
}

/**
 * @param {ListValue} self
 * @param {[ FunctionValue ]} args
 * @param {Scope} scope
 * @returns {RuntimeValue}
 */
function listaEncontrar(self, [ predicado ], scope) {
	const fn = makePredicateFn('búsqueda', predicado, scope);
	const element = self.elements.find((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value) ?? makeNada();
	return element;
}

/**
 * @param {ListValue} self
 * @param {[ FunctionValue ]} args
 * @param {Scope} scope
 * @returns {RuntimeValue}
 */
function listaEncontrarÚltimo(self, [ predicado ], scope) {
	const fn = makePredicateFn('búsqueda', predicado, scope);
	const element = self.elements.findLast((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value) ?? makeNada();
	return element;
}

/**
 * @param {ListValue} self
 * @param {[ FunctionValue ]} args
 * @param {Scope} scope
 * @returns {NumberValue}
 */
function listaEncontrarId(self, [ predicado ], scope) {
	const fn = makePredicateFn('búsqueda', predicado, scope);
	const idx = self.elements.findIndex((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value);
	return makeNumber(idx);
}

/**
 * @param {ListValue} self
 * @param {[ FunctionValue ]} args
 * @param {Scope} scope
 * @returns {NumberValue}
 */
function listaEncontrarÚltimaId(self, [ predicado ], scope) {
	const fn = makePredicateFn('búsqueda', predicado, scope);
	const idx = self.elements.findLastIndex((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value);
	return makeNumber(idx);
}

/**
 * @param {ListValue} self
 * @param {[ FunctionValue ]} args
 * @param {Scope} scope
 * @returns {NadaValue}
 */
function listaOrdenar(self, [ predicado ], scope) {
	if(predicado == null) {
		self.elements.sort((a, b) => a.compareTo(b).value);
	} else {
		const fn = makePredicateFn('criterio', predicado, scope);
		self.elements.sort((a, b) => coerceValue(scope.interpreter, fn(a, b), ValueKinds.NUMBER).value);
	}
	
	return makeNada();
}

/**
 * @param {ListValue} self
 * @param {[ FunctionValue ]} args
 * @param {Scope} scope
 * @returns {ListValue}
 */
function listaAOrdenada(self, [ predicado ], scope) {
	if(predicado == null)
		return makeList(self.elements.toSorted((a, b) => a.compareTo(b).value));
	
	const fn = makePredicateFn('criterio', predicado, scope);
	const processedElements = self.elements.toSorted((a, b) => coerceValue(scope.interpreter, fn(a, b), ValueKinds.NUMBER).value);
	return makeList(processedElements);
}

/**
 * @param {ListValue} self
 * @param {[ FunctionValue ]} args
 * @param {Scope} scope
 * @returns {BooleanValue}
 */
function listaAlguno(self, [ predicado ], scope) {
	const fn = makePredicateFn('predicado', predicado, scope);
	const test = self.elements.some((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value);
	return makeBoolean(test);
}

/**
 * @param {ListValue} self
 * @param {[ FunctionValue ]} args
 * @param {Scope} scope
 * @returns {BooleanValue}
 */
function listaTodos(self, [ predicado ], scope) {
	const fn = makePredicateFn('predicado', predicado, scope);
	const test = self.elements.every((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value);
	return makeBoolean(test);
}

/**
 * @param {ListValue} self
 * @param {[ FunctionValue ]} args
 * @param {Scope} scope
 * @returns {NadaValue}
 */
function listaParaCada(self, [ predicado ], scope) {
	const fn = makePredicateFn('procedimiento', predicado, scope);
	self.elements.slice().forEach((el, i) => fn(el, makeNumber(i), self));
	return makeNada();
}

/**@type Map<String, import('../../values').NativeFunction<ListValue>>*/
const listMethods = new Map();
listMethods
	.set('aInvertida', listaAInvertido)
	.set('aInvertido', listaAInvertido)
	.set('algun', listaAlguno)
	.set('algún', listaAlguno)
	.set('alguno', listaAlguno)
	.set('aOrdenada', listaAOrdenada)
	.set('aOrdenado', listaAOrdenada)
	.set('aRegistro', listaARegistro)
	.set('contiene', listaContiene)
	.set('cortar', listaCortar)
	.set('encontrar', listaEncontrar)
	.set('encontrarId', listaEncontrarId)
	.set('encontrarUltimaId', listaEncontrarÚltimaId)
	.set('encontrarÚltimaId', listaEncontrarÚltimaId)
	.set('encontrarUltimo', listaEncontrarÚltimo)
	.set('encontrarÚltimo', listaEncontrarÚltimo)
	.set('filtrar', listaFiltrar)
	.set('incluye', listaContiene)
	.set('invertir', listaInvertir)
	.set('mapear', listaMapear)
	.set('ordenar', listaOrdenar)
	.set('ordenada', listaAOrdenada)
	.set('ordenado', listaAOrdenada)
	.set('paraCada', listaParaCada)
	.set('robar', listaRobar)
	.set('robarPrimero', listaRobarPrimero)
	.set('robarUltimo', listaRobarÚltimo)
	.set('robarÚltimo', listaRobarÚltimo)
	.set('todos', listaTodos)
	.set('unir', listaUnir)
	.set('vacia', listaVacía)
	.set('vacía', listaVacía);

module.exports = {
	listMethods,
};
