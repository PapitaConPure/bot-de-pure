const { EmbedBuilder } = require('discord.js');

/**Contiene tipos de valores*/
const ValueKinds = /**@type {const}*/({
	NUMBER: 'Number',
	TEXT: 'Text',
	BOOLEAN: 'Boolean',
	LIST: 'List',
	REGISTRY: 'Registry',
	EMBED: 'Embed',
	NATIVE_FN: 'NativeFunction',
	FUNCTION: 'Function',
	NADA: 'Nada',
});
/**@typedef {import("types").ValuesOf<typeof ValueKinds>} ValueKind*/

/**
 * @template {ValueKind} [T=ValueKind]
 * @typedef {Object} BaseValueData
 * @property {T} kind
 * @property {(o: RuntimeValue) => NumberValue} compareTo
 * @property {(o: RuntimeValue) => BooleanValue} equals
 */

/**
 * @template {*} [U=undefined]
 * @typedef {Object} BasePrimitiveValueData
 * @property {U} value
 */

/**
 * @template {ValueKind} [T=ValueKind]
 * @template {*} [U=undefined]
 * @typedef {BaseValueData<T> & BasePrimitiveValueData<U>} PrimitiveValueData
 */

/**
 * @typedef {PrimitiveValueData<'Number', Number>} NumberValue
 * @typedef {PrimitiveValueData<'Text', String>} TextValue
 * @typedef {PrimitiveValueData<'Boolean', Boolean>} BooleanValue
 * @typedef {PrimitiveValueData<'Nada', null>} NadaValue
 */

/**
 * @typedef {Object} ListValueData
 * @property {Array<RuntimeValue>} elements
 * @typedef {BaseValueData<'List'> & ListValueData} ListValue
 */

/**
 * @typedef {Object} RegistryValueData
 * @property {Map<String, RuntimeValue>} entries
 * @typedef {BaseValueData<'Registry'> & RegistryValueData} RegistryValue
 */

/**
 * @typedef {PrimitiveValueData<'Embed', EmbedBuilder>} EmbedValue
 */

/**
 * @template {RuntimeValue} [T=RuntimeValue]
 * @typedef {(self: T, args: Array<RuntimeValue>, scope: import('./scope').Scope) => RuntimeValue} NativeMethod
 */

/**
 * @template {RuntimeValue} [TSelf=RuntimeValue]
 * @template {Array<RuntimeValue>} [TArg=Array<RuntimeValue>]
 * @template {RuntimeValue} [TReturn=RuntimeValue]
 * @typedef {(self: TSelf, args: TArg, scope: import('./scope').Scope) => TReturn} NativeFunction
 */

/**
 * @typedef {Object} NativeFunctionValueData
 * @property {RuntimeValue?} self
 * @property {NativeFunction} call
 * @property {(self: RuntimeValue) => NativeFunctionValue} with
 * @typedef {BaseValueData<'NativeFunction'> & NativeFunctionValueData} NativeFunctionValue
 */

/**
 * @typedef {Object} BaseFunctionValueData
 * @property {Array<import('../ast/expressions').ArgumentExpression>} args
 * 
 * @typedef {Object} StandardFunctionValueData
 * @property {false} lambda
 * @property {import('../ast/statements').BlockStatement} body
 * @property {import('./scope').Scope} scope
 * 
 * @typedef {Object} DelegateValueData
 * @property {true} lambda
 * @property {import('../ast/expressions').Expression} expression
 * 
 * @typedef {BaseFunctionValueData & (StandardFunctionValueData | DelegateValueData)} FunctionValueData
 * @typedef {BaseValueData<'Function'> & FunctionValueData} FunctionValue
 */

/**
 * @typedef {NumberValue
 *          |TextValue
 *          |BooleanValue
 *          |NadaValue
 * } PrimitiveValue
 * 
 * @typedef {ListValue
 *          |RegistryValue
 *          |EmbedValue
 *          |NativeFunctionValue
 *          |FunctionValue
 * } ComplexValue
 * 
 * @typedef {PrimitiveValue | ComplexValue} RuntimeValue
 */

/**
 * 
 * @template {ValueKind} T
 * @param {T} dataKind 
 * @returns {Extract<RuntimeValue, { kind: T }>}
 */
