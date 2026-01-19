import { ArgumentExpression, Expression } from '../ast/expressions';
import { BlockStatement } from '../ast/statements';
import { EmbedData } from '../embedData';
import { ValuesOf } from '../util/types';
import { makeEmbedRegistry } from './environment/registryPrefabs';
import { Interpreter } from '.';
import { Scope } from './scope';

/**@description Contiene los tipos de valores de PuréScript.*/
export const ValueKinds = ({
	NUMBER: 'Number',
	TEXT: 'Text',
	BOOLEAN: 'Boolean',
	LIST: 'List',
	REGISTRY: 'Registry',
	EMBED: 'Embed',
	NATIVE_FN: 'NativeFunction',
	FUNCTION: 'Function',
	NADA: 'Nada',
}) as const;
export type ValueKind = ValuesOf<typeof ValueKinds>;

interface BaseValueData<T extends ValueKind> {
	kind: T;
	compareTo: (o: RuntimeValue) => NumberValue;
	equals: (o: RuntimeValue) => BooleanValue;
}

interface BasePrimitiveValueData<U = undefined> {
	value: U;
}

export interface PrimitiveValueData<T extends ValueKind, U = undefined> extends BaseValueData<T>, BasePrimitiveValueData<U> {}

export type NumberValue = PrimitiveValueData<'Number', number>;

export type TextValue = PrimitiveValueData<'Text', string>;

export type BooleanValue = PrimitiveValueData<'Boolean', boolean>;

export type NadaValue = PrimitiveValueData<'Nada', null>;

export interface ListValueData {
	elements: RuntimeValue[];
}

export interface ListValue extends BaseValueData<'List'>, ListValueData {}

export interface RegistryValueData {
	entries: Map<string, RuntimeValue>;
}

export interface RegistryValue extends BaseValueData<'Registry'>, RegistryValueData {}

export type EmbedValue = PrimitiveValueData<'Embed', EmbedData>;

export type NativeMethod<T extends RuntimeValue> = (self: T, args: RuntimeValue[], scope: Scope) => RuntimeValue;

export type NativeFunction<
	TSelf extends RuntimeValue = RuntimeValue | null,
	TArg extends RuntimeValue[] = RuntimeValue[],
	TReturn extends RuntimeValue = RuntimeValue,
> = (self: TSelf, args: TArg, scope: Scope) => TReturn;

interface NativeFunctionValueData {
	self?: RuntimeValue;
	call: NativeFunction;
	with: (self?: RuntimeValue) => NativeFunctionValue;
}

export type NativeFunctionValue = BaseValueData<'NativeFunction'> & NativeFunctionValueData;

export interface BaseFunctionValueData {
	name: string;
	self: RuntimeValue;
	args: ArgumentExpression[];
}

export interface StandardFunctionValueData {
	lambda: false;
	body: BlockStatement;
	scope: Scope;
}

export interface DelegateValueData {
	lambda: true;
	expression: Expression;
}

export type FunctionValueData = BaseFunctionValueData & (StandardFunctionValueData | DelegateValueData);

export type FunctionValue = BaseValueData<'Function'> & FunctionValueData;

export type AnyFunctionValue =
	| FunctionValue
	| NativeFunctionValue;

export type PrimitiveValue =
	| NumberValue
	| TextValue
	| BooleanValue
	| NadaValue;

export type ComplexValue =
	| ListValue
	| RegistryValue
	| EmbedValue
	| AnyFunctionValue;

export type RuntimeValue =
	| PrimitiveValue
	| ComplexValue;

type RuntimeInternalValueMap = {
	Number: number;
	Text: string;
	Boolean: boolean;
	Nada: null;

	List: RuntimeValue[];
	Registry: Map<string, RuntimeValue>;
	Embed: EmbedData;
	NativeFunction: NativeFunction;
	Function: (x?: unknown) => unknown;
};
export type RuntimeInternalValue<TValue extends ValueKind> = RuntimeInternalValueMap[TValue];

export function basicCompareTo(other: NumberValue | TextValue | BooleanValue) {
	if(this.kind !== other.kind)
		return makeNumber(-1);

	if(this.value === other.value)
		return makeNumber(0);

	return makeNumber(this.value < other.value ? -1 : 1);
}

export function invalidCompareTo(_other: NumberValue | TextValue | BooleanValue) {
	return makeNumber(-1);
}

export function basicEquals(other: NumberValue | TextValue | BooleanValue | EmbedValue | NadaValue) {
	return makeBoolean(this.kind === other.kind && this.value === other.value);
}

