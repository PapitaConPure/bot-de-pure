const { Scope } = require('../scope');
const { makeNumber, makeRegistry, makeNativeFunction, ValueKindTranslationLookups, ValueKinds, makeText, makeValue, makeBoolean, makeList, makeNada } = require('../values');
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
        scope.assignVariable(traducción, makeText('#' + original.toString(16)));

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
		savedData.forEach((node, key) => {
			recursiveConvertRegistry(node);
			scope.assignVariable(key, makeValueFromSaved(node));
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

/**
 * @param {import('../values').RuntimeValue} node 
 * @returns {Extract<import('../values').RuntimeValue, { kind: node['kind'] }>}
 */
function makeValueFromSaved(node) {
	switch(node.kind) {
	case ValueKinds.NUMBER:
		return makeNumber(node.value);
	case ValueKinds.TEXT:
		return makeText(node.value);
	case ValueKinds.BOOLEAN:
		return makeBoolean(node.value);
	case ValueKinds.LIST:
		return makeList(node.elements);
	case ValueKinds.REGISTRY:
		return makeRegistry(node.entries);
	default:
		return makeNada();
	}
}

module.exports = {
	NativeMethodsLookup,
	declareNatives,
	declareContext,
};
