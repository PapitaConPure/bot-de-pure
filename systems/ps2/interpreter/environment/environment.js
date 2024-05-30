const { Scope } = require('../scope');
const { makeNumber, makeRegistry, makeNativeFunction, defaultValueOf, ValueKindTranslationLookups, ValueKinds, makeText, makeBoolean, isInternalOperable, makeList } = require('../values');
const { NativeColorsLookup } = require('./variables/colors');
const { NativeFunctions } = require('./functions/functions');
const { NativeMethodsLookup } = require('./methods/methods');
const { makeDiscordMember, makeDiscordChannel, makeDiscordGuild } = require('./registryPrefabs');
const { makeKindFromValue } = require('./nativeUtils');
const { toLowerCaseNormalized } = require('../../../../func');

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
 */
async function declareContext(scope, request) {
	if(request != null) {
		scope.assignVariable('usuario', makeDiscordMember(request.member));
		scope.assignVariable('canal', makeDiscordChannel(request.channel));
		scope.assignVariable('servidor', await makeDiscordGuild(request.guild));
	} else {
		scope.assignVariable('usuario', makeRegistry(new Map()));
		scope.assignVariable('canal', makeRegistry(new Map()));
		scope.assignVariable('servidor', makeRegistry(new Map()));
	}
}

module.exports = {
	NativeMethodsLookup,
	declareNatives,
	declareContext,
};
