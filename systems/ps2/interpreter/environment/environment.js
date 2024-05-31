const { Scope } = require('../scope');
const { makeNumber, makeRegistry, makeNativeFunction, ValueKindTranslationLookups, ValueKinds, makeText } = require('../values');
const { NativeColorsLookup } = require('./variables/colors');
const { NativeFunctions } = require('./functions/functions');
const { NativeMethodsLookup } = require('./methods/methods');
const { makeDiscordMember, makeDiscordChannel, makeDiscordGuild } = require('./registryPrefabs');

/**
 * @param {Scope} scope
 */
function declareNatives(scope) {
	scope.global = true;

    scope.assignVariable('PI', makeNumber(Math.PI));
    scope.assignVariable('E', makeNumber(Math.E));

    for(const [traducción, original] of NativeColorsLookup)
        scope.assignVariable(traducción, makeText(original.toString(16)));

	for(const { id, fn } of NativeFunctions)
		scope.assignVariable(id, makeNativeFunction(null, fn));
}

/**
 * @param {Scope} scope
 * @param {import('../../../../commands/Commons/typings').ComplexCommandRequest} request
 * @param {Map<String, import('../values').RuntimeValue>} savedData
 */
async function declareContext(scope, request, savedData = null) {
	if(request != null) {
		scope.assignVariable('usuario', makeDiscordMember(request.member));
		scope.assignVariable('canal', makeDiscordChannel(request.channel));
		scope.assignVariable('servidor', await makeDiscordGuild(request.guild));
	} else {
		scope.assignVariable('usuario', makeRegistry(new Map()));
		scope.assignVariable('canal', makeRegistry(new Map()));
		scope.assignVariable('servidor', makeRegistry(new Map()));
	}
	
	if(savedData != null) {
		savedData.forEach((value, key) => {
			recursiveConvertRegistry(value);
			scope.assignVariable(key, value);
		});
	}
}

/**
 * Convierte recursivamente entradas de Registros, de formato JSON a Mapas ES6
 * @param {import('../values').RuntimeValue} value 
 */
function recursiveConvertRegistry(value) {
	if(value.kind === ValueKinds.LIST) {
		value.elements.forEach(el => recursiveConvertRegistry(el));
	}

	if(value.kind === ValueKinds.REGISTRY) {
		const mapEntries = new Map();
		for(const [k, v] of Object.entries(value.entries)) {
			recursiveConvertRegistry(v);
			mapEntries.set(k, v);
		}
		value.entries = mapEntries;
	}
}

module.exports = {
	NativeMethodsLookup,
	declareNatives,
	declareContext,
};
