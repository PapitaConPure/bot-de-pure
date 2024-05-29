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
        scope.assignVariable(traducción, makeNumber(original));

	for(const { id, fn } of NativeFunctions)
		scope.assignVariable(id, makeNativeFunction(null, fn));
}

/**
 * @param {Scope} scope
 * @param {import('../../../../commands/Commons/typings').ComplexCommandRequest} request
 * @param {import('../../purescript').Tubercle} tuber
 * @param {Array<String>} args
 */
function declareContext(scope, request, tuber, args) {
	if(request != null) {
		scope.assignVariable('usuario', makeDiscordMember(request.member));
		scope.assignVariable('canal', makeDiscordChannel(request.channel));
		makeDiscordGuild(request.guild)
			.then(guildValue => scope.assignVariable('servidor', guildValue));
	} else {
		scope.assignVariable('usuario', makeRegistry(new Map()));
		scope.assignVariable('canal', makeRegistry(new Map()));
		scope.assignVariable('servidor', makeRegistry(new Map()));
		scope.assignVariable('.inputs', makeRegistry(new Map()));
	}
}

/**
 * @param {Scope} scope
 * @param {import('../../purescript').Tubercle} tuber
 * @param {Array<String>} args
 */
function declareInputs(scope, tuber, args) {
	const inputs = makeList([]);

	const tuberInputs = tuber.inputs;
	let tuberInput, userInput, arg;
	for(let i = 0, j = 0; i < tuberInputs.length; i++, j++) {
		tuberInput = tuberInputs[i];

		if(j < args.length) {
			if(tuberInput.spread) {
				while(j < args.length)
					readTuberInput(tuberInput, args[j++]);
			} else {
				arg = args[j];
				readTuberInput(tuberInput, arg);
			}
		} else if(tuberInput.optional)
			userInput = defaultValueOf(tuberInput.kind);
		else
			throw TuberInitializerError(`Se esperaba un valor válido para la Entrada requerida: "${tuberInput.name}", de tipo: ${ValueKindTranslationLookups.get(tuberInput.kind)}`);

		inputs.elements.push(userInput);
	}
	
	scope.assignVariable('.inputs', inputs);
}

/**
 * @param {string} message
 */
function TuberInitializerError(message) {
	const err = new Error(message);
	err.name = 'TunberInitializerError';
	return err;
}

/**
 * 
 * @param {import('../../purescript').TuberInput} expected
 * @param {String} supplied 
 */
function readTuberInput(expected, supplied) {
	switch(expected.kind) {
	case ValueKinds.NUMBER:
		if(!isInternalOperable(+supplied))
			throw TuberInitializerError(`Se esperaba un Número válido para la Entrada: "${expected.name}", de tipo: ${ValueKindTranslationLookups.get(expected.kind)}`);

		return makeNumber(+supplied);
	case ValueKinds.TEXT:
		return makeText(supplied);
	case ValueKinds.BOOLEAN:
		supplied = toLowerCaseNormalized(supplied);
		if(![ 'verdadero', 'falso' ].includes(supplied))
			throw TuberInitializerError(`Se esperaba Verdadero o Falso para la Entrada: "${expected.name}", de tipo: ${ValueKindTranslationLookups.get(expected.kind)}`);

		return makeBoolean(supplied === 'verdadero' ? true : false);
	}
}

module.exports = {
	NativeMethodsLookup,
	declareNatives,
	declareContext,
	declareInputs,
};
