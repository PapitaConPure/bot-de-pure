import { Scope } from '../scope';
import {
	RuntimeValue,
	ValueKinds,
	makeNumber,
	makeText,
	makeList,
	makeRegistry,
	makeNada,
	makeNativeFunction,
} from '../values';
import { NativeColorsLookup } from './variables/colors';
import { NativeFunctions } from './functions';
import { makeDiscordMember, makeDiscordChannel, makeDiscordGuild } from './registryPrefabs';
import { makeKindFromValue } from './nativeUtils';
import { EnvironmentProvider } from './environmentProvider';

export { NativeMethodsLookup } from './methods';

export function declareNatives(scope: Scope) {
	scope.global = true;

	scope.assignVariable('PI', makeNumber(Math.PI));
	scope.assignVariable('E', makeNumber(Math.E));

	for(const [ traducción, original ] of NativeColorsLookup)
		scope.assignVariable(traducción, makeText('#' + original.toString(16)));

	for(const { id, fn } of NativeFunctions)
		scope.assignVariable(id, makeNativeFunction(null, fn));
}

export async function declareContext(
	scope: Scope,
	dataProvider: EnvironmentProvider,
	savedData: Map<string, RuntimeValue> | null = null,
) {
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

/**@description Convierte recursivamente entradas de Registros, de formato JSON a Mapas ES6.*/
function recursiveRecoverSavedValues(value: RuntimeValue): RuntimeValue {
	switch(value.kind) {
	case ValueKinds.NUMBER:
	case ValueKinds.TEXT:
	case ValueKinds.BOOLEAN:
		return makeKindFromValue(value.kind, value.value);

	case ValueKinds.LIST:
		return makeList(value.elements.map((el) => recursiveRecoverSavedValues(el)));

	case ValueKinds.REGISTRY: {
		const mapEntries = new Map();
		for(const [ k, v ] of Object.entries(value.entries))
			mapEntries.set(k, recursiveRecoverSavedValues(v));
		return makeRegistry(mapEntries);
	}

	default:
		return makeNada();
	}
}
