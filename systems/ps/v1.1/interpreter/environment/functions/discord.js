const { ValueKinds, makeNada } = require('../../values');
const { expectParam } = require('../nativeUtils');
const { makeDiscordChannel, makeDiscordMember, makeDiscordRole } = require('../registryPrefabs');

/**
 * @typedef {import('../../values').NumberValue} NumberValue
 * @typedef {import('../../values').TextValue} TextValue
 * @typedef {import('../../values').BooleanValue} BooleanValue
 * @typedef {import('../../values').ListValue} ListValue
 * @typedef {import('../../values').RegistryValue} RegistryValue
 * @typedef {import('../../values').NativeFunctionValue} NativeFunctionValue
 * @typedef {import('../../values').FunctionValue} FunctionValue
 * @typedef {import('../../values').NadaValue} NadaValue
 * @typedef {import('../../values').RuntimeValue} RuntimeValue
 */

/**
 * @template {Array<RuntimeValue>} [TArg=Array<RuntimeValue>]
 * @template {RuntimeValue} [TResult=RuntimeValue]
 * @typedef {import('../../values').NativeFunction<*, TArg, TResult>} NativeFunction
 */

/**@type {NativeFunction<[ TextValue ], RegistryValue | NadaValue>}*/
function buscarCanal(self, [ búsqueda ], scope) {
	const búsquedaResult = expectParam('búsqueda', búsqueda, ValueKinds.TEXT, scope);

    const channel = scope.interpreter.provider.fetchChannel(búsquedaResult.value);

    if(!channel)
        return makeNada();

    return makeDiscordChannel(channel);
}

/**@type {NativeFunction<[ TextValue ], RegistryValue | NadaValue>}*/
function buscarMiembro(self, [ búsqueda ], scope) {
	const búsquedaResult = expectParam('búsqueda', búsqueda, ValueKinds.TEXT, scope);
	
    const member = scope.interpreter.provider.fetchMember(búsquedaResult.value);

    if(!member)
        return makeNada();

	return makeDiscordMember(member);
}

/**@type {NativeFunction<[ TextValue ], RegistryValue | NadaValue>}*/
function buscarRol(self, [ búsqueda ], scope) {
	const búsquedaResult = expectParam('búsqueda', búsqueda, ValueKinds.TEXT, scope);
	
    const role = scope.interpreter.provider.fetchRole(búsquedaResult.value);

    if(!role)
        return makeNada();
	
	return makeDiscordRole(role);
}

/**@type {Array<{ id: String, fn: import('../../values').NativeFunction }>}*/
const discordFunctions = [
	{ id: 'buscarCanal',   fn: /**@type {NativeFunction}*/(buscarCanal) },
	{ id: 'buscarMiembro', fn: /**@type {NativeFunction}*/(buscarMiembro) },
	{ id: 'buscarRol',     fn: /**@type {NativeFunction}*/(buscarRol) },
];

module.exports = {
	discordFunctions,
};
