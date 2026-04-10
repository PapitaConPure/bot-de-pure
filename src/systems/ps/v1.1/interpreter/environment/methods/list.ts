/* eslint-disable no-empty-pattern */

import { RuntimeValue, NativeFunction, ValueKinds, NumberValue, TextValue, BooleanValue, ListValue, RegistryValue, FunctionValue, NadaValue, makeNumber, makeText, makeBoolean, makeList, makeRegistry, makeNada, coerceValue } from '../../values';
import { expectParam, getParamOrNada, makePredicateFn, getParamOrDefault } from '../nativeUtils';
import { randRange } from '../../../util/utils';

export type ListMethod<TArg extends RuntimeValue[] = RuntimeValue[], TResult extends RuntimeValue = RuntimeValue>
	= NativeFunction<ListValue, TArg, TResult>;

const listaAInvertido: ListMethod<[], ListValue> = (self, []) => {
	return makeList(self.elements.toReversed());
};

const listaAlguno: ListMethod<[ FunctionValue ], BooleanValue> = (self, [ predicado ], scope) => {
	const fn = makePredicateFn('predicado', predicado, scope);
	const test = self.elements.some((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value);
	return makeBoolean(test);
};

const listaAOrdenada: ListMethod<[ FunctionValue ], ListValue> = (self, [ criterio ], scope) => {
	if(criterio == null)
		return makeList(self.elements.toSorted((a, b) => a.compareTo(b).value));

	const fn = makePredicateFn('criterio', criterio, scope);
	const processedElements = self.elements.toSorted((a, b) => coerceValue(scope.interpreter, fn(a, b), ValueKinds.NUMBER).value);
	return makeList(processedElements);
};

const listaARegistro: ListMethod<[], RegistryValue> = (self, []) => {
	const entries = new Map(self.elements.map((el, i) => [ `${i}`, el ]));
	return makeRegistry(entries);
};

const listaContiene: ListMethod<[ RuntimeValue ], BooleanValue> = (self, [ x ]) => {
	const test = self.elements.some(el => el.equals(x));
	return makeBoolean(test);
};

const listaCortar: ListMethod<[ NumberValue, NumberValue ], ListValue> = (self, [ inicio, fin ], scope) => {
	const [ inicioExists, inicioResult ] = getParamOrNada('inicio', inicio, ValueKinds.NUMBER, scope);
	if(!inicioExists)
		return self;

	const [ finExists, finResult ] = getParamOrNada('fin', fin, ValueKinds.NUMBER, scope);
	if(!finExists)
		return makeList(self.elements.slice(inicioResult.value));

	return makeList(self.elements.slice(inicioResult.value, finResult.value));
};

const listaElegir: ListMethod<[ NumberValue, NumberValue ]> = (self, [ mínimo, máximo ], scope) => {
	const mínimoResult = getParamOrDefault('mínimo', mínimo, ValueKinds.NUMBER, scope, 0);
	const máximoResult = getParamOrDefault('máximo', máximo, ValueKinds.NUMBER, scope, self.elements.length);

	return self.elements[randRange(mínimoResult.value, máximoResult.value, true)];
};

const listaEncontrar: ListMethod<[ FunctionValue ]> = (self, [ predicado ], scope) => {
	const fn = makePredicateFn('predicado', predicado, scope);
	const element = self.elements.find((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value) ?? makeNada();
	return element;
};

const listaEncontrarÚltimo: ListMethod<[ FunctionValue ]> = (self, [ predicado ], scope) => {
	const fn = makePredicateFn('predicado', predicado, scope);
	const element = self.elements.findLast((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value) ?? makeNada();
	return element;
};

const listaEncontrarId: ListMethod<[ FunctionValue ], NumberValue> = (self, [ predicado ], scope) => {
	const fn = makePredicateFn('predicado', predicado, scope);
	const idx = self.elements.findIndex((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value);
	return makeNumber(idx);
};

const listaEncontrarÚltimoId: ListMethod<[ FunctionValue ], NumberValue> = (self, [ predicado ], scope) => {
	const fn = makePredicateFn('predicado', predicado, scope);
	const idx = self.elements.findLastIndex((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value);
	return makeNumber(idx);
};

const listaFiltrar: ListMethod<[ FunctionValue ], ListValue> = (self, [ filtro ], scope) => {
	const fn = makePredicateFn('filtro', filtro, scope);
	const processedElements = self.elements.filter((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value);
	return makeList(processedElements);
};

const listaInvertir: ListMethod<[], NadaValue> = (self, []) => {
	self.elements.reverse();
	return makeNada();
};

const listaMapear: ListMethod<[ FunctionValue ], ListValue> = (self, [ mapeo ], scope) => {
	const fn = makePredicateFn('mapeo', mapeo, scope);
	const processedElements = self.elements.map((el, i) => fn(el, makeNumber(i), self));
	return makeList(processedElements);
};

const listaOrdenar: ListMethod<[ FunctionValue ], NadaValue> = (self, [ criterio ], scope) => {
	if(criterio == null) {
		self.elements.sort((a, b) => a.compareTo(b).value);
	} else {
		const fn = makePredicateFn('criterio', criterio, scope);
		self.elements.sort((a, b) => coerceValue(scope.interpreter, fn(a, b), ValueKinds.NUMBER).value);
	}

	return makeNada();
};

const listaParaCada: ListMethod<[ FunctionValue ], NadaValue> = (self, [ procedimiento ], scope) => {
	const fn = makePredicateFn('procedimiento', procedimiento, scope);
	self.elements.slice().forEach((el, i) => fn(el, makeNumber(i), self));
	return makeNada();
};

const listaRobar: ListMethod<[ NumberValue ]> = (self, [ índice ], scope) => {
	const índiceResult = expectParam('índice', índice, ValueKinds.NUMBER, scope);

	if(índiceResult.value < 0 || índiceResult.value >= self.elements.length)
		return makeNada();

	const removed = self.elements.splice(índiceResult.value, 1);
	if(!removed.length || removed[0] == null)
		return makeNada();

	return removed[0];
};

const listaRobarPrimero: ListMethod<[]> = (self, []) => {
	return self.elements.shift() ?? makeNada();
};

const listaRobarÚltimo: ListMethod<[]> = (self, []) => {
	return self.elements.pop() ?? makeNada();
};

const listaTodos: ListMethod<[ FunctionValue ], BooleanValue> = (self, [ predicado ], scope) => {
	const fn = makePredicateFn('predicado', predicado, scope);
	const test = self.elements.every((el, i) => coerceValue(scope.interpreter, fn(el, makeNumber(i), self), ValueKinds.BOOLEAN).value);
	return makeBoolean(test);
};

const listaUnir: ListMethod<[ TextValue ], TextValue> = (self, [ separador ], scope) => {
	if(!self.elements.length)
		return makeText('');

	const separadorResult = getParamOrDefault('separador', separador, ValueKinds.TEXT, scope, ',');
	const elementTextValues = self.elements.map(el => coerceValue(scope.interpreter, el, ValueKinds.TEXT).value);
	return makeText(elementTextValues.join(separadorResult.value));
};

const listaÚltimo: ListMethod<[]> = (self, []) => {
	return self.elements[self.elements.length];
};

const listaVacía: ListMethod<[], BooleanValue> = (self, []) => {
	return makeBoolean(self.elements.length === 0);
};

export const listMethods = new Map<string, ListMethod>()
	.set('aleatorio', listaElegir)
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
	.set('elegir', listaElegir)
	.set('encontrar', listaEncontrar)
	.set('encontrarId', listaEncontrarId)
	.set('encontrarUltimaId', listaEncontrarÚltimoId)
	.set('encontrarÚltimaId', listaEncontrarÚltimoId)
	.set('encontrarUltimoId', listaEncontrarÚltimoId)
	.set('encontrarÚltimoId', listaEncontrarÚltimoId)
	.set('encontrarUltimo', listaEncontrarÚltimo)
	.set('encontrarÚltimo', listaEncontrarÚltimo)
	.set('escoger', listaElegir)
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
