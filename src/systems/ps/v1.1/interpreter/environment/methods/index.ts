// @ts-nocheck
/** biome-ignore-all lint/correctness/noEmptyPattern: Claridad */

import type {
	FunctionValue,
	NativeFunction,
	NativeFunctionValue,
	RuntimeValue,
	ValueKind,
} from '../../values';
import { ValueKinds } from '../../values';
import { embedMethods } from './embed';
import { listMethods } from './list';
import { numberMethods } from './number';
import { registryMethods } from './registry';
import { textMethods } from './text';

const nativeFunctionMethods = new Map<string, NativeFunction<NativeFunctionValue>>();
nativeFunctionMethods
	.set('enlazar', (self, [valor]) => {
		self.self = valor;
		return self;
	})
	.set('llamar', (self, [enlazado, ...valores], scope) => self.call(enlazado, valores, scope));

const functionMethods = new Map<string, NativeFunction<FunctionValue>>();
functionMethods.set('llamar', (self, [], scope) =>
	self.lambda === true
		? scope.interpreter.evaluate(self.expression, scope)
		: scope.interpreter.evaluateStatement(self.body, scope),
);

export const NativeMethodsLookup = new Map<ValueKind, Map<string, NativeFunction<RuntimeValue>>>()
	.set(ValueKinds.NUMBER, numberMethods)
	.set(ValueKinds.TEXT, textMethods)
	.set(ValueKinds.LIST, listMethods)
	.set(ValueKinds.REGISTRY, registryMethods)
	.set(ValueKinds.EMBED, embedMethods)
	.set(ValueKinds.NATIVE_FN, nativeFunctionMethods)
	.set(ValueKinds.FUNCTION, functionMethods);
