const { ValueKinds, makeNumber, makeText, makeBoolean, makeList, makeRegistry, makeNada, isNada, isOperable, isInternalOperable, coerceValue } = require('../../values');
const { expectParam } = require('../nativeUtils');
const { makeDiscordChannel, makeDiscordMember, makeDiscordRole } = require('../registryPrefabs');
const { Scope } = require('../../scope');
const { fetchChannel, fetchMember, fetchRole } = require('../../../../../func');
const { EmbedBuilder } = require('discord.js');

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
 * 
 * @param {null} self
 * @param {[ TextValue ]} args 
 * @param {Scope} scope 
 * @returns {RegistryValue | NadaValue}
 */
function buscarCanal(self, [ búsqueda ], scope) {
	const búsquedaResult = expectParam('búsqueda', búsqueda, ValueKinds.TEXT, scope);
	
	if(scope.interpreter.request == null)
		return makeNada();

    const channel = fetchChannel(búsquedaResult.value, scope.interpreter.request.guild);
    if(!channel)
        return makeNada();

    return makeDiscordChannel(channel);
}

/**
 * 
 * @param {null} self
 * @param {[ TextValue ]} args 
 * @param {Scope} scope 
 * @returns {RegistryValue | NadaValue}
 */
function buscarMiembro(self, [ búsqueda ], scope) {
	const búsquedaResult = expectParam('búsqueda', búsqueda, ValueKinds.TEXT, scope);
	
	if(scope.interpreter.request == null)
		return makeNada();

    const member = fetchMember(búsquedaResult.value, scope.interpreter.request);
    if(!member)
        return makeNada();

	return makeDiscordMember(member);
}

/**
 * 
 * @param {null} self
 * @param {[ TextValue ]} args 
 * @param {Scope} scope 
 * @returns {RegistryValue | NadaValue}
 */
function buscarRol(self, [ búsqueda ], scope) {
	const búsquedaResult = expectParam('búsqueda', búsqueda, ValueKinds.TEXT, scope);
	
	if(scope.interpreter.request == null)
		return makeNada();

    const role = fetchRole(búsquedaResult.value, scope.interpreter.request.guild);
    if(!role)
        return makeNada();
	
	return makeDiscordRole(role);
}

/**@type {Array<{ id: String, fn: import('../../values').NativeFunction }>}*/
const discordFunctions = [
	{ id: 'buscarCanal', fn: buscarCanal },
	{ id: 'buscarMiembro', fn: buscarMiembro },
	{ id: 'buscarRol', fn: buscarRol },
];

module.exports = {
	discordFunctions,
};