export function listEquals(other: ListValue) {
	return makeBoolean(other.kind === ValueKinds.LIST && this.kind === other.kind && this.elements === other.elements);
}

export function registryEquals(other: RegistryValue) {
	return makeBoolean(other.kind === ValueKinds.REGISTRY && this.kind === other.kind && this.entries === other.entries);
}

export function nativeFnEquals(other: NativeFunctionValue) {
	return makeBoolean(other.kind === ValueKinds.NATIVE_FN && this.kind === other.kind && this.call === other.call);
}

export function referenceEquals(other: RuntimeValue) {
	return makeBoolean(this === other);
}

export const ValueKindTranslationLookups: Map<ValueKind, string> = new Map();
ValueKindTranslationLookups
	.set(ValueKinds.NUMBER,   'Número')
	.set(ValueKinds.TEXT,     'Texto')
	.set(ValueKinds.BOOLEAN,  'Lógico')
	.set(ValueKinds.LIST,     'Lista')
	.set(ValueKinds.REGISTRY, 'Registro')
	.set(ValueKinds.EMBED,    'Marco')
	.set(ValueKinds.FUNCTION, 'Función')
	.set(ValueKinds.NADA,     'Nada');

const CompareToMethodLookups: Map<ValueKind, RuntimeValue['compareTo']> = new Map();
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

const EqualsMethodLookups: Map<ValueKind, RuntimeValue['equals']> = new Map();
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

export function makeNumber(value: number): NumberValue {
	const kind = ValueKinds.NUMBER;
	return {
		kind,
		value: +value,
		equals: EqualsMethodLookups.get(kind),
		compareTo: CompareToMethodLookups.get(kind),
	};
}

export function makeText(value: string): TextValue {
	const kind = ValueKinds.TEXT;
	return {
		kind,
		value: `${value}`,
		equals: EqualsMethodLookups.get(kind),
		compareTo: CompareToMethodLookups.get(kind),
	};
}

export function makeBoolean(value: boolean): BooleanValue {
	const kind = ValueKinds.BOOLEAN;
	return {
		kind,
		value: !!value,
		equals: EqualsMethodLookups.get(kind),
		compareTo: CompareToMethodLookups.get(kind),
	};
}

export function toggleBoolean(value: BooleanValue): BooleanValue {
	return makeBoolean(!value.value);
}

export function makeList(elements: RuntimeValue[]): ListValue {
	const kind = ValueKinds.LIST;
	return {
		kind,
		elements,
		equals: EqualsMethodLookups.get(kind),
		compareTo: CompareToMethodLookups.get(kind),
	};
}

export function makeRegistry(entries: { [ K in string]: RuntimeValue }): RegistryValue;
export function makeRegistry(entries: Map<string, RuntimeValue>): RegistryValue;
export function makeRegistry(entries: Map<string, RuntimeValue> | Record<string, RuntimeValue>): RegistryValue {
	const kind = ValueKinds.REGISTRY;
	const actualEntries = entries instanceof Map
		? entries
		: new Map(Object.entries(entries));

	return {
		kind,
		entries: actualEntries,
		equals: EqualsMethodLookups.get(kind),
		compareTo: CompareToMethodLookups.get(kind),
	};
}

export function makeEmbed(): EmbedValue {
	const kind = ValueKinds.EMBED;
	return {
		kind,
		value: new EmbedData(),
		equals: EqualsMethodLookups.get(kind),
		compareTo: CompareToMethodLookups.get(kind),
	};
}

export function makeNativeFunction(self: RuntimeValue | null, fn: NativeFunction): NativeFunctionValue {
	const kind = ValueKinds.NATIVE_FN;
	return {
		kind,
		self,
		call: fn,
		equals: EqualsMethodLookups.get(kind),
		compareTo: CompareToMethodLookups.get(kind),
		with: function(self) {
			return makeNativeFunction(self, this.call);
		},
	};
}

export function makeFunction(body: BlockStatement, args: ArgumentExpression[], scope: Scope): FunctionValue {
	const kind = ValueKinds.FUNCTION;
	return {
		kind,
		lambda: false,
		name: '[Función]',
		self: makeNada(),
		body,
		args,
		scope,
		equals: EqualsMethodLookups.get(kind),
		compareTo: CompareToMethodLookups.get(kind),
	};
}