function defaultValueOf(dataKind) {
	switch(dataKind) {
	case ValueKinds.NUMBER:
		return /**@type {Extract<RuntimeValue, { kind: T }>}*/(makeNumber(0));
	case ValueKinds.TEXT:
		return /**@type {Extract<RuntimeValue, { kind: T }>}*/(makeText(''));
	case ValueKinds.BOOLEAN:
		return /**@type {Extract<RuntimeValue, { kind: T }>}*/(makeBoolean(false));
	case ValueKinds.EMBED:
		return /**@type {Extract<RuntimeValue, { kind: T }>}*/(makeEmbed());
	case ValueKinds.LIST:
		return /**@type {Extract<RuntimeValue, { kind: T }>}*/(makeList([]));
	case ValueKinds.REGISTRY:
		return /**@type {Extract<RuntimeValue, { kind: T }>}*/(makeRegistry(new Map()));
	case ValueKinds.NADA:
		return /**@type {Extract<RuntimeValue, { kind: T }>}*/(makeNada());
	default:
		throw 'Tipo de dato inválido al intentar crear valor por defecto';
	}
}

/**
 * Comprueba si un RuntimeValue existe, es de tipo Número y es numéricamente operable
 * @param {RuntimeValue} value 
 * @returns {value is NumberValue}
 */
function isOperable(value) {
	return value != null
	    && value.kind === ValueKinds.NUMBER
	    && !isNaN(value.value)
		&& isFinite(value.value);
}

/**
 * Comprueba si un valor existe y es numéricamente operable
 * @param {*} value 
 * @returns {value is Number}
 */
function isInternalOperable(value) {
	return value != null
	    && !isNaN(value)
		&& isFinite(value);
}

/**
 * Comprueba si un RuntimeValue es de tipo Texto
 * @param {RuntimeValue} value 
 * @returns {value is TextValue}
 */
function isValidText(value) {
	return value?.kind === ValueKinds.TEXT;
}

/**
 * Comprueba si un RuntimeValue es de tipo Dupla
 * @param {RuntimeValue} value 
 * @returns {value is BooleanValue}
 */
function isBoolean(value) {
	return value?.kind === ValueKinds.BOOLEAN;
}

/**
 * Comprueba si un RuntimeValue es de tipo Lista
 * @param {RuntimeValue} value 
 * @returns {value is ListValue}
 */
function isList(value) {
	return value?.kind === ValueKinds.LIST;
}

/**
 * Comprueba si un RuntimeValue es de tipo Registro
 * @param {RuntimeValue} value 
 * @returns {value is RegistryValue}
 */
function isRegistry(value) {
	return value?.kind === ValueKinds.REGISTRY;
}

/**
 * Comprueba si un RuntimeValue es de tipo Marco
 * @param {RuntimeValue} value 
 * @returns {value is EmbedValue}
 */
function isEmbed(value) {
	return value?.kind === ValueKinds.EMBED;
}

/**
 * Comprueba si un RuntimeValue no existe o es de tipo Nada
 * @param {RuntimeValue} value 
 * @returns {value is NadaValue}
 */
function isNada(value) {
	return value?.kind === ValueKinds.NADA;
}

/**
 * @param {ListValue} list
 * @param {RuntimeValue} item
 * @param {Number?} [position=null]
 */
function extendList(list, item, position = null) {
	list.elements.splice(position ?? list.elements.length, 0, item);
}

/**@param {NumberValue|TextValue|BooleanValue} other*/
function basicCompareTo(other) {
	if(this.kind !== other.kind)
		return makeNumber(-1);
	
	if(this.value === other.value)
		return makeNumber(0);

	return makeNumber(this.value < other.value ? -1 : 1);
}

/**@param {NumberValue|TextValue|BooleanValue} other*/
function invalidCompareTo(other) {
	return makeNumber(-1);
}

/**@param {NumberValue|TextValue|BooleanValue|EmbedValue|NadaValue} other*/
function basicEquals(other) {
	return makeBoolean(this.kind === other.kind && this.value === other.value);
}

/**@param {ListValue} other*/
function listEquals(other) {
	return makeBoolean(other.kind === ValueKinds.LIST && this.kind === other.kind && this.elements === other.elements);
}

/**@param {RegistryValue} other*/
function registryEquals(other) {
	return makeBoolean(other.kind === ValueKinds.REGISTRY && this.kind === other.kind && this.entries === other.entries);
}

/**@param {NativeFunctionValue} other*/
function nativeFnEquals(other) {
	return makeBoolean(other.kind === ValueKinds.NATIVE_FN && this.kind === other.kind && this.call === other.call);
}

