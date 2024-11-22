const { EmbedData } = require('../embedData');

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
/**@typedef {import('../util/types').ValuesOf<typeof ValueKinds>} ValueKind*/

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
 * @typedef {PrimitiveValueData<'Embed', EmbedData>} EmbedValue
 */

/**
 * @template {RuntimeValue} [T=RuntimeValue]
 * @typedef {(self: T, args: Array<RuntimeValue>, scope: import('./scope').Scope) => RuntimeValue} NativeMethod
 */

/**
 * @template {RuntimeValue?} [TSelf=RuntimeValue]
 * @template {Array<RuntimeValue>} [TArg=Array<RuntimeValue>]
 * @template {RuntimeValue} [TReturn=RuntimeValue]
 * @typedef {(self: TSelf, args: TArg, scope: import('./scope').Scope) => TReturn} NativeFunction
 */

/**
 * @typedef {Object} NativeFunctionValueData
 * @property {RuntimeValue?} self
 * @property {NativeFunction} call
 * @property {(self: RuntimeValue?) => NativeFunctionValue} with
 * @typedef {BaseValueData<'NativeFunction'> & NativeFunctionValueData} NativeFunctionValue
 */

/**
 * @typedef {Object} BaseFunctionValueData
 * @property {String} name
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
 * @typedef {FunctionValue | NativeFunctionValue} AnyFunctionValue
 * 
 * @typedef {NumberValue
 *          |TextValue
 *          |BooleanValue
 *          |NadaValue
 * } PrimitiveValue
 * 
 * @typedef {ListValue
 *          |RegistryValue
 *          |EmbedValue
 *          |AnyFunctionValue
 * } ComplexValue
 * 
 * @typedef {PrimitiveValue | ComplexValue} RuntimeValue
 */

/**
 * @template {ValueKind} T
 * @typedef {Extract<RuntimeValue, { kind: T }>} AssertedRuntimeValue
 */

/**
 * 
 * @template {ValueKind} T
 * @param {T} dataKind 
 * @returns {AssertedRuntimeValue<T>}
 */
function defaultValueOf(dataKind) {
	switch(dataKind) {
	case ValueKinds.NUMBER:
		return /**@type {AssertedRuntimeValue<T>}*/(makeNumber(0));
	case ValueKinds.TEXT:
		return /**@type {AssertedRuntimeValue<T>}*/(makeText(''));
	case ValueKinds.BOOLEAN:
		return /**@type {AssertedRuntimeValue<T>}*/(makeBoolean(false));
	case ValueKinds.EMBED:
		return /**@type {AssertedRuntimeValue<T>}*/(makeEmbed());
	case ValueKinds.LIST:
		return /**@type {AssertedRuntimeValue<T>}*/(makeList([]));
	case ValueKinds.REGISTRY:
		return /**@type {AssertedRuntimeValue<T>}*/(makeRegistry(new Map()));
	case ValueKinds.NADA:
		return /**@type {AssertedRuntimeValue<T>}*/(makeNada());
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
 * Comprueba si un RuntimeValue es de tipo Lógico
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

/**@param {RuntimeValue} other*/
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
	.set(ValueKinds.BOOLEAN, 'Lógico')
	.set(ValueKinds.LIST, 'Lista')
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
		equals: /**@type {RuntimeValue['equals']}*/(EqualsMethodLookups.get(kind)),
		compareTo: /**@type {RuntimeValue['compareTo']}*/(CompareToMethodLookups.get(kind)),
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
		equals: /**@type {RuntimeValue['equals']}*/(EqualsMethodLookups.get(kind)),
		compareTo: /**@type {RuntimeValue['compareTo']}*/(CompareToMethodLookups.get(kind)),
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
		equals: /**@type {RuntimeValue['equals']}*/(EqualsMethodLookups.get(kind)),
		compareTo: /**@type {RuntimeValue['compareTo']}*/(CompareToMethodLookups.get(kind)),
	};
}

/**
 * @param {BooleanValue} value
 * @returns {BooleanValue}
 */
function toggleBoolean(value) {
	return makeBoolean(!value.value);
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
		equals: /**@type {RuntimeValue['equals']}*/(EqualsMethodLookups.get(kind)),
		compareTo: /**@type {RuntimeValue['compareTo']}*/(CompareToMethodLookups.get(kind)),
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
		equals: /**@type {RuntimeValue['equals']}*/(EqualsMethodLookups.get(kind)),
		compareTo: /**@type {RuntimeValue['compareTo']}*/(CompareToMethodLookups.get(kind)),
	};
}

/**
 * @returns {EmbedValue}
 */
function makeEmbed() {
	const kind = ValueKinds.EMBED;
	return {
		kind,
		value: new EmbedData(),
		equals: /**@type {RuntimeValue['equals']}*/(EqualsMethodLookups.get(kind)),
		compareTo: /**@type {RuntimeValue['compareTo']}*/(CompareToMethodLookups.get(kind)),
	};
}

/**
 * @param {RuntimeValue?} self
 * @param {NativeFunction} fn
 * @returns {NativeFunctionValue}
 */
function makeNativeFunction(self, fn) {
	const kind = ValueKinds.NATIVE_FN;
	return {
		kind,
		self,
		call: fn,
		equals: /**@type {RuntimeValue['equals']}*/(EqualsMethodLookups.get(kind)),
		compareTo: /**@type {RuntimeValue['compareTo']}*/(CompareToMethodLookups.get(kind)),
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
		name: '[Función]',
		body,
		args,
		scope,
		equals: /**@type {RuntimeValue['equals']}*/(EqualsMethodLookups.get(kind)),
		compareTo: /**@type {RuntimeValue['compareTo']}*/(CompareToMethodLookups.get(kind)),
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
		name: '[Lambda]',
		expression,
		args,
		equals: /**@type {RuntimeValue['equals']}*/(EqualsMethodLookups.get(kind)),
		compareTo: /**@type {RuntimeValue['compareTo']}*/(CompareToMethodLookups.get(kind)),
	};
}

