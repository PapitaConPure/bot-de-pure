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
function textoAMayúsculas(self, [], scope) {
	return makeText(self.value.toUpperCase());
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
 * @returns {BooleanValue}
 */
function textoComienzaCon(self, [ subCadena ], scope) {
	const subCadenaResult = expectParam('subCadena', subCadena, ValueKinds.TEXT, scope);
	return makeBoolean(self.value.startsWith(subCadenaResult.value));
}

/**
 * @param {TextValue} self
 * @param {[ TextValue ]} args
 * @param {Scope} scope 
 * @returns {BooleanValue}
 */
function textoContiene(self, [ subCadena ], scope) {
	const subCadenaResult = expectParam('subCadena', subCadena, ValueKinds.TEXT, scope);
	return makeBoolean(self.value.includes(subCadenaResult.value));
}

/**
 * @param {TextValue} self
 * @param {[ NumberValue, NumberValue ]} args
 * @param {Scope} scope 
 * @returns {TextValue}
 */
function textoCortar(self, [ inicio, fin ], scope) {
	const inicioResult = getParamOrDefault('inicio', inicio, ValueKinds.NUMBER, scope, 0);
	const finResult = getParamOrDefault('fin', fin, ValueKinds.NUMBER, scope, self.value.length);

	return makeText(self.value.slice(inicioResult.value, finResult.value));
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
 * @param {[ TextValue ]} args
 * @param {Scope} scope 
 * @returns {NumberValue}
 */
function textoPosiciónDe(self, [ búsqueda ], scope) {
	const búsquedaValue = expectParam('búsqueda', búsqueda, ValueKinds.TEXT, scope).value;
	return makeNumber(self.value.indexOf(búsquedaValue));
}

/**
 * @param {TextValue} self
 * @param {[ TextValue, TextValue ]} args
 * @param {Scope} scope 
 * @returns {TextValue}
 */
function textoReemplazar(self, [ocurrencia, reemplazo], scope) {
	const ocurrenciaValue = expectParam('ocurrencia', ocurrencia, ValueKinds.TEXT, scope).value;

	if(ocurrenciaValue.length === 0)
		throw scope.interpreter.TuberInterpreterError(`Se esperaba un Texto no-vacío como ocurrencia de Función \`reemplazar\``)

	const reemplazoValue = expectParam('reemplazo', reemplazo, ValueKinds.TEXT, scope).value;
	return makeText(self.value.replace(ocurrenciaValue, reemplazoValue));
}

/**
 * @param {TextValue} self
 * @param {[ NumberValue ]} args
 * @param {Scope} scope 
 * @returns {TextValue}
 */
function textoRepetido(self, [ veces ], scope) {
	const vecesResult = expectParam('veces', veces, ValueKinds.NUMBER, scope);

	let times = Math.floor(vecesResult.value);
	if(times < 0 || (times * self.value.length) > 1024)
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Número positivo hasta 1024 como argumento de repeticiones de Texto');

	return makeText(self.value.repeat(times));
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
 * @returns {NumberValue}
 */
function textoÚltimaPosiciónDe(self, [ texto ], scope) {
	if(texto.kind !== ValueKinds.TEXT)
		throw scope.interpreter.TuberInterpreterError('Se esperaba un Texto válido como argumento de búsqueda de sub-texto');
	
	return makeNumber(self.value.lastIndexOf(texto.value));
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
	.set('aRepetida', textoRepetido)
	.set('aRepetido', textoRepetido)
	.set('caracterEn', textoCaracterEn)
	.set('comienzaCon', textoComienzaCon)
	.set('contiene', textoContiene)
	.set('cortar', textoCortar)
	.set('incluye', textoContiene)
	.set('normalizar', textoNormalizar)
	.set('partir', textoPartir)
	.set('posicionDe', textoPosiciónDe)
	.set('posiciónDe', textoPosiciónDe)
	.set('reemplazar', textoReemplazar)
	.set('repetida', textoRepetido)
	.set('repetido', textoRepetido)
	.set('terminaCon', textoTerminaCon)
	.set('ultimaPosicionDe', textoÚltimaPosiciónDe)
	.set('últimaPosiciónDe', textoÚltimaPosiciónDe);

module.exports = {
	textMethods,
};