/**@param {FunctionValue} other*/
function referenceEquals(other) {
	return makeBoolean(this === other);
}

/**
 * @type {Map<import('./values').ValueKind, String>}
 */
const ValueKindTranslationLookups = new Map();
ValueKindTranslationLookups
	.set(ValueKinds.NUMBER, 'Número')
	.set(ValueKinds.TEXT, 'Texto')
	.set(ValueKinds.BOOLEAN, 'Dupla')
	.set(ValueKinds.LIST, 'List')
	.set(ValueKinds.REGISTRY, 'Registro')
	.set(ValueKinds.EMBED, 'Marco')
	.set(ValueKinds.FUNCTION, 'Función')
	.set(ValueKinds.NADA, 'Nada');

/**@type {Map<ValueKind, RuntimeValue['compareTo']>}*/
const CompareToMethodLookups = new Map();
CompareToMethodLookups
	.set(ValueKinds.NUMBER,    basicCompareTo)
	.set(ValueKinds.TEXT,      basicCompareTo)
	.set(ValueKinds.BOOLEAN,   basicCompareTo)
	.set(ValueKinds.LIST,      invalidCompareTo)
	.set(ValueKinds.REGISTRY,  invalidCompareTo)
	.set(ValueKinds.EMBED,     invalidCompareTo)
	.set(ValueKinds.NATIVE_FN, invalidCompareTo)
	.set(ValueKinds.FUNCTION,  invalidCompareTo)
	.set(ValueKinds.NADA,      invalidCompareTo);

/**@type {Map<ValueKind, RuntimeValue['equals']>}*/
const EqualsMethodLookups = new Map();
EqualsMethodLookups
	.set(ValueKinds.NUMBER,    basicEquals)
	.set(ValueKinds.TEXT,      basicEquals)
	.set(ValueKinds.BOOLEAN,   basicEquals)
	.set(ValueKinds.LIST,      listEquals)
	.set(ValueKinds.REGISTRY,  registryEquals)
	.set(ValueKinds.EMBED,     basicEquals)
	.set(ValueKinds.NATIVE_FN, nativeFnEquals)
	.set(ValueKinds.FUNCTION,  referenceEquals)
	.set(ValueKinds.NADA,      basicEquals);

/**
 * @param {Number} value
 * @returns {NumberValue}
 */
function makeNumber(value) {
	const kind = ValueKinds.NUMBER;
	return {
		kind,
		value: +value,
		equals: EqualsMethodLookups.get(kind),
		compareTo: CompareToMethodLookups.get(kind),
	};
}

/**
 * @param {String} value
 * @returns {TextValue}
 */
function makeText(value) {
	const kind = ValueKinds.TEXT;
	return {
		kind,
		value: `${value}`,
		equals: EqualsMethodLookups.get(kind),
		compareTo: CompareToMethodLookups.get(kind),
	};
}

/**
 * @param {Boolean} value
 * @returns {BooleanValue}
 */
function makeBoolean(value) {
	const kind = ValueKinds.BOOLEAN;
	return {
		kind,
		value: !!value,
		equals: EqualsMethodLookups.get(kind),
		compareTo: CompareToMethodLookups.get(kind),
	};
}

/**
 * @param {BooleanValue} value
 * @returns {BooleanValue}
 */
function toggleBoolean(value) {
	value.value = !value.value;
	return value;
}

/**
 * @param {Array<RuntimeValue>} elements
 * @returns {ListValue}
 */
function makeList(elements) {
	const kind = ValueKinds.LIST;
	return {
		kind,
		elements,
		equals: EqualsMethodLookups.get(kind),
		compareTo: CompareToMethodLookups.get(kind),
	};
}

/**
 * @param {Map<String, RuntimeValue>} entries
 * @returns {RegistryValue}
 */
function makeRegistry(entries) {
	const kind = ValueKinds.REGISTRY;
	return {
		kind,
		entries,
		equals: EqualsMethodLookups.get(kind),
		compareTo: CompareToMethodLookups.get(kind),
	};
}

/**
 * @returns {EmbedValue}
 */
function makeEmbed() {
	const kind = ValueKinds.EMBED;
	return {
		kind,
		value: new EmbedBuilder(),
		equals: EqualsMethodLookups.get(kind),
		compareTo: CompareToMethodLookups.get(kind),
	};
}

/**
 * @param {RuntimeValue} self
 * @param {NativeFunction} fn
 * @returns {NativeFunctionValue}
 */
