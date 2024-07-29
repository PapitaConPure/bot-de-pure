const { ValueKinds, makeNumber, makeText, makeBoolean, makeNada } = require('../../values');
const { getParamOrNada, expectParam } = require('../nativeUtils');
const { Scope } = require('../../scope');
const { rand, randRange, clamp } = require('../../../../../func');
const { rgb2hex, hsl2hex, hsv2hex } = require('../../../../../colorUtils');

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
 * @typedef {import('../../values').NativeFunction<null, TArg, TResult>} NativeFunction
 */

/**@type {NativeFunction<[ NumberValue, NumberValue ], NumberValue>}*/
function aleatorio(self, [ n, m ], scope) {
	const [ nExists, nResult ] = getParamOrNada('n', n, ValueKinds.NUMBER, scope);
	if(!nExists)
		return makeNumber(Math.random());
	
	const [ mExists, mResult ] = getParamOrNada('m', m, ValueKinds.NUMBER, scope);
	if(!mExists)
		return makeNumber(rand(nResult.value, false));

	return makeNumber(randRange(nResult.value, mResult.value, false));
}

/**@type {NativeFunction<[], TextValue>}*/
function colorAleatorio(self, [], scope) {
	const colorNumber = ((Math.random() * 0xfffffe) << 0) + 1;
	const colorString = '#' + colorNumber.toString(16).padStart(6, '0');
	return makeText(colorString);
}

/**@type {NativeFunction<[ NumberValue, NumberValue, NumberValue ], TextValue>}*/
function colorRGB(self, [ rojo, verde, azul ], scope) {
	const rojoValue =  expectParam('rojo',  rojo,  ValueKinds.NUMBER, scope).value;
	const verdeValue = expectParam('verde', verde, ValueKinds.NUMBER, scope).value;
	const azulValue =  expectParam('azul',  azul,  ValueKinds.NUMBER, scope).value;

	if(rojoValue < 0 || rojoValue > 255)
		throw scope.interpreter.TuberInterpreterError(`El canal rojo del color debe ser un valor entre 0 y 255 inclusive`);

	if(verdeValue < 0 || verdeValue > 255)
		throw scope.interpreter.TuberInterpreterError(`El canal verde del color debe ser un valor entre 0 y 255 inclusive`);

	if(azulValue < 0 || azulValue > 255)
		throw scope.interpreter.TuberInterpreterError(`El canal azul del color debe ser un valor entre 0 y 255 inclusive`);

	const colorString = rgb2hex(rojoValue, verdeValue, azulValue);
	return makeText(colorString);
}

/**@type {NativeFunction<[ NumberValue, NumberValue, NumberValue ], TextValue>}*/
function colorHSL(self, [ matiz, saturación, luminidad ], scope) {
	const matizValue      = expectParam('matiz',      matiz,      ValueKinds.NUMBER, scope).value;
	const saturaciónValue = expectParam('saturación', saturación, ValueKinds.NUMBER, scope).value;
	const luminidadValue  = expectParam('luminidad',  luminidad,  ValueKinds.NUMBER, scope).value;

	if(matizValue < 0 || matizValue >= 360)
		throw scope.interpreter.TuberInterpreterError(`La matiz del color debe ser un valor entre 0 (inclusive) y 360 (exclusive)`);

	if(saturaciónValue < 0 || saturaciónValue > 1)
		throw scope.interpreter.TuberInterpreterError(`La saturación del color debe ser un valor entre 0 y 1 inclusive`);

	if(luminidadValue < 0 || luminidadValue > 1)
		throw scope.interpreter.TuberInterpreterError(`La luminidad del color debe ser un valor entre 0 y 1 inclusive`);

	const colorString = hsl2hex(matizValue, saturaciónValue, luminidadValue);
	return makeText(colorString);
}

/**@type {NativeFunction<[ NumberValue, NumberValue, NumberValue ], TextValue>}*/
function colorHSV(self, [ matiz, saturación, brillo ], scope) {
	const matizValue      = expectParam('matiz',      matiz,      ValueKinds.NUMBER, scope).value;
	const saturaciónValue = expectParam('saturación', saturación, ValueKinds.NUMBER, scope).value;
	const brilloValue     = expectParam('brillo',     brillo,     ValueKinds.NUMBER, scope).value;

	if(matizValue < 0 || matizValue >= 360)
		throw scope.interpreter.TuberInterpreterError(`La matiz del color debe ser un valor entre 0 (inclusive) y 360 (exclusive)`);

	if(saturaciónValue < 0 || saturaciónValue > 1)
		throw scope.interpreter.TuberInterpreterError(`La saturación del color debe ser un valor entre 0 y 1 inclusive`);

	if(brilloValue < 0 || brilloValue > 1)
		throw scope.interpreter.TuberInterpreterError(`El brillo del color debe ser un valor entre 0 y 1 inclusive`);

	const colorString = hsl2hex(matizValue, saturaciónValue, brilloValue);
	return makeText(colorString);
}