export function makeLambda(expression: Expression, args: ArgumentExpression[]): FunctionValue {
	const kind = ValueKinds.FUNCTION;
	return {
		kind,
		lambda: true,
		name: '[Lambda]',
		self: makeNada(),
		expression,
		args,
		equals: EqualsMethodLookups.get(kind),
		compareTo: CompareToMethodLookups.get(kind),
	};
}

export function makeNada(): NadaValue {
	const kind = ValueKinds.NADA;
	return {
		kind,
		value: null,
		equals: EqualsMethodLookups.get(kind),
		compareTo: CompareToMethodLookups.get(kind),
	};
}

export type AssertedRuntimeValue<T extends ValueKind> = Extract<RuntimeValue, { kind: T; }>;

export const valueMakers: Partial<{ [ K in ValueKind ]: (x?: RuntimeInternalValue<K>) => AssertedRuntimeValue<K> }> = ({
	[ValueKinds.NUMBER]: makeNumber,
	[ValueKinds.TEXT]: makeText,
	[ValueKinds.BOOLEAN]: makeBoolean,
	[ValueKinds.LIST]: makeList,
	[ValueKinds.REGISTRY]: makeRegistry,
	[ValueKinds.EMBED]: makeEmbed,
	[ValueKinds.NADA]: makeNada,
});

/**
 * @description
 * Crea un valor a partir de un tipo y un valor.
 * Esta función no convierte {@link RuntimeValue}s. Para convertir un {@link RuntimeValue} de tipo X a tipo Y, usa {@linkcode coerceValue}.
 */
export function makeValue<T extends ValueKind>(valueKind: T, value: RuntimeInternalValue<T>): AssertedRuntimeValue<T> {
	const makerFunction = valueMakers[valueKind];
	if(!makerFunction) throw `No Maker Function for ${valueKind}::${value}`;
	return makerFunction(value);
}

const defaultMakers: Partial<{ [ K in ValueKind ]: () => AssertedRuntimeValue<K> }> = {
	[ValueKinds.NUMBER]: () => makeNumber(0),
	[ValueKinds.TEXT]: () => makeText(''),
	[ValueKinds.BOOLEAN]: () => makeBoolean(false),
	[ValueKinds.EMBED]: makeEmbed,
	[ValueKinds.LIST]: () => makeList([]),
	[ValueKinds.REGISTRY]: () => makeRegistry(new Map()),
	[ValueKinds.NADA]: makeNada,
};

/**
 * @description
 * Crea un valor por defecto a partir del tipo indicado.
 */
export function defaultValueOf<T extends ValueKind>(valueKind: T): AssertedRuntimeValue<T> {
	const makerFunction = defaultMakers[valueKind];
	if(!makerFunction) throw `No Maker Function for ${valueKind}::default`;
	return makerFunction();
}

/**@description Comprueba si un RuntimeValue existe, es de tipo Número y es numéricamente operable.*/
export function isOperable(runtimeValue: RuntimeValue): runtimeValue is NumberValue {
	if(runtimeValue == null || runtimeValue.kind !== ValueKinds.NUMBER)
		return false;

	return !isNaN(runtimeValue.value) && isFinite(runtimeValue.value);
}

/**@description Comprueba si un valor existe y es numéricamente operable.*/
export function isInternalOperable(value: unknown): value is number {
	return value != null
	    && !isNaN(+value)
		&& isFinite(+value);
}

/**@description Comprueba si un RuntimeValue es de tipo Texto.*/
export function isValidText(runtimeValue: RuntimeValue): runtimeValue is TextValue {
	return runtimeValue?.kind === ValueKinds.TEXT;
}

/**@description Comprueba si un RuntimeValue es de tipo Lógico.*/
export function isBoolean(runtimeValue: RuntimeValue): runtimeValue is BooleanValue {
	return runtimeValue?.kind === ValueKinds.BOOLEAN;
}

/**@description Comprueba si un RuntimeValue es de tipo Lista.*/
export function isList(runtimeValue: RuntimeValue): runtimeValue is ListValue {
	return runtimeValue?.kind === ValueKinds.LIST;
}

/**@description Comprueba si un RuntimeValue es de tipo Registro.*/
export function isRegistry(runtimeValue: RuntimeValue): runtimeValue is RegistryValue {
	return runtimeValue?.kind === ValueKinds.REGISTRY;
}

/**@description Comprueba si un RuntimeValue es de tipo Marco.*/
export function isEmbed(runtimeValue: RuntimeValue): runtimeValue is EmbedValue {
	return runtimeValue?.kind === ValueKinds.EMBED;
}