/**@returns {NadaValue}*/
function makeNada() {
	const kind = ValueKinds.NADA;
	return {
		kind,
		value: null,
		equals: /**@type {RuntimeValue['equals']}*/(EqualsMethodLookups.get(kind)),
		compareTo: /**@type {RuntimeValue['compareTo']}*/(CompareToMethodLookups.get(kind)),
	};
}

/**@type {Map<ValueKind, (x?: *) => RuntimeValue>}*/
const valueMakers = new Map();
valueMakers
	.set(ValueKinds.NUMBER, makeNumber)
	.set(ValueKinds.TEXT, makeText)
	.set(ValueKinds.BOOLEAN, makeBoolean)
	.set(ValueKinds.LIST, makeList)
	.set(ValueKinds.REGISTRY, makeRegistry)
	.set(ValueKinds.EMBED, makeEmbed)
	.set(ValueKinds.NADA, makeNada)

/**
 * Crea un valor a partir de un tipo y un valor
 * Esta función no convierte {@link RuntimeValue}s. Para convertir un {@link RuntimeValue} de tipo X a tipo Y, usa {@linkcode coerceValue}
 * @template {ValueKind} T
 * @param {T} kind
 * @param {*} value
 * @returns {AssertedRuntimeValue<T>}
 */
function makeValue(kind, value) {
	const makerFunction = valueMakers.get(kind);
	if(!makerFunction) throw `No Maker Function for ${kind}::${value}`;
	return /**@type {AssertedRuntimeValue<T>}*/(makerFunction(value));
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
	?.set(ValueKinds.TEXT,    (x) => makeText(`${x ?? 'Nada'}`))
	.set(ValueKinds.BOOLEAN,  (x) => makeBoolean(x ? true : false));

coercions.get(ValueKinds.TEXT)
	?.set(ValueKinds.NUMBER,  (x) => makeNumber(!isInternalOperable(+x) ? 0 : +x))
	.set(ValueKinds.BOOLEAN,  (x) => makeBoolean(x ? true : false))
	.set(ValueKinds.LIST,     (x) => makeList([ ...x ]));

coercions.get(ValueKinds.BOOLEAN)
	?.set(ValueKinds.NUMBER,  (x) => makeNumber(x ? 1 : 0))
	.set(ValueKinds.TEXT,     (x) => makeText(x ? 'Verdadero' : 'Falso'));

coercions.get(ValueKinds.LIST)
	?.set(ValueKinds.TEXT,    (/**@type Array<RuntimeValue>*/ x, interpreter) => {
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
	?.set(ValueKinds.TEXT,    (/**@type Map<string, RuntimeValue>*/ x, interpreter) => {
		if(!x.size)
			return makeText('{Rg}');

		let glossaryStrings = [];
		x.forEach((value, key) => {
			const coercedValue = coerceValue(interpreter, value, 'Text').value;
			glossaryStrings.push(`${key}: ${coercedValue}`);
		});
		return makeText(`{Rg ${glossaryStrings.join(', ')} }`);
	})
	.set(ValueKinds.BOOLEAN,  (x) => makeBoolean(x?.size ? true : false));

coercions.get(ValueKinds.EMBED)
	?.set(ValueKinds.TEXT,    (_) => makeText('[Marco]'))
	.set(ValueKinds.BOOLEAN,  (x) => makeBoolean(true))
	.set(ValueKinds.REGISTRY, (/**@type {EmbedData}*/x) => {
		if(x == null || x.data == null)
			return makeNada();

		return require('./environment/registryPrefabs').makeEmbedRegistry(x);
	});

coercions.get(ValueKinds.FUNCTION)
	?.set(ValueKinds.TEXT,    (_) => makeText('[Función]'))
	.set(ValueKinds.BOOLEAN,  (_) => makeBoolean(true));

coercions.get(ValueKinds.NATIVE_FN)
	?.set(ValueKinds.TEXT,    (_) => makeText('[Función nativa]'))
	.set(ValueKinds.BOOLEAN,  (_) => makeBoolean(true));

coercions.get(ValueKinds.NADA)
	?.set(ValueKinds.TEXT,    (_) => makeText('Nada'))
	.set(ValueKinds.BOOLEAN,  (_) => makeBoolean(false));

/**
 * @template {ValueKind} T
 * @param {import('./interpreter').Interpreter} interpreter
 * @param {RuntimeValue} value
 * @param {T} as
 * @returns {AssertedRuntimeValue<T>}
 */
function coerceValue(interpreter, value, as) {
	if(value == null || !value.kind)
		throw interpreter.TuberInterpreterError('Valor de origen corrupto al intentar convertirlo a otro tipo');

	if(value.kind === as)
		return /**@type {AssertedRuntimeValue<T>}*/(value);

	const coercionOrigin = coercions.get(value.kind);
	if(coercionOrigin == null)
		throw interpreter.TuberInterpreterError('Tipo de origen inválido al intentar convertir un valor a otro tipo');

	const coercionFn = /**@type {(x: *, interpreter: import('./interpreter').Interpreter) => AssertedRuntimeValue<T>}*/(coercionOrigin.get(as));
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
	makeValue,
	coerceValue,
};
