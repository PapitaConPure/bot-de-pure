const { ValueKinds, makeNumber, makeText, makeBoolean, makeList, makeNada, isInternalOperable } = require('../../values');
const { calculatePositionOffset, expectParam, getParamOrDefault } = require('../nativeUtils');
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
 * 
 * @param {TextValue} self
 * @param {[]} args 
 * @param {Scope} scope 
 * @returns {ListValue}
 */
function textoALista(self, [], scope) {
	return makeList([...self.value].map(v => makeText(v)));
}

/**
 * 
 * @param {TextValue} self
 * @param {[]} args 
 * @param {Scope} scope 
 * @returns {TextValue}
 */
function textoAMinúsculas(self, [], scope) {
	return makeText(self.value.toLowerCase());
}

/**
 * 
 * @param {TextValue} self
 * @param {[]} args 
 * @param {Scope} scope 
 * @returns {TextValue}
 */
function textoAMayúsculas(self, [], scope) {
	return makeText(self.value.toUpperCase());
}

/**
 * @param {TextValue} self
 * @param {[ NumberValue ]} args
 * @param {Scope} scope 
 * @returns {TextValue | NadaValue}
 */
function textoCaracterEn(self, [ posición ], scope) {
	if(posición == null || posición.kind !== ValueKinds.NUMBER || !isInternalOperable(posición.value))
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Número válido como argumento de posición de caracter');

	const pos = calculatePositionOffset(posición.value, self.value.length);
	const str = self.value.charAt(pos);
	if(str?.length)
		return makeText(str);

	return makeNada();
}

/**
 * @param {TextValue} self
 * @param {[ TextValue ]} args
 * @param {Scope} scope 
 * @returns {NumberValue}
 */
function textoPosiciónDe(self, [ texto ], scope) {
	if(texto.kind !== ValueKinds.TEXT)
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Texto válido como argumento de búsqueda de sub-texto');
	
	return makeNumber(self.value.indexOf(texto.value));
}

/**
 * @param {TextValue} self
 * @param {[ TextValue ]} args
 * @param {Scope} scope 
 * @returns {NumberValue}
 */
function textoÚltimaPosiciónDe(self, [ texto ], scope) {
	if(texto.kind !== ValueKinds.TEXT)
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Texto válido como argumento de búsqueda de sub-texto');
	
	return makeNumber(self.value.lastIndexOf(texto.value));
}

/**
 * @param {TextValue} self
 * @param {[ TextValue ]} args
 * @param {Scope} scope 
 * @returns {BooleanValue}
 */
function textoComienzaCon(self, [ texto ], scope) {
	if(texto?.kind !== ValueKinds.TEXT)
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Texto válido como argumento de comprobación de sub-texto');
	
	return makeBoolean(self.value.startsWith(texto.value));
}

/**
 * @param {TextValue} self
 * @param {[ TextValue ]} args
 * @param {Scope} scope 
 * @returns {BooleanValue}
 */
function textoTerminaCon(self, [ texto ], scope) {
	if(texto?.kind !== ValueKinds.TEXT)
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Texto válido como argumento de comprobación de sub-texto');
	
	return makeBoolean(self.value.endsWith(texto.value));
}

/**
 * @param {TextValue} self
 * @param {[ TextValue ]} args
 * @param {Scope} scope 
 * @returns {BooleanValue}
 */
function textoContiene(self, [ texto ], scope) {
	if(texto?.kind !== ValueKinds.TEXT)
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Texto válido como argumento de comprobación de sub-texto');
	
	return makeBoolean(self.value.includes(texto.value));
}

/**
 * @param {TextValue} self
 * @param {[ NumberValue ]} args
 * @param {Scope} scope 
 * @returns {TextValue}
 */
function textoRepetido(self, [ veces ], scope) {
	if(veces.kind !== ValueKinds.NUMBER || !isInternalOperable(veces.value))
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Número válido como argumento de repeticiones de Texto');
	let pos = Math.floor(veces.value);
	if(pos < 0 || (pos * self.value.length) > 1024)
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Número positivo hasta 1024 como argumento de repeticiones de Texto');

	return makeText(self.value.repeat(pos));
}

/**
 * @param {TextValue} self
 * @param {[ TextValue, TextValue ]} args
 * @param {Scope} scope 
 * @returns {TextValue}
 */
function textoReemplazar(self, [ocurrencia, reemplazo], scope) {
	if(ocurrencia.kind !== ValueKinds.TEXT)
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Texto válido como argumento de ocurrencia a reemplazar');
	if(reemplazo.kind !== ValueKinds.TEXT)
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Texto como argumento de reemplazo de ocurrencia');
	
	return makeText(self.value.replace(ocurrencia.value, reemplazo.value));
}

/**
 * @param {TextValue} self
 * @param {[ TextValue ]} args
 * @param {Scope} scope 
 * @returns {ListValue}
 */
function textoPartir(self, [separador], scope) {
	if(separador.kind !== ValueKinds.TEXT)
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Texto válido como argumento separador de Texto');
	
	return makeList(self.value.split(separador.value).map(split => makeText(split)));
}

/**
 * @param {TextValue} self
 * @param {[ NumberValue, NumberValue ]} args
 * @param {Scope} scope 
 * @returns {TextValue}
 */
function textoCortar(self, [ inicio, fin ], scope) {
	if(inicio == undefined || inicio.kind !== ValueKinds.NUMBER || !isInternalOperable(inicio.value))
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Número válido como primer argumento de recorte de Texto');
	if(fin == undefined)
		return makeText(self.value.slice(inicio.value));
	if(fin.kind !== ValueKinds.NUMBER || !isInternalOperable(fin.value))
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Número válido como segundo argumento de recorte de Texto');

	return makeText(self.value.slice(inicio.value, fin.value));
}

/**
 * @param {TextValue} self
 * @param {[]} args
 * @param {Scope} scope 
 * @returns {TextValue}
 */
function textoNormalizar(self, [], scope) {
	return makeText(self.value.trim());
}

/**@type Map<String, import('../../values').NativeFunction<TextValue>>>*/
const textMethods = new Map();
textMethods
	.set('aLista', textoALista)
	.set('aMinuscula', textoAMinúsculas)
	.set('aMinúscula', textoAMinúsculas)
	.set('aMayuscula', textoAMayúsculas)
	.set('aMayúscula', textoAMayúsculas)
	.set('aMinusculas', textoAMinúsculas)
	.set('aMinúsculas', textoAMinúsculas)
	.set('aMayusculas', textoAMayúsculas)
	.set('aMayúsculas', textoAMayúsculas)
	.set('caracterEn', textoCaracterEn)
	.set('posicionDe', textoPosiciónDe)
	.set('posiciónDe', textoPosiciónDe)
	.set('ultimaPosicionDe', textoÚltimaPosiciónDe)
	.set('últimaPosiciónDe', textoÚltimaPosiciónDe)
	.set('comienzaCon', textoComienzaCon)
	.set('terminaCon', textoTerminaCon)
	.set('contiene', textoContiene)
	.set('repetido', textoRepetido)
	.set('repetida', textoRepetido)
	.set('reemplazar', textoReemplazar)
	.set('partir', textoPartir)
	.set('cortar', textoCortar)
	.set('normalizar', textoNormalizar);

module.exports = {
	textMethods,
};
