/* eslint-disable no-empty-pattern */

import { RuntimeValue, NativeFunction, ValueKinds, NumberValue, TextValue, BooleanValue, ListValue, NadaValue, makeNumber, makeText, makeBoolean, makeList, makeNada, isInternalOperable } from '../../values';
import { calculatePositionOffset, expectParam, getParamOrDefault } from '../nativeUtils';
import { toLowerCaseNormalized } from '../../../util/utils';

export type TextMethod<TArg extends RuntimeValue[] = RuntimeValue[], TResult extends RuntimeValue = RuntimeValue>
	= NativeFunction<TextValue, TArg, TResult>;

const textoAcotar: TextMethod<[], TextValue> = (self, []) => {
	return makeText(self.value.trim());
};

const textoALista: TextMethod<[], ListValue> = (self, []) => {
	return makeList([ ...self.value ].map(v => makeText(v)));
};

const textoAMayúsculas: TextMethod<[], TextValue> = (self, []) => {
	return makeText(self.value.toUpperCase());
};

const textoAMinúsculas: TextMethod<[], TextValue> = (self, []) => {
	return makeText(self.value.toLowerCase());
};

const textoCaracterEn: TextMethod<[ NumberValue ], TextValue | NadaValue> = (self, [ posición ], scope) => {
	if(posición == null || posición.kind !== ValueKinds.NUMBER || !isInternalOperable(posición.value))
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Número válido como argumento de posición de caracter');

	const pos = calculatePositionOffset(posición.value, self.value.length);
	const str = self.value.charAt(pos);
	if(str?.length)
		return makeText(str);

	return makeNada();
};

const textoComienzaCon: TextMethod<[ TextValue ], BooleanValue> = (self, [ subCadena ], scope) => {
	const subCadenaResult = expectParam('subCadena', subCadena, ValueKinds.TEXT, scope);
	return makeBoolean(self.value.startsWith(subCadenaResult.value));
};

const textoContiene: TextMethod<[ TextValue ], BooleanValue> = (self, [ subCadena ], scope) => {
	const subCadenaResult = expectParam('subCadena', subCadena, ValueKinds.TEXT, scope);
	return makeBoolean(self.value.includes(subCadenaResult.value));
};

const textoCortar: TextMethod<[ NumberValue, NumberValue ], TextValue> = (self, [ inicio, fin ], scope) => {
	const inicioResult = getParamOrDefault('inicio', inicio, ValueKinds.NUMBER, scope, 0);
	const finResult = getParamOrDefault('fin', fin, ValueKinds.NUMBER, scope, self.value.length);

	return makeText(self.value.slice(inicioResult.value, finResult.value));
};

const textoNormalizar: TextMethod<[], TextValue> = (self, []) => {
	return makeText(toLowerCaseNormalized(self.value.trim()));
};

const textoPartir: TextMethod<[ TextValue ], ListValue> = (self, [ separador ], scope) => {
	if(separador.kind !== ValueKinds.TEXT)
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Texto válido como argumento separador de Texto');

	return makeList(self.value.split(separador.value).map(split => makeText(split)));
};

const textoPosiciónDe: TextMethod<[ TextValue ], NumberValue> = (self, [ búsqueda ], scope) => {
	const búsquedaValue = expectParam('búsqueda', búsqueda, ValueKinds.TEXT, scope).value;
	return makeNumber(self.value.indexOf(búsquedaValue));
};

const textoReemplazar: TextMethod<[ TextValue, TextValue ], TextValue> = (self, [ ocurrencia, reemplazo ], scope) => {
	const ocurrenciaValue = expectParam('ocurrencia', ocurrencia, ValueKinds.TEXT, scope).value;

	if(ocurrenciaValue.length === 0)
		throw scope.interpreter.TuberInterpreterError(`Se esperaba un Texto no-vacío como ocurrencia de Función \`reemplazar\``);

	const reemplazoValue = expectParam('reemplazo', reemplazo, ValueKinds.TEXT, scope).value;
	return makeText(self.value.replace(ocurrenciaValue, reemplazoValue));
};

const textoRepetido: TextMethod<[ NumberValue ], TextValue> = (self, [ veces ], scope) => {
	const vecesResult = expectParam('veces', veces, ValueKinds.NUMBER, scope);

	const times = Math.floor(vecesResult.value);
	if(times < 0 || (times * self.value.length) > 1024)
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Número positivo hasta 1024 como argumento de repeticiones de Texto');

	return makeText(self.value.repeat(times));
};

const textoTerminaCon: TextMethod<[ TextValue ], BooleanValue> = (self, [ texto ], scope) => {
	if(texto?.kind !== ValueKinds.TEXT)
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Texto válido como argumento de comprobación de sub-texto');

	return makeBoolean(self.value.endsWith(texto.value));
};

const textoÚltimaPosiciónDe: TextMethod<[ TextValue ], NumberValue> = (self, [ texto ], scope) => {
	if(texto.kind !== ValueKinds.TEXT)
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Texto válido como argumento de búsqueda de sub-texto');

	return makeNumber(self.value.lastIndexOf(texto.value));
};

export const textMethods = new Map<string, TextMethod>()
	.set('acotar', textoAcotar)
	.set('aLista', textoALista)
	.set('aMinuscula', textoAMinúsculas)
	.set('aMinúscula', textoAMinúsculas)
	.set('aMayuscula', textoAMayúsculas)
	.set('aMayúscula', textoAMayúsculas)
	.set('aMinusculas', textoAMinúsculas)
	.set('aMinúsculas', textoAMinúsculas)
	.set('aMayusculas', textoAMayúsculas)
	.set('aMayúsculas', textoAMayúsculas)
	.set('aRepetida', textoRepetido)
	.set('aRepetido', textoRepetido)
	.set('caracterEn', textoCaracterEn)
	.set('comienzaCon', textoComienzaCon)
	.set('contiene', textoContiene)
	.set('cortar', textoCortar)
	.set('incluye', textoContiene)
	.set('normalizar', textoNormalizar)
	.set('normalizado', textoNormalizar)
	.set('partir', textoPartir)
	.set('posicionDe', textoPosiciónDe)
	.set('posiciónDe', textoPosiciónDe)
	.set('reemplazar', textoReemplazar)
	.set('repetida', textoRepetido)
	.set('repetido', textoRepetido)
	.set('terminaCon', textoTerminaCon)
	.set('ultimaPosicionDe', textoÚltimaPosiciónDe)
	.set('últimaPosiciónDe', textoÚltimaPosiciónDe);
