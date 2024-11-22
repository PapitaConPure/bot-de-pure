const { ValueKinds, makeBoolean, isOperable, isValidText, isBoolean, isList, isRegistry, isEmbed, isNada } = require('../../values');
const { expectParam, fileRegex, linkRegex, imageRegex } = require('../nativeUtils');
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
 * @param {null} self
 * @param {[ RuntimeValue ]} args 
 * @param {Scope} scope 
 * @returns {BooleanValue}
 */
function esNúmero(self, [ x ], scope) {
	const test = isOperable(x);
	return makeBoolean(test);
}

/**
 * 
 * @param {null} self
 * @param {[ RuntimeValue ]} args 
 * @param {Scope} scope 
 * @returns {BooleanValue}
 */
function esTexto(self, [ x ], scope) {
	const test = isValidText(x);
	return makeBoolean(test);
}

/**
 * 
 * @param {null} self
 * @param {[ RuntimeValue ]} args 
 * @param {Scope} scope 
 * @returns {BooleanValue}
 */
function esLogico(self, [ x ], scope) {
	const test = isBoolean(x);
	return makeBoolean(test);
}

/**
 * 
 * @param {null} self
 * @param {[ RuntimeValue ]} args 
 * @param {Scope} scope 
 * @returns {BooleanValue}
 */
function esLista(self, [ x ], scope) {
	const test = isList(x);
	return makeBoolean(test);
}

/**
 * 
 * @param {null} self
 * @param {[ RuntimeValue ]} args 
 * @param {Scope} scope 
 * @returns {BooleanValue}
 */
function esRegistro(self, [ x ], scope) {
	const test = isRegistry(x);
	return makeBoolean(test);
}

/**
 * 
 * @param {null} self
 * @param {[ RuntimeValue ]} args 
 * @param {Scope} scope 
 * @returns {BooleanValue}
 */
function esMarco(self, [ x ], scope) {
	const test = isEmbed(x);
	return makeBoolean(test);
}

/**
 * 
 * @param {null} self
 * @param {[ RuntimeValue ]} args 
 * @param {Scope} scope 
 * @returns {BooleanValue}
 */
function esNada(self, [ x ], scope) {
	const test = isNada(x);
	return makeBoolean(test);
}

/**
 * 
 * @param {null} self
 * @param {[ TextValue ]} args 
 * @param {Scope} scope 
 * @returns {BooleanValue}
 */
function esEnlace(self, [ x ], scope) {
	const xResult = expectParam('x', x, ValueKinds.TEXT, scope);
	const test = !linkRegex.test(xResult.value);
	return makeBoolean(test);
}

/**
 * 
 * @param {null} self
 * @param {[ TextValue ]} args 
 * @param {Scope} scope 
 * @returns {BooleanValue}
 */
function esArchivo(self, [ x ], scope) {
	const xResult = expectParam('x', x, ValueKinds.TEXT, scope);
	const test = !fileRegex.test(xResult.value);
	return makeBoolean(test);
}

/**
 * 
 * @param {null} self
 * @param {[ TextValue ]} args 
 * @param {Scope} scope 
 * @returns {BooleanValue}
 */
function esImagen(self, [ x ], scope) {
	const xResult = expectParam('x', x, ValueKinds.TEXT, scope);
	const test = !imageRegex.test(xResult.value);
	return makeBoolean(test);
}


/**@type {Array<{ id: String, fn: import('../../values').NativeFunction }>}*/
const kindFunctions = [
	{ id: 'esNumero', fn: esNúmero },
	{ id: 'esNúmero', fn: esNúmero },
	{ id: 'esTexto', fn: esTexto },
	{ id: 'esLogico', fn: esLogico },
	{ id: 'esLista', fn: esLista },
	{ id: 'esRegistro', fn: esRegistro },
	{ id: 'esMarco', fn: esMarco },
	{ id: 'esNada', fn: esNada },
	{ id: 'esEnlace', fn: esEnlace },
	{ id: 'esArchivo', fn: esArchivo },
	{ id: 'esImagen', fn: esImagen },
];

module.exports = {
	kindFunctions,
};
