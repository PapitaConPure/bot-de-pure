const { ValueKinds, makeNumber, makeText, makeBoolean, makeList, makeRegistry, makeNada, isNada, isOperable, isInternalOperable, coerceValue, isValidText } = require('../../values');
const { fileRegex, expectParam, getParamOrNada, calculatePositionOffset, getParamOrDefault } = require('../nativeUtils');
const { stringHexToNumber } = require('../../../../../func');
const { Scope } = require('../../scope');
const { EmbedBuilder, GuildPremiumTier } = require('discord.js');

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
 * @param {EmbedValue} self
 * @param {[ TextValue, TextValue, BooleanValue ]} args 
 * @param {Scope} scope
 * @returns {EmbedValue}
 */
function marcoAgregarCampo(self, [ nombre, valor, alineado ], scope) {
	const nombreResult = expectParam('nombre', nombre, ValueKinds.TEXT, scope);
	const valorResult = expectParam('valor', valor, ValueKinds.TEXT, scope);
	const alineadoResult = getParamOrDefault('alineado', alineado, ValueKinds.BOOLEAN, scope, false);

    self.value.addFields({
		name: nombreResult.value,
		value: valorResult.value,
		inline: alineadoResult.value,
	});

    return self;
}

/**
 * @param {EmbedValue} self
 * @param {[ TextValue, TextValue ]} args 
 * @param {Scope} scope
 */
function marcoAsignarAutor(self, [ nombre, imagen ], scope) {
	const nombreResult = expectParam('nombre', nombre, ValueKinds.TEXT, scope);
	const [ imagenExists, imagenResult ] = getParamOrNada('imagen', imagen, ValueKinds.TEXT, scope);

    if(!imagenExists) {
        self.value.setAuthor({ name: nombreResult.value });
        return self;
    }
    
    if(!fileRegex.test(imagenResult.value))
        throw scope.interpreter.TuberInterpreterError('Se esperaba un enlace válido para el ícono del autor del Marco');

    self.value.setAuthor({
		name: nombreResult.value,
		iconURL: imagenResult.value,
	});

    return self;
}

/**
 * @param {EmbedValue} self
 * @param {[ TextValue ]} args 
 * @param {Scope} scope
 */
function marcoAsignarColor(self, [ color ], scope) {
	const colorResult = expectParam('color', color, ValueKinds.TEXT, scope);

    try {
        const targetColor = stringHexToNumber(colorResult.value);
        self.value.setColor(targetColor);
    } catch(e) {
        throw scope.interpreter.TuberInterpreterError(`Se recibió un código de color inválido: "${colorResult.value}", en asignación de color de Marco`);
    }

    return self;
}

/**
 * @param {EmbedValue} self
 * @param {[ TextValue ]} args
 * @param {Scope} scope
 */
function marcoAsignarDescripción(self, [ descripción ], scope) {
	const descripciónResult = expectParam('descripción', descripción, ValueKinds.TEXT, scope);

    self.value.setDescription(descripciónResult.value);

    return self;
}

/**
 * @param {EmbedValue} self
 * @param {[ TextValue ]} args 
 * @param {Scope} scope
 */
function marcoAsignarImagen(self, [ imagen ], scope) {
	const imagenResult = expectParam('imagen', imagen, ValueKinds.TEXT, scope);

    if(!fileRegex.test(imagenResult.value))
        throw scope.interpreter.TuberInterpreterError('Se esperaba un enlace válido para la imagen del Marco');

    self.value.setImage(imagenResult.value);

    return self;
}

/**
 * @param {EmbedValue} self
 * @param {[ TextValue ]} args 
 * @param {Scope} scope
 */
function marcoAsignarMiniatura(self, [ imagen ], scope) {
	const imagenResult = expectParam('imagen', imagen, ValueKinds.TEXT, scope);

    if(!fileRegex.test(imagenResult.value))
        throw scope.interpreter.TuberInterpreterError('Se esperaba un enlace válido para la miniatura del Marco');

    self.value.setThumbnail(imagenResult.value);

    return self;
}

/**
 * @param {EmbedValue} self
 * @param {[ TextValue, TextValue ]} args 
 * @param {Scope} scope
 */
function marcoAsignarPie(self, [ pie, imagen ], scope) {
	const pieResult = expectParam('pie', pie, ValueKinds.TEXT, scope);
	const [ imagenExists, imagenResult ] = getParamOrNada('imagen', imagen, ValueKinds.TEXT, scope);

    if(!imagenExists) {
        self.value.setFooter({ text: pieResult.value });
        return self;
    }
    
    if(!fileRegex.test(imagenResult.value))
        throw scope.interpreter.TuberInterpreterError('Se esperaba un enlace válido para el ícono del pie del Marco');

    self.value.setFooter({
		text: pieResult.value,
		iconURL: imagenResult.value,
	});

    return self;
}

/**
 * @param {EmbedValue} self
 * @param {[ TextValue ]} args 
 * @param {Scope} scope
 */
function marcoAsignarTítulo(self, [ título ], scope) {
	const títuloResult = expectParam('título', título, ValueKinds.TEXT, scope);

    self.value.setTitle(títuloResult.value);

    return self;
}

/**@type Map<String, import('../../values').NativeFunction<EmbedValue>>*/
const embedMethods = new Map();
embedMethods
	.set('agregar', marcoAgregarCampo)
	.set('agregarCampo', marcoAgregarCampo)
	.set('añadir', marcoAgregarCampo)
	.set('añadirCampo', marcoAgregarCampo)
	.set('asignarAutor', marcoAsignarAutor)
	.set('asignarColor', marcoAsignarColor)
	.set('asignarDescripcion', marcoAsignarDescripción)
	.set('asignarDescripción', marcoAsignarDescripción)
	.set('asignarImagen', marcoAsignarImagen)
	.set('asignarMiniatura', marcoAsignarMiniatura)
	.set('asignarPie', marcoAsignarPie)
	.set('asignarTitulo', marcoAsignarTítulo)
	.set('asignarTítulo', marcoAsignarTítulo);

module.exports = {
	embedMethods,
};
