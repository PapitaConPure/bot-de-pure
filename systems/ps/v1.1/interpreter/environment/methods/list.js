const { ValueKinds, makeText, makeBoolean, makeList, makeRegistry, makeNada, coerceValue, makeNumber } = require('../../values');
const { expectParam, getParamOrNada, makePredicateFn, getParamOrDefault } = require('../nativeUtils');

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
 * @typedef {import('../../values').NativeFunction<ListValue, TArg, TResult>} ListMethod
 */

/**@type {ListMethod<[], ListValue>}*/
function listaAInvertido(self, []) {
	return makeList(self.elements.toReversed());
}

/**@type {ListMethod<[ FunctionValue ], BooleanValue>}*/
function listaAlguno(self, [ predicado ], scope) {
	const fn = makePredicateFn('predicado', predicado, scope);
	const test = self.elements.some((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value);
	return makeBoolean(test);
}

/**@type {ListMethod<[ FunctionValue ], ListValue>}*/
function listaAOrdenada(self, [ criterio ], scope) {
	if(criterio == null)
		return makeList(self.elements.toSorted((a, b) => a.compareTo(b).value));
	
	const fn = makePredicateFn('criterio', criterio, scope);
	const processedElements = self.elements.toSorted((a, b) => coerceValue(scope.interpreter, fn(a, b), ValueKinds.NUMBER).value);
	return makeList(processedElements);
}

/**@type {ListMethod<[], RegistryValue>}*/
function listaARegistro(self, []) {
	const entries = new Map(self.elements.map((el, i) => [ `${i}`, el ]));
	return makeRegistry(entries);
}

/**@type {ListMethod<[ RuntimeValue ], BooleanValue>}*/
function listaContiene(self, [ x ]) {
	const test = self.elements.some(el => el.equals(x));
	return makeBoolean(test);
}

/**@type {ListMethod<[ NumberValue, NumberValue ], ListValue>}*/
function listaCortar(self, [ inicio, fin ], scope) {
	const [ inicioExists, inicioResult ] = getParamOrNada('inicio', inicio, ValueKinds.NUMBER, scope);
	if(!inicioExists)
		return self;

	const [ finExists, finResult ] = getParamOrNada('fin', fin, ValueKinds.NUMBER, scope);
	if(!finExists)
		return makeList(self.elements.slice(inicioResult.value));

	return makeList(self.elements.slice(inicioResult.value, finResult.value));
}

/**@type {ListMethod<[ FunctionValue ]>}*/
function listaEncontrar(self, [ predicado ], scope) {
	const fn = makePredicateFn('predicado', predicado, scope);
	const element = self.elements.find((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value) ?? makeNada();
	return element;
}

/**@type {ListMethod<[ FunctionValue ]>}*/
function listaEncontrarÚltimo(self, [ predicado ], scope) {
	const fn = makePredicateFn('predicado', predicado, scope);
	const element = self.elements.findLast((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value) ?? makeNada();
	return element;
}

/**@type {ListMethod<[ FunctionValue ], NumberValue>}*/
function listaEncontrarId(self, [ predicado ], scope) {
	const fn = makePredicateFn('predicado', predicado, scope);
	const idx = self.elements.findIndex((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value);
	return makeNumber(idx);
}

/**@type {ListMethod<[ FunctionValue ], NumberValue>}*/
function listaEncontrarÚltimoId(self, [ predicado ], scope) {
	const fn = makePredicateFn('predicado', predicado, scope);
	const idx = self.elements.findLastIndex((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value);
	return makeNumber(idx);
}

/**@type {ListMethod<[ FunctionValue ], ListValue>}*/
function listaFiltrar(self, [ filtro ], scope) {
	const fn = makePredicateFn('filtro', filtro, scope);
	const processedElements = self.elements.filter((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value);
	return makeList(processedElements);
}

/**@type {ListMethod<[], NadaValue>}*/
function listaInvertir(self, []) {
	self.elements.reverse();
	return makeNada();
}

/**@type {ListMethod<[ FunctionValue ], ListValue>}*/
function listaMapear(self, [ mapeo ], scope) {
	const fn = makePredicateFn('mapeo', mapeo, scope);
	const processedElements = self.elements.map((el, i) => fn(el, makeNumber(i), self));
	return makeList(processedElements);
}

/**@type {ListMethod<[ FunctionValue ], NadaValue>}*/
function listaOrdenar(self, [ criterio ], scope) {
	if(criterio == null) {
		self.elements.sort((a, b) => a.compareTo(b).value);
	} else {
		const fn = makePredicateFn('criterio', criterio, scope);
		self.elements.sort((a, b) => coerceValue(scope.interpreter, fn(a, b), ValueKinds.NUMBER).value);
	}
	
	return makeNada();
}

/**@type {ListMethod<[ FunctionValue ], NadaValue>}*/
function listaParaCada(self, [ procedimiento ], scope) {
	const fn = makePredicateFn('procedimiento', procedimiento, scope);
	self.elements.slice().forEach((el, i) => fn(el, makeNumber(i), self));
	return makeNada();
}

/**@type {ListMethod<[ NumberValue ]>}*/
function listaRobar(self, [ índice ], scope) {
	const índiceResult = expectParam('índice', índice, ValueKinds.NUMBER, scope);

	if(índiceResult.value < 0 || índiceResult.value >= self.elements.length)
		return makeNada();

	const removed = self.elements.splice(índiceResult.value, 1);
	if(!removed.length || removed[0] == null)
		return makeNada();
	
	return removed[0];
}

/**@type {ListMethod<[]>}*/
function listaRobarPrimero(self, []) {
	return self.elements.shift() ?? makeNada();
}

/**@type {ListMethod<[]>}*/
function listaRobarÚltimo(self, []) {
	return self.elements.pop() ?? makeNada();
}

/**@type {ListMethod<[ FunctionValue ], BooleanValue>}*/
function listaTodos(self, [ predicado ], scope) {
	const fn = makePredicateFn('predicado', predicado, scope);
	const test = self.elements.every((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value);
	return makeBoolean(test);
}

/**@type {ListMethod<[ TextValue ], TextValue>}*/
function listaUnir(self, [ separador ], scope) {
	if(!self.elements.length)
		return makeText('');

	const separadorResult = getParamOrDefault('separador', separador, ValueKinds.TEXT, scope, ',');
	const elementTextValues = self.elements.map(el => coerceValue(scope.interpreter, el, ValueKinds.TEXT).value);
	return makeText(elementTextValues.join(separadorResult.value));
}

/**@type {ListMethod<[]>}*/
function listaÚltimo(self, []) {
	return self.elements[self.elements.length];
}

/**@type {ListMethod<[], BooleanValue>}*/
function listaVacía(self, []) {
	return makeBoolean(self.elements.length === 0);
}

/**@type {Map<String, ListMethod>}*/
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
	.set('encontrarUltimaId', listaEncontrarÚltimoId)
	.set('encontrarÚltimaId', listaEncontrarÚltimoId)
	.set('encontrarUltimoId', listaEncontrarÚltimoId)
	.set('encontrarÚltimoId', listaEncontrarÚltimoId)
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
	.set('ultimo', listaÚltimo)
	.set('último', listaÚltimo)
	.set('vacia', listaVacía)
	.set('vacía', listaVacía);

module.exports = {
	listMethods,
};