/**@type {NativeFunction<[ NumberValue ], NumberValue | NadaValue>}*/
function cos(self, [ valor ], scope) {
	const valorValue = expectParam('valor',  valor,  ValueKinds.NUMBER, scope).value;
	
	const cos = Math.cos(valorValue);
	return makeNumber(cos);
}

/**@type {NativeFunction<[ NumberValue, NumberValue ], NumberValue>}*/
function dado(self, [ n, m ], scope) {
	const [ nExists, nResult ] = getParamOrNada('n', n, ValueKinds.NUMBER, scope);
	if(!nExists)
		return makeNumber(rand(6, true) + 1);
		
	const [ mExists, mResult ] = getParamOrNada('m', m, ValueKinds.NUMBER, scope);
	if(!mExists)
		return makeNumber(rand(nResult.value, true));

	return makeNumber(randRange(nResult.value, mResult.value, true));
}

/**@type {NativeFunction<Array<RuntimeValue>, RuntimeValue>}*/
function elegir(self, valores, scope) {
	if(valores.length === 0)
		throw scope.interpreter.TuberInterpreterError(`Se esperaba un valor para el parámetro requerido \`x1\` para elegir aleatoriamente`);

	if(valores.length === 1)
		return valores[0];

	const idx = rand(valores.length, true);
	return valores[idx];
}

/**@type {NativeFunction<Array<NumberValue>, NumberValue>}*/
function maximizar(self, números, scope) {
	if(números.length === 0)
		throw scope.interpreter.TuberInterpreterError(`Se esperaba un valor para el parámetro requerido \`x1\` para obtener un máximo`);

	if(números.length === 1)
		return números[0];

	const max = Math.max(...números.map(n => n.value));
	return makeNumber(max);
}

/**@type {NativeFunction<Array<NumberValue>, NumberValue>}*/
function minimizar(self, números, scope) {
	if(números.length === 0)
		throw scope.interpreter.TuberInterpreterError(`Se esperaba un valor para el parámetro requerido \`x1\` para obtener un mínimo`);

	if(números.length === 1)
		return números[0];

	const min = Math.min(...números.map(n => n.value));
	return makeNumber(min);
}

/**@type {NativeFunction<[], BooleanValue>}*/
function quedanEntradas(self, [], scope) {
	const test = scope.interpreter.hasArgs;
	return makeBoolean(test);
}

/**@type {NativeFunction<[ NumberValue ], NumberValue>}*/
function radianes(self, [ grados ], scope) {
	const gradosValue = expectParam('grados', grados, ValueKinds.NUMBER, scope).value;

	const radianes = gradosValue * Math.PI / 180;
	return makeNumber(radianes);
}

/**@type {NativeFunction<[ NumberValue, NumberValue ], NumberValue | NadaValue>}*/
function raíz(self, [ radicando, grado ], scope) {
	const radicandoValue = expectParam('radicando', radicando, ValueKinds.NUMBER, scope);
	const gradoValue     = expectParam('grado',     grado,     ValueKinds.NUMBER, scope);

	const root = radicandoValue.value ** (1 / gradoValue.value);
	
	if(isNaN(root))
		return makeNada();

	return makeNumber(root);
}

/**@type {NativeFunction<[ NumberValue ], NumberValue>}*/
function sen(self, [ valor ], scope) {
	const valorValue = expectParam('valor',  valor,  ValueKinds.NUMBER, scope).value;
	
	const sin = Math.sin(valorValue);
	return makeNumber(sin);
}

/**@type {NativeFunction<[ NumberValue ], NumberValue>}*/
function tan(self, [ valor ], scope) {
	const valorValue = expectParam('valor',  valor,  ValueKinds.NUMBER, scope).value;
	
	const tan = Math.tan(valorValue);
	return makeNumber(tan);
}

/**@type {Array<{ id: String, fn: NativeFunction }>}*/
const utilFunctions = [
	{ id: 'aleatorio', fn: aleatorio },
	{ id: 'colorAleatorio', fn: colorAleatorio },
	{ id: 'cos', fn: cos },
	{ id: 'dado', fn: dado },
	{ id: 'elegir', fn: elegir },
	{ id: 'hayEntradas', fn: quedanEntradas },
	{ id: 'hsl', fn: colorHSL },
	{ id: 'hsb', fn: colorHSV },
	{ id: 'hsv', fn: colorHSV },
	{ id: 'maximizar', fn: maximizar },
	{ id: 'minimizar', fn: minimizar },
	{ id: 'quedanEntradas', fn: quedanEntradas },
	{ id: 'radianes', fn: radianes },
	{ id: 'raiz', fn: raíz },
	{ id: 'raíz', fn: raíz },
	{ id: 'rgb', fn: colorRGB },
	{ id: 'sen', fn: sen },
	{ id: 'tan', fn: tan },
];

module.exports = {
	utilFunctions,
};