function makeNativeFunction(self, fn) {
	const kind = ValueKinds.NATIVE_FN;
	return {
		kind,
		self,
		call: fn,
		compareTo: CompareToMethodLookups.get(kind),
		equals: EqualsMethodLookups.get(kind),
		with: function(self) {
			return makeNativeFunction(self, this.call);
		},
	};
}

/**
 * @param {import('../ast/statements').BlockStatement} body
 * @param {Array<import('../ast/expressions').ArgumentExpression>} args
 * @param {import('./scope').Scope} scope
 * @returns {FunctionValue}
 */
function makeFunction(body, args, scope) {
	const kind = ValueKinds.FUNCTION;
	return {
		kind,
		lambda: false,
		body,
		args,
		scope,
		compareTo: CompareToMethodLookups.get(kind),
		equals: EqualsMethodLookups.get(kind),
	};
}

/**
 * @param {import('../ast/expressions').Expression} expression
 * @param {Array<import('../ast/expressions').ArgumentExpression>} args
 * @returns {FunctionValue}
 */
function makeLambda(expression, args) {
	const kind = ValueKinds.FUNCTION;
	return {
		kind,
		lambda: true,
		expression,
		args,
		compareTo: CompareToMethodLookups.get(kind),
		equals: EqualsMethodLookups.get(kind),
	};
}

/**@returns {NadaValue}*/
function makeNada() {
	const kind = ValueKinds.NADA;
	return {
		kind,
		value: null,
		equals: EqualsMethodLookups.get(kind),
		compareTo: CompareToMethodLookups.get(kind),
	};
}

/**@type {Map<ValueKind, Map<ValueKind, (x: *, interpreter: import('./interpreter').Interpreter) => RuntimeValue>>}*/
const coercions = new Map();
coercions
	.set(ValueKinds.NUMBER,    new Map())
	.set(ValueKinds.TEXT,      new Map())
	.set(ValueKinds.BOOLEAN,   new Map())
	.set(ValueKinds.LIST,      new Map())
	.set(ValueKinds.REGISTRY,  new Map())
	.set(ValueKinds.EMBED,     new Map())
	.set(ValueKinds.FUNCTION,  new Map())
	.set(ValueKinds.NATIVE_FN, new Map())
	.set(ValueKinds.NADA,      new Map());

coercions.get(ValueKinds.NUMBER)
	.set(ValueKinds.TEXT,     (x) => makeText(`${x ?? 'Nada'}`))
	.set(ValueKinds.BOOLEAN,  (x) => makeBoolean(x ? true : false));

coercions.get(ValueKinds.TEXT)
	.set(ValueKinds.NUMBER,   (x) => makeNumber(!isInternalOperable(+x) ? 0 : +x))
	.set(ValueKinds.BOOLEAN,  (x) => makeBoolean(x ? true : false))
	.set(ValueKinds.LIST,     (x) => makeList([ ...x ]));

coercions.get(ValueKinds.BOOLEAN)
	.set(ValueKinds.NUMBER,   (x) => makeNumber(x ? 1 : 0))
	.set(ValueKinds.TEXT,     (x) => makeText(x ? 'Verdadero' : 'Falso'));

coercions.get(ValueKinds.LIST)
	.set(ValueKinds.TEXT,     (/**@type Array<RuntimeValue>*/ x, interpreter) => {
		return makeText(`(${x?.map(y => coerceValue(interpreter, y, 'Text').value).join('')})`)
	})
	.set(ValueKinds.BOOLEAN,  (x) => makeBoolean(x?.length ? true : false))
	.set(ValueKinds.REGISTRY, (x) => {
		if(!Array.isArray(x)) return makeNada();
		const properties = new Map();
		x.forEach((element, i) => properties.set(i, element));
		return makeRegistry(properties);
	});

coercions.get(ValueKinds.REGISTRY)
	.set(ValueKinds.NUMBER,   (_) => makeNada())
	.set(ValueKinds.TEXT,     (/**@type Map<string, RuntimeValue>*/ x, interpreter) => {
		let glossaryStrings = [];
		x.forEach((value, key) => {
			const coercedValue = coerceValue(interpreter, value, 'Text').value;
			glossaryStrings.push(`${key}: ${coercedValue}`);
		});
		return makeText(`{Rg ${glossaryStrings.join(', ')}}`);
	})
	.set(ValueKinds.BOOLEAN,  (x) => makeBoolean(x?.size ? true : false));

