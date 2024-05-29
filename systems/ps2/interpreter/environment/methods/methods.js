const { ValueKinds } = require('../../values');
const { numberMethods } = require('./number');
const { textMethods } = require('./text');
const { listMethods } = require('./list');
const { registryMethods } = require('./registry');
const { embedMethods } = require('./embed');

/**@type {Map<String, import('../../values').NativeFunction<import('../../values').NativeFunctionValue>>}*/
const nativeFunctionMethods = new Map();
nativeFunctionMethods
	.set('enlazar', function(self, [ valor ], scope) {
		self.self = valor;
		return self;
	})
	.set('llamar', function(self, [ enlazado, ...valores ], scope) {
		return self.call(enlazado, valores, scope);
	});

/**@type {Map<String, import('../../values').NativeFunction<import('../../values').FunctionValue>>}*/
const functionMethods = new Map();
functionMethods.set('llamar', function(self, [ valor ], scope) {
	let evaluated;
	
	if(self.lambda === true)
		evaluated = scope.interpreter.evaluate(self.expression, scope);
	else
		evaluated = scope.interpreter.evaluate(self.body, scope);

	return evaluated;
});

/**@type {Map<import('../../values').ValueKind, Map<String, import('../../values').NativeFunction>>}*/
const NativeMethodsLookup = new Map()
	.set(ValueKinds.NUMBER, numberMethods)
	.set(ValueKinds.TEXT, textMethods)
	.set(ValueKinds.LIST, listMethods)
	.set(ValueKinds.REGISTRY, registryMethods)
	.set(ValueKinds.EMBED, embedMethods)
	.set(ValueKinds.NATIVE_FN, nativeFunctionMethods)
	.set(ValueKinds.FUNCTION, functionMethods);

module.exports = {
	NativeMethodsLookup,
};