/**@description Comprueba si un RuntimeValue es de tipo Nada.*/
export function isNada(runtimeValue: RuntimeValue): runtimeValue is NadaValue {
	return runtimeValue?.kind === ValueKinds.NADA;
}

export function extendList(list: ListValue, item: RuntimeValue, position: number | null = null) {
	list.elements.splice(position ?? list.elements.length, 0, item);
}

const coercions: Record<ValueKind, Partial<{ [ KTarget in ValueKind ]: (x: RuntimeInternalValue<ValueKind>, interpreter: Interpreter) => AssertedRuntimeValue<KTarget> }>> = {
	[ValueKinds.NUMBER]: {
		[ValueKinds.TEXT]: (x) => makeText(`${x ?? 'Nada'}`),
		[ValueKinds.BOOLEAN]: (x) => makeBoolean(x ? true : false),
	},
	[ValueKinds.TEXT]: {
		[ValueKinds.NUMBER]: (x) => makeNumber(isInternalOperable(+x) ? +x : 0),
		[ValueKinds.BOOLEAN]: (x) => makeBoolean(x ? true : false),
		[ValueKinds.LIST]: (x: string) => makeList(x.split('').map(makeText)),
	},
	[ValueKinds.BOOLEAN]: {
		[ValueKinds.NUMBER]: (x) => makeNumber(x ? 1 : 0),
		[ValueKinds.TEXT]: (x) => makeText(x ? 'Verdadero' : 'Falso'),
	},
	[ValueKinds.LIST]: {
		[ValueKinds.TEXT]: (x: RuntimeValue[], interpreter) => {
			const coercedElementValues: string[] = x?.map(y => coerceValue(interpreter, y, 'Text').value);
			const listString = coercedElementValues.join('');
			return makeText(`(${listString})`);
		},
		[ValueKinds.BOOLEAN]: (x: RuntimeValue[]) => makeBoolean(x?.length ? true : false),
		[ValueKinds.REGISTRY]: (x) => {
			if(!Array.isArray(x))
				return null;

			const properties = new Map();
			x.forEach((element, i) => properties.set(i, element));
			return makeRegistry(properties);
		},
	},
	[ValueKinds.REGISTRY]: {
		[ValueKinds.TEXT]: (x: Map<string, RuntimeValue>, interpreter) => {
			if(!x.size)
				return makeText('{Rg}');

			const glossaryStrings = [];
			x.forEach((value, key) => {
				const coercedValue = coerceValue(interpreter, value, 'Text').value;
				glossaryStrings.push(`${key}: ${coercedValue}`);
			});
			return makeText(`{Rg ${glossaryStrings.join(', ')} }`);
		},
		[ValueKinds.BOOLEAN]: (x: Map<string, RuntimeValue>) => makeBoolean(x?.size ? true : false),
	},
	[ValueKinds.EMBED]: {
		[ValueKinds.TEXT]: () => makeText('[Marco]'),
		[ValueKinds.BOOLEAN]: () => makeBoolean(true),
		[ValueKinds.REGISTRY]: (x: EmbedData) => {
			if(x == null || x.data == null)
				return null;

			return makeEmbedRegistry(x);
		},
	},
	[ValueKinds.FUNCTION]: {
		[ValueKinds.TEXT]: () => makeText('[Función]'),
		[ValueKinds.BOOLEAN]: () => makeBoolean(true),
	},
	[ValueKinds.NATIVE_FN]: {
		[ValueKinds.TEXT]: () => makeText('[Función nativa]'),
		[ValueKinds.BOOLEAN]: () => makeBoolean(true),
	},
	[ValueKinds.NADA]: {
		[ValueKinds.TEXT]: () => makeText('Nada'),
		[ValueKinds.BOOLEAN]: () => makeBoolean(false),
	},
};

export function coerceValue<T extends ValueKind>(interpreter: Interpreter, value: RuntimeValue, as: T): AssertedRuntimeValue<T> {
	if(value == null || !value.kind)
		throw interpreter.TuberInterpreterError('Valor de origen corrupto al intentar convertirlo a otro tipo');

	if(value.kind === as)
		return value as AssertedRuntimeValue<T>;

	const coercionOrigin = coercions[value.kind];
	if(coercionOrigin == null)
		throw interpreter.TuberInterpreterError('Tipo de origen inválido al intentar convertir un valor a otro tipo');

	const coercionFn = coercionOrigin[as];
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
