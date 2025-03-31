const { Scope } = require('../scope');
const { makeNumber, makeRegistry, makeNativeFunction, ValueKindTranslationLookups, ValueKinds, makeText, makeValue, makeBoolean, makeList, makeNada } = require('../values');
const { NativeColorsLookup } = require('./variables/colors');
const { NativeFunctions } = require('./functions/functions');
const { NativeMethodsLookup } = require('./methods/methods');
const { makeDiscordMember, makeDiscordChannel, makeDiscordGuild } = require('./registryPrefabs');
const { makeKindFromValue } = require('./nativeUtils');
const { EnvironmentProvider } = require('./environmentProvider');

/**
 * @param {Scope} scope
 */
function declareNatives(scope) {
	scope.global = true;

    scope.assignVariable('PI', makeNumber(Math.PI));
    scope.assignVariable('E', makeNumber(Math.E));

    for(const [traducción, original] of NativeColorsLookup)
        scope.assignVariable(traducción, makeText('#' + original.toString(16)));

	for(const { id, fn } of NativeFunctions)
		scope.assignVariable(id, makeNativeFunction(null, fn));
}

/**
 * @param {Scope} scope
 * @param {EnvironmentProvider} dataProvider
 * @param {Map<String, import('../values').RuntimeValue>?} savedData
 */
async function declareContext(scope, dataProvider, savedData = null) {
	const member = dataProvider.getMember();
	const channel = dataProvider.getChannel();
	const guild = dataProvider.getGuild();
	member && scope.assignVariable('usuario', await makeDiscordMember(member));
	channel && scope.assignVariable('canal', makeDiscordChannel(channel));
	guild && scope.assignVariable('servidor', await makeDiscordGuild(guild));
	
	if(savedData != null) {
		savedData.forEach((node, key) => {
			scope.assignVariable(key, recursiveRecoverSavedValues(node));
		});
	}
}

/**
 * Convierte recursivamente entradas de Registros, de formato JSON a Mapas ES6
 * @param {import('../values').RuntimeValue} value 
 * @returns {import('../values').RuntimeValue}
 */
function recursiveRecoverSavedValues(value) {
	switch(value.kind) {
	case ValueKinds.NUMBER:
	case ValueKinds.TEXT:
	case ValueKinds.BOOLEAN:
		return makeKindFromValue(value.kind, value.value);

	case ValueKinds.LIST:
		return makeList(value.elements.map(el => recursiveRecoverSavedValues(el)));

	case ValueKinds.REGISTRY:
		const mapEntries = new Map();
		for(const [k, v] of Object.entries(value.entries))
			mapEntries.set(k, recursiveRecoverSavedValues(v));
		return makeRegistry(mapEntries);

	default:
		return makeNada();
	}
}

module.exports = {
	NativeMethodsLookup,
	declareNatives,
	declareContext,
};
