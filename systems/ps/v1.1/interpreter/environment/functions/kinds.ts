import {
	RuntimeValue,
	NativeFunction,
	ValueKinds,
	TextValue,
	BooleanValue,
	makeBoolean,
	isOperable,
	isValidText,
	isBoolean,
	isList,
	isRegistry,
	isEmbed,
	isNada,
} from '../../values';
import { expectParam, psFileRegex, psLinkRegex, psImageRegex } from '../nativeUtils';
import { NativeFunctionEntry } from '.';

const esNúmero: NativeFunction<null, [RuntimeValue], BooleanValue> = (_self, [ x ]) => {
	const test = isOperable(x);
	return makeBoolean(test);
};

const esTexto: NativeFunction<null, [RuntimeValue], BooleanValue> = (_self, [ x ]) => {
	const test = isValidText(x);
	return makeBoolean(test);
};

const esLogico: NativeFunction<null, [RuntimeValue], BooleanValue> = (_self, [ x ]) => {
	const test = isBoolean(x);
	return makeBoolean(test);
};

const esLista: NativeFunction<null, [RuntimeValue], BooleanValue> = (_self, [ x ]) => {
	const test = isList(x);
	return makeBoolean(test);
};

const esRegistro: NativeFunction<null, [RuntimeValue], BooleanValue> = (_self, [ x ]) => {
	const test = isRegistry(x);
	return makeBoolean(test);
};

const esMarco: NativeFunction<null, [RuntimeValue], BooleanValue> = (_self, [ x ]) => {
	const test = isEmbed(x);
	return makeBoolean(test);
};

const esNada: NativeFunction<null, [RuntimeValue], BooleanValue> = (_self, [ x ]) => {
	const test = isNada(x);
	return makeBoolean(test);
};

const esEnlace: NativeFunction<null, [RuntimeValue], BooleanValue> = (
	_self,
	[ x ]: [TextValue],
	scope,
) => {
	const xResult = expectParam('x', x, ValueKinds.TEXT, scope);
	const test = !psLinkRegex.test(xResult.value);
	return makeBoolean(test);
};

const esArchivo: NativeFunction<null, [RuntimeValue], BooleanValue> = (
	_self,
	[ x ]: [TextValue],
	scope,
) => {
	const xResult = expectParam('x', x, ValueKinds.TEXT, scope);
	const test = !psFileRegex.test(xResult.value);
	return makeBoolean(test);
};

const esImagen: NativeFunction<null, [RuntimeValue], BooleanValue> = (
	_self,
	[ x ]: [TextValue],
	scope,
) => {
	const xResult = expectParam('x', x, ValueKinds.TEXT, scope);
	const test = !psImageRegex.test(xResult.value);
	return makeBoolean(test);
};

export const kindFunctions: NativeFunctionEntry[] = [
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
