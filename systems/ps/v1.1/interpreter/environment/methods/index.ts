/* eslint-disable no-empty-pattern */

import { NativeFunction, RuntimeValue, ValueKind, ValueKinds, NativeFunctionValue, FunctionValue } from '../../values';
import { numberMethods } from './number';
import { textMethods } from './text';
import { listMethods } from './list';
import { registryMethods } from './registry';
import { embedMethods } from './embed';

const nativeFunctionMethods = new Map<string, NativeFunction<NativeFunctionValue>>();
nativeFunctionMethods
	.set('enlazar', function(self, [ valor ]) {
		self.self = valor;
		return self;
	})
	.set('llamar', function(self, [ enlazado, ...valores ], scope) {
		return self.call(enlazado, valores, scope);
	});

const functionMethods = new Map<string, NativeFunction<FunctionValue>>();
functionMethods.set('llamar', function(self, [], scope) {
	return (self.lambda === true)
		? scope.interpreter.evaluate(self.expression, scope)
		: scope.interpreter.evaluateStatement(self.body, scope);
});

export const NativeMethodsLookup = new Map<ValueKind, Map<string, NativeFunction<RuntimeValue>>>()
	.set(ValueKinds.NUMBER, numberMethods)
	.set(ValueKinds.TEXT, textMethods)
	.set(ValueKinds.LIST, listMethods)
	.set(ValueKinds.REGISTRY, registryMethods)
	.set(ValueKinds.EMBED, embedMethods)
	.set(ValueKinds.NATIVE_FN, nativeFunctionMethods)
	.set(ValueKinds.FUNCTION, functionMethods);