coercions.get(ValueKinds.EMBED)
	.set(ValueKinds.TEXT,     (_) => makeText('[Marco]'))
	.set(ValueKinds.BOOLEAN,  (x) => makeBoolean(true))
	.set(ValueKinds.REGISTRY, (/**@type {EmbedBuilder}*/x) => {
		if(x == null || x.data == null)
			return makeNada();

		/**@type {Map<String, RuntimeValue>}*/
		const properties = new Map()
			.set('color', makeNumber(x.data.color));

		if(x.data.title)
			properties.set('título', makeText(x.data.title));

		if(x.data.description)
			properties.set('descripción', makeText(x.data.description));
		
		if(x.data.author)
			properties.set('autor', makeRegistry(new Map()
				.set('nombre', x.data.author.name ? makeText(x.data.author.name) : makeNada())
				.set('ícono', x.data.author.name ? makeText(x.data.author.icon_url) : makeNada())
			));
			
		if(x.data.footer)
			properties.set('pie', makeRegistry(new Map()
				.set('texto', x.data.author.name ? makeText(x.data.footer.text) : makeNada())
				.set('ícono', x.data.author.name ? makeText(x.data.footer.icon_url) : makeNada())
			));
		
		if(x.data.timestamp)
			properties.set('tiempo', makeText(x.data.timestamp));

		if(x.data.image?.url)
			properties.set('imagen', makeText(x.data.image.url));
		
		if(x.data.video?.url)
			properties.set('video', makeText(x.data.video.url));
		
		if(x.data.thumbnail?.url)
			properties.set('miniatura', makeText(x.data.thumbnail.url));
		
		if(x.data.url)
			properties.set('enlace', makeText(x.data.url));
		
		return makeRegistry(properties);
	});

coercions.get(ValueKinds.FUNCTION)
	.set(ValueKinds.TEXT,     (_) => makeText('[Función]'))
	.set(ValueKinds.BOOLEAN,  (_) => makeBoolean(true));

coercions.get(ValueKinds.NATIVE_FN)
	.set(ValueKinds.TEXT,     (_) => makeText('[Función nativa]'))
	.set(ValueKinds.BOOLEAN,  (_) => makeBoolean(true));

coercions.get(ValueKinds.NADA)
	.set(ValueKinds.TEXT,     (_) => makeText('Nada'))
	.set(ValueKinds.BOOLEAN,  (_) => makeBoolean(false));

/**
 * @template {ValueKind} T
 * @param {import('./interpreter').Interpreter} interpreter
 * @param {RuntimeValue} value
 * @param {T} as
 * @returns {Extract<RuntimeValue, { kind: T }>}
 */
function coerceValue(interpreter, value, as) {
	if(value == null || !value.kind)
		throw interpreter.TuberInterpreterError('Valor de origen corrupto al intentar convertirlo a otro tipo');

	if(value.kind === as)
		return /**@type {Extract<RuntimeValue, { kind: T }>}*/(value);

	const coercionOrigin = coercions.get(value.kind);
	if(coercionOrigin == null)
		throw interpreter.TuberInterpreterError('Tipo de origen inválido al intentar convertir un valor a otro tipo');

	const coercionFn = /**@type {(x: *, interpreter: import('./interpreter').Interpreter) => Extract<RuntimeValue, { kind: T }>}*/(coercionOrigin.get(as));
	if(coercionFn == null)
		throw interpreter.TuberInterpreterError(`No se puede convertir un valor de tipo ${ValueKindTranslationLookups.get(value.kind)} a ${ValueKindTranslationLookups.get(as) ?? 'Desconocido'}`);

	switch(value.kind) {
	case ValueKinds.LIST:
		return coercionFn(value.elements, interpreter);
	case ValueKinds.REGISTRY:
		return coercionFn(value.entries, interpreter);
	case ValueKinds.NATIVE_FN:
	case ValueKinds.FUNCTION:
		return coercionFn(null, interpreter);
	default:
		return coercionFn(value.value, interpreter);
	}
}

module.exports = {
	ValueKinds,
	ValueKindTranslationLookups,
	defaultValueOf,
	isOperable,
	isInternalOperable,
	isValidText,
	isBoolean,
	isList,
	isRegistry,
	isEmbed,
	isNada,
	extendList,
	makeNumber,
	makeText,
	makeBoolean,
	toggleBoolean,
	makeList,
	makeRegistry,
	makeEmbed,
	makeNativeFunction,
	makeFunction,
	makeLambda,
	makeNada,
	coerceValue,
};