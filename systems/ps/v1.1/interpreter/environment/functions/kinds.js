const { ValueKinds, makeBoolean, isOperable, isValidText, isBoolean, isList, isRegistry, isEmbed, isNada } = require('../../values');
const { expectParam, fileRegex, linkRegex, imageRegex } = require('../nativeUtils');

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
 * @returns {BooleanValue}
 */
function esNúmero(self, [ x ]) {
	const test = isOperable(x);
	return makeBoolean(test);
}

/**
 * 
 * @param {null} self
 * @param {[ RuntimeValue ]} args 
 * @returns {BooleanValue}
 */
function esTexto(self, [ x ]) {
	const test = isValidText(x);
	return makeBoolean(test);
}

/**
 * 
 * @param {null} self
 * @param {[ RuntimeValue ]} args 
 * @returns {BooleanValue}
 */
function esLogico(self, [ x ]) {
	const test = isBoolean(x);
	return makeBoolean(test);
}

/**
 * 
 * @param {null} self
 * @param {[ RuntimeValue ]} args 
 * @returns {BooleanValue}
 */
function esLista(self, [ x ]) {
	const test = isList(x);
	return makeBoolean(test);
}

/**
 * 
 * @param {null} self
 * @param {[ RuntimeValue ]} args 
 * @returns {BooleanValue}
 */
function esRegistro(self, [ x ]) {
	const test = isRegistry(x);
	return makeBoolean(test);
}

/**
 * 
 * @param {null} self
 * @param {[ RuntimeValue ]} args 
 * @returns {BooleanValue}
 */
function esMarco(self, [ x ]) {
	const test = isEmbed(x);
	return makeBoolean(test);
}

/**
 * 
 * @param {null} self
 * @param {[ RuntimeValue ]} args 
 * @returns {BooleanValue}
 */
function esNada(self, [ x ]) {
	const test = isNada(x);
	return makeBoolean(test);
}

/**
 * 
 * @param {null} self
 * @param {[ TextValue ]} args 
 * @param {import('../../scope').Scope} scope 
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
 * @param {import('../../scope').Scope} scope 
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
 * @param {import('../../scope').Scope} scope 
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
