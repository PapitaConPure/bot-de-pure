const { ValueKinds } = require('../../values');
const { fileRegex, expectParam, getParamOrNada, calculatePositionOffset, getParamOrDefault, linkRegex } = require('../nativeUtils');
const { stringHexToNumber } = require('../../../util/utils');

/**
 * @typedef {import('../../values').NumberValue} NumberValue
 * @typedef {import('../../values').TextValue} TextValue
 * @typedef {import('../../values').BooleanValue} BooleanValue
 * @typedef {import('../../values').ListValue} ListValue
 * @typedef {import('../../values').RegistryValue} RegistryValue
 * @typedef {import('../../values').NativeFunctionValue} NativeFunctionValue
 * @typedef {import('../../values').FunctionValue} FunctionValue
 * @typedef {import('../../values').EmbedValue} EmbedValue
 * @typedef {import('../../values').NadaValue} NadaValue
 * @typedef {import('../../values').RuntimeValue} RuntimeValue
 */

/**
 * @template {Array<RuntimeValue>} [TArg=Array<RuntimeValue>]
 * @template {RuntimeValue} [TResult=RuntimeValue]
 * @typedef {import('../../values').NativeFunction<EmbedValue, TArg, TResult>} EmbedMethod
 */

/**@type {EmbedMethod<[ TextValue, TextValue, BooleanValue ], EmbedValue>}*/
function marcoAgregarCampo(self, [ nombre, valor, alineado ], scope) {
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
}

/**@type {EmbedMethod<[], RegistryValue>}*/
function marcoARegistro(self, [], scope) {
    return require('../registryPrefabs').makeEmbedRegistry(self.value);
}

/**@type {EmbedMethod<[ TextValue, TextValue ], EmbedValue>}*/
function marcoAsignarAutor(self, [ nombre, imagen ], scope) {
	const nombreResult = expectParam('nombre', nombre, ValueKinds.TEXT, scope);
	const [ imagenExists, imagenResult ] = getParamOrNada('imagen', imagen, ValueKinds.TEXT, scope);

    if(nombreResult.value.length === 0)
        throw scope.interpreter.TuberInterpreterError('El nombre del autor del Marco no puede estar vacío');

    if(!imagenExists) {
        self.value.setAuthor({ name: nombreResult.value });
        return self;
    }
    
    if(!fileRegex.test(imagenResult.value))
        throw scope.interpreter.TuberInterpreterError('Se esperaba un enlace válido para el ícono del autor del Marco');

    self.value.setAuthor({
		name: nombreResult.value,
		iconUrl: imagenResult.value,
	});

    return self;
}

/**@type {EmbedMethod<[ TextValue ], EmbedValue>}*/
function marcoAsignarColor(self, [ color ], scope) {
	const colorResult = expectParam('color', color, ValueKinds.TEXT, scope);

    if(colorResult.value.length === 0)
        throw scope.interpreter.TuberInterpreterError('No puedes especificar un Texto vacío para el color del Marco');

    try {
        const targetColor = stringHexToNumber(colorResult.value);
        self.value.setColor(targetColor);
    } catch(e) {
        throw scope.interpreter.TuberInterpreterError(`Se recibió un código de color inválido: "${colorResult.value}", en asignación de color de Marco`);
    }

    return self;
}

/**@type {EmbedMethod<[ TextValue ], EmbedValue>}*/
function marcoAsignarDescripción(self, [ descripción ], scope) {
	const descripciónResult = expectParam('descripción', descripción, ValueKinds.TEXT, scope);

    if(descripciónResult.value.length === 0)
        throw scope.interpreter.TuberInterpreterError('No puedes suministrar una descripción de Marco vacía');

    self.value.setDescription(descripciónResult.value);
    return self;
}

/**@type {EmbedMethod<[ TextValue ], EmbedValue>}*/
function marcoAsignarEnlace(self, [ enlace ], scope) {
	const enlaceResult = expectParam('enlace', enlace, ValueKinds.TEXT, scope);
    
    if(!linkRegex.test(enlaceResult.value))
        throw scope.interpreter.TuberInterpreterError('Se esperaba un enlace válido para el Marco');

    self.value.setUrl(enlaceResult.value);
    return self;
}

/**@type {EmbedMethod<[ TextValue ], EmbedValue>}*/
function marcoAsignarImagen(self, [ imagen ], scope) {
	const imagenResult = expectParam('imagen', imagen, ValueKinds.TEXT, scope);

    if(!fileRegex.test(imagenResult.value))
        throw scope.interpreter.TuberInterpreterError('Se esperaba un enlace válido para la imagen del Marco');

    self.value.setImage(imagenResult.value);
    return self;
}

/**@type {EmbedMethod<[ TextValue ], EmbedValue>}*/
function marcoAsignarMiniatura(self, [ imagen ], scope) {
	const imagenResult = expectParam('imagen', imagen, ValueKinds.TEXT, scope);

    if(!fileRegex.test(imagenResult.value))
        throw scope.interpreter.TuberInterpreterError('Se esperaba un enlace válido para la miniatura del Marco');

    self.value.setThumbnail(imagenResult.value);
    return self;
}

/**@type {EmbedMethod<[ TextValue, TextValue ], EmbedValue>}*/
function marcoAsignarPie(self, [ pie, ícono ], scope) {
	const pieResult = expectParam('pie', pie, ValueKinds.TEXT, scope);
	const [ íconoExists, íconoResult ] = getParamOrNada('ícono', ícono, ValueKinds.TEXT, scope);
    
    if(pieResult.value.length === 0)
        throw scope.interpreter.TuberInterpreterError('El texto de pie de Marco suministrado no puede estar vacío');

    if(!íconoExists) {
        self.value.setFooter({ text: pieResult.value });
        return self;
    }
    
    if(!fileRegex.test(íconoResult.value))
        throw scope.interpreter.TuberInterpreterError('Se esperaba un enlace válido para el ícono del pie del Marco');

    self.value.setFooter({
		text: pieResult.value,
		iconUrl: íconoResult.value,
	});

    return self;
}

/**@type {EmbedMethod<[ TextValue ], EmbedValue>}*/
function marcoAsignarTítulo(self, [ título ], scope) {
	const títuloResult = expectParam('título', título, ValueKinds.TEXT, scope);

    if(títuloResult.value.length === 0)
        throw scope.interpreter.TuberInterpreterError('No puedes suministrar un título de Marco vacío');

    self.value.setTitle(títuloResult.value);
    return self;
}

/**@type {Map<String, EmbedMethod>}*/
const embedMethods = new Map();
embedMethods
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

module.exports = {
	embedMethods,
};
