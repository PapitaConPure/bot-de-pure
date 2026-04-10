/* eslint-disable no-empty-pattern */

import { RuntimeValue, NativeFunction, ValueKinds, TextValue, BooleanValue, RegistryValue, EmbedValue } from '../../values';
import { psFileRegex, expectParam, getParamOrNada, getParamOrDefault, psLinkRegex } from '../nativeUtils';
import { stringHexToNumber } from '../../../util/utils';

export type EmbedMethod<TArg extends RuntimeValue[] = RuntimeValue[], TResult extends RuntimeValue = RuntimeValue>
	= NativeFunction<EmbedValue, TArg, TResult>;

const marcoAgregarCampo: EmbedMethod<[ TextValue, TextValue, BooleanValue ], EmbedValue> = (self, [ nombre, valor, alineado ], scope) => {
	const nombreResult = expectParam('nombre', nombre, ValueKinds.TEXT, scope);
	const valorResult = expectParam('valor', valor, ValueKinds.TEXT, scope);
	const alineadoResult = getParamOrDefault('alineado', alineado, ValueKinds.BOOLEAN, scope, false);

	if(nombreResult.value.length === 0)
		throw scope.interpreter.TuberInterpreterError('El nombre del campo de Marco no puede estar vacío');

	if(valorResult.value.length === 0)
		throw scope.interpreter.TuberInterpreterError('El valor del campo de Marco no puede estar vacío');

	self.value.addFields({
		name: nombreResult.value,
		value: valorResult.value,
		inline: alineadoResult.value,
	});

	return self;
};

const marcoARegistro: EmbedMethod<[], RegistryValue> = (self, []) => {
	return require('../registryPrefabs').makeEmbedRegistry(self.value);
};

const marcoAsignarAutor: EmbedMethod<[ TextValue, TextValue ], EmbedValue> = (self, [ nombre, imagen ], scope) => {
	const nombreResult = expectParam('nombre', nombre, ValueKinds.TEXT, scope);
	const [ imagenExists, imagenResult ] = getParamOrNada('imagen', imagen, ValueKinds.TEXT, scope);

	if(nombreResult.value.length === 0)
		throw scope.interpreter.TuberInterpreterError('El nombre del autor del Marco no puede estar vacío');

	if(!imagenExists) {
		self.value.setAuthor({ name: nombreResult.value });
		return self;
	}

	if(!psFileRegex.test(imagenResult.value))
		throw scope.interpreter.TuberInterpreterError('Se esperaba un enlace válido para el ícono del autor del Marco');

	self.value.setAuthor({
		name: nombreResult.value,
		iconUrl: imagenResult.value,
	});

	return self;
};

const marcoAsignarColor: EmbedMethod<[ TextValue ], EmbedValue> = (self, [ color ], scope) => {
	const colorResult = expectParam('color', color, ValueKinds.TEXT, scope);

	if(colorResult.value.length === 0)
		throw scope.interpreter.TuberInterpreterError('No puedes especificar un Texto vacío para el color del Marco');

	try {
		const targetColor = stringHexToNumber(colorResult.value);
		self.value.setColor(targetColor);
	} catch {
		throw scope.interpreter.TuberInterpreterError(`Se recibió un código de color inválido: "${colorResult.value}", en asignación de color de Marco`);
	}

	return self;
};

const marcoAsignarDescripción: EmbedMethod<[ TextValue ], EmbedValue> = (self, [ descripción ], scope) => {
	const descripciónResult = expectParam('descripción', descripción, ValueKinds.TEXT, scope);

	if(descripciónResult.value.length === 0)
		throw scope.interpreter.TuberInterpreterError('No puedes suministrar una descripción de Marco vacía');

	self.value.setDescription(descripciónResult.value);
	return self;
};

const marcoAsignarEnlace: EmbedMethod<[ TextValue ], EmbedValue> = (self, [ enlace ], scope) => {
	const enlaceResult = expectParam('enlace', enlace, ValueKinds.TEXT, scope);

	if(!psLinkRegex.test(enlaceResult.value))
		throw scope.interpreter.TuberInterpreterError('Se esperaba un enlace válido para el Marco');

	self.value.setUrl(enlaceResult.value);
	return self;
};

const marcoAsignarImagen: EmbedMethod<[ TextValue ], EmbedValue> = (self, [ imagen ], scope) => {
	const imagenResult = expectParam('imagen', imagen, ValueKinds.TEXT, scope);

	if(!psFileRegex.test(imagenResult.value))
		throw scope.interpreter.TuberInterpreterError('Se esperaba un enlace válido para la imagen del Marco');

	self.value.setImage(imagenResult.value);
	return self;
};

const marcoAsignarMiniatura: EmbedMethod<[ TextValue ], EmbedValue> = (self, [ imagen ], scope) => {
	const imagenResult = expectParam('imagen', imagen, ValueKinds.TEXT, scope);

	if(!psFileRegex.test(imagenResult.value))
		throw scope.interpreter.TuberInterpreterError('Se esperaba un enlace válido para la miniatura del Marco');

	self.value.setThumbnail(imagenResult.value);
	return self;
};

const marcoAsignarPie: EmbedMethod<[ TextValue, TextValue ], EmbedValue> = (self, [ pie, ícono ], scope) => {
	const pieResult = expectParam('pie', pie, ValueKinds.TEXT, scope);
	const [ íconoExists, íconoResult ] = getParamOrNada('ícono', ícono, ValueKinds.TEXT, scope);

	if(pieResult.value.length === 0)
		throw scope.interpreter.TuberInterpreterError('El texto de pie de Marco suministrado no puede estar vacío');

	if(!íconoExists) {
		self.value.setFooter({ text: pieResult.value });
		return self;
	}

	if(!psFileRegex.test(íconoResult.value))
		throw scope.interpreter.TuberInterpreterError('Se esperaba un enlace válido para el ícono del pie del Marco');

	self.value.setFooter({
		text: pieResult.value,
		iconUrl: íconoResult.value,
	});

	return self;
};

const marcoAsignarTítulo: EmbedMethod<[ TextValue ], EmbedValue> = (self, [ título ], scope) => {
	const títuloResult = expectParam('título', título, ValueKinds.TEXT, scope);

	if(títuloResult.value.length === 0)
		throw scope.interpreter.TuberInterpreterError('No puedes suministrar un título de Marco vacío');

	self.value.setTitle(títuloResult.value);
	return self;
};

export const embedMethods = new Map<string, EmbedMethod>()
	.set('agregar', marcoAgregarCampo)
	.set('agregarCampo', marcoAgregarCampo)
	.set('añadir', marcoAgregarCampo)
	.set('añadirCampo', marcoAgregarCampo)
	.set('aRegistro', marcoARegistro)
	.set('asignarAutor', marcoAsignarAutor)
	.set('asignarColor', marcoAsignarColor)
	.set('asignarDescripcion', marcoAsignarDescripción)
	.set('asignarDescripción', marcoAsignarDescripción)
	.set('asignarEnlace', marcoAsignarEnlace)
	.set('asignarImagen', marcoAsignarImagen)
	.set('asignarMiniatura', marcoAsignarMiniatura)
	.set('asignarPie', marcoAsignarPie)
	.set('asignarTitulo', marcoAsignarTítulo)
	.set('asignarTítulo', marcoAsignarTítulo);
