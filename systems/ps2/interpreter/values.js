const { EmbedBuilder } = require('discord.js');

/**Contiene tipos de valores*/
const ValueKinds = /**@type {const}*/({
	NUMBER: 'Number',
	TEXT: 'Text',
	BOOLEAN: 'Boolean',
	LIST: 'List',
	REGISTRY: 'Registry',
	EMBED: 'Embed',
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
 * @typedef {Object} FunctionValueData
 * @property {Array<RuntimeValue>} args
 * @property {import('../ast/statements').BlockBody} body
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
 * Comprueba si un valor no existe o es numéricamente inoperable
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
 * Comprueba si un valor no existe o es numéricamente inoperable
 * @param {*} value 
 * @returns {value is Number}
 */
function isInternalOperable(value) {
	return value != null
	    && !isNaN(value)
		&& isFinite(value);
}

/**
 * Comprueba si un valor es Nada o inoperable
 * @param {RuntimeValue} value 
 * @returns {value is TextValue}
 */
function isValidText(value) {
	return value?.kind === ValueKinds.TEXT;
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

/**@param {NumberValue|TextValue|BooleanValue|EmbedValue|NadaValue} other*/
function basicEquals(other) {
	return makeBoolean(this.kind === other.kind && this.value === other.value);
}

/**@param {ListValue} other*/
function listEquals(other) {
	return makeBoolean(other.kind === ValueKinds.LIST && this.kind === other.kind && this.elements === other.elements);
}

/**@param {RegistryValue} other*/
function glossaryEquals(other) {
	return makeBoolean(other.kind === ValueKinds.REGISTRY && this.kind === other.kind && this.entries === other.entries);
}

/**@type {Map<ValueKind, RuntimeValue['compareTo']>}*/
const RuntimeCompareToFns = new Map();
RuntimeCompareToFns
	.set(ValueKinds.NUMBER,   basicCompareTo)
	.set(ValueKinds.TEXT,     basicCompareTo)
	.set(ValueKinds.BOOLEAN,  basicCompareTo)
	.set(ValueKinds.LIST,     _ => makeNumber(-1))
	.set(ValueKinds.REGISTRY, _ => makeNumber(-1))
	.set(ValueKinds.EMBED,    _ => makeNumber(-1))
	.set(ValueKinds.NADA,     _ => makeNumber(-1));

/**@type {Map<ValueKind, RuntimeValue['equals']>}*/
const RuntimeEqualsFns = new Map();
RuntimeEqualsFns
	.set(ValueKinds.NUMBER,   basicEquals)
	.set(ValueKinds.TEXT,     basicEquals)
	.set(ValueKinds.BOOLEAN,  basicEquals)
	.set(ValueKinds.LIST,     listEquals)
	.set(ValueKinds.REGISTRY, glossaryEquals)
	.set(ValueKinds.EMBED,    basicEquals)
	.set(ValueKinds.NADA,     basicEquals);

/**
 * @param {Number} value
 * @returns {NumberValue}
 */
function makeNumber(value) {
	const kind = ValueKinds.NUMBER;
	return {
		kind,
		value: +value,
		equals: RuntimeEqualsFns.get(kind),
		compareTo: RuntimeCompareToFns.get(kind),
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
		equals: RuntimeEqualsFns.get(kind),
		compareTo: RuntimeCompareToFns.get(kind),
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
		equals: RuntimeEqualsFns.get(kind),
		compareTo: RuntimeCompareToFns.get(kind),
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
		equals: RuntimeEqualsFns.get(kind),
		compareTo: RuntimeCompareToFns.get(kind),
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
		equals: RuntimeEqualsFns.get(kind),
		compareTo: RuntimeCompareToFns.get(kind),
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
		equals: RuntimeEqualsFns.get(kind),
		compareTo: RuntimeCompareToFns.get(kind),
	};
}

///**
// * @param {Function} fn
// * @returns {NativeFunctionValue}
// */
/*function makeNativeFunction(fn) {
	return {
		type: 'NativeFunction',
		compareTo: _ => makeNumber(-1),
		equals: n => makeBoolean(n.type === 'NativeFunction' && n.call === fn),
		call: fn,
	};
}*/

/**@returns {NadaValue}*/
function makeNada() {
	const kind = ValueKinds.NADA;
	return {
		kind,
		value: null,
		equals: RuntimeEqualsFns.get(kind),
		compareTo: RuntimeCompareToFns.get(kind),
	};
}

/**@type {Map<ValueKind, Map<ValueKind, (x: *, interpreter: import('./interpreter').Interpreter) => RuntimeValue>>}*/
const coercions = new Map();
coercions
	.set(ValueKinds.NUMBER,   new Map())
	.set(ValueKinds.TEXT,     new Map())
	.set(ValueKinds.BOOLEAN,  new Map())
	.set(ValueKinds.LIST,     new Map())
	.set(ValueKinds.REGISTRY, new Map())
	.set(ValueKinds.EMBED,    new Map())
	.set(ValueKinds.NADA,     new Map());

coercions.get(ValueKinds.NUMBER)
	.set(ValueKinds.NUMBER,   (x) => makeNumber(x))
	.set(ValueKinds.TEXT,     (x) => makeText(`${x ?? 'Nada'}`))
	.set(ValueKinds.BOOLEAN,  (x) => makeBoolean(x ? true : false))
	.set(ValueKinds.LIST,     (_) => makeNada())
	.set(ValueKinds.REGISTRY, (_) => makeNada());

coercions.get(ValueKinds.TEXT)
	.set(ValueKinds.NUMBER,   (x) => makeNumber(!isInternalOperable(+x) ? 0 : +x))
	.set(ValueKinds.TEXT,     (x) => makeText(x))
	.set(ValueKinds.BOOLEAN,  (x) => makeBoolean(x ? true : false))
	.set(ValueKinds.LIST,     (x) => makeList([ ...x ]))
	.set(ValueKinds.REGISTRY, (_) => makeNada());

coercions.get(ValueKinds.BOOLEAN)
	.set(ValueKinds.NUMBER,   (x) => makeNumber(x ? 1 : 0))
	.set(ValueKinds.TEXT,     (x) => makeText(x ? 'Verdadero' : 'Falso'))
	.set(ValueKinds.BOOLEAN,  (x) => makeBoolean(x))
	.set(ValueKinds.LIST,     (_) => makeNada())
	.set(ValueKinds.REGISTRY, (_) => makeNada());

coercions.get(ValueKinds.LIST)
	.set(ValueKinds.NUMBER,   (_) => makeNada())
	.set(ValueKinds.TEXT,     (/**@type Array<RuntimeValue>*/ x, interpreter) => {
		return makeText(`(${x?.map(y => makeValue(interpreter, y, 'Text').value).join('')})`)
	})
	.set(ValueKinds.BOOLEAN,  (x) => makeBoolean(x?.length ? true : false))
	.set(ValueKinds.LIST,     (x) => makeList(x))
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
		for(const [key, value] of x) {
			const coercedValue = makeValue(interpreter, value, 'Text').value;
			glossaryStrings.push(`${key}: ${coercedValue}`);
		}
		return makeText(`{Gl ${glossaryStrings.join(', ')}}`);
	})
	.set(ValueKinds.BOOLEAN,  (x) => makeBoolean(x?.size ? true : false))
	.set(ValueKinds.LIST,     (_) => makeNada())
	.set(ValueKinds.REGISTRY, (x) => makeRegistry(x));

coercions.get('Embed')
	.set(ValueKinds.NUMBER,   (_) => makeNada())
	.set(ValueKinds.TEXT,     (_) => makeText('[Marco]'))
	.set(ValueKinds.BOOLEAN,  (x) => makeBoolean(x ? true : false))
	.set(ValueKinds.LIST,     (_) => makeNada())
	.set(ValueKinds.REGISTRY, (/**@type {EmbedBuilder}*/x) => {
		if(x == null || x.data == null)
			return makeNada();

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

coercions.get('Nada')
	.set(ValueKinds.NUMBER,   (_) => makeNada())
	.set(ValueKinds.TEXT,     (_) => makeText('Nada'))
	.set(ValueKinds.BOOLEAN,  (_) => makeBoolean(false))
	.set(ValueKinds.LIST,     (_) => makeNada())
	.set(ValueKinds.REGISTRY, (_) => makeNada())

/**
 * @template {ValueKind} T
 * @param {import('./interpreter').Interpreter} interpreter
 * @param {RuntimeValue} value
 * @param {T} as
 * @returns {Extract<RuntimeValue, { kind: T }>}
 */
function makeValue(interpreter, value, as) {
	if(value == null || !value.kind)
		throw interpreter.TuberInterpreterError('Valor de origen corrupto al intentar convertirlo a otro tipo');

	const coercionOrigin = coercions.get(value.kind);
	if(coercionOrigin == null)
		throw interpreter.TuberInterpreterError('Tipo de origen inválido al intentar convertir un valor a otro tipo');

	const coercionFn = /**@type {(x: *, interpreter: import('./interpreter').Interpreter) => Extract<RuntimeValue, { kind: T }>}*/(coercionOrigin.get(as));
	if(coercionFn == null)
		throw interpreter.TuberInterpreterError('Tipo de destino de conversión inválido al intentar convertir un valor a otro tipo');

	switch(value.kind) {
	case ValueKinds.LIST:
		return coercionFn(value.elements, interpreter);
	case ValueKinds.REGISTRY:
		return coercionFn(value.entries, interpreter);
	case ValueKinds.NUMBER:
	case ValueKinds.TEXT:
	case ValueKinds.BOOLEAN:
	case ValueKinds.EMBED:
	case ValueKinds.NADA:
		return coercionFn(value.value, interpreter);
	default:
		throw interpreter.TuberInterpreterError(`Coerción no implementada: ${value.kind} → ${as}`);
	}
}

module.exports = {
	ValueKinds,
	defaultValueOf,
	isOperable,
	isValidText,
	extendList,
	makeNumber,
	makeText,
	makeBoolean,
	toggleBoolean,
	makeList,
	makeRegistry,
	makeEmbed,
	makeNada,
	makeValue,
};
