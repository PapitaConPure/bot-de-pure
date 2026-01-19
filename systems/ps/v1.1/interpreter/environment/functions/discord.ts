import {
	RuntimeValue,
	NativeFunction,
	ValueKinds,
	makeNada,
	TextValue,
	RegistryValue,
	NadaValue,
} from '../../values';
import { expectParam } from '../nativeUtils';
import { makeDiscordChannel, makeDiscordMember, makeDiscordRole } from '../registryPrefabs';
import { NativeFunctionEntry } from '.';

const buscarCanal: NativeFunction<RuntimeValue, [TextValue], RegistryValue | NadaValue> = (
	_self,
	[ búsqueda ],
	scope,
) => {
	const búsquedaResult = expectParam('búsqueda', búsqueda, ValueKinds.TEXT, scope);

	const channel = scope.interpreter.provider.fetchChannel(búsquedaResult.value);

	if(!channel) return makeNada();

	return makeDiscordChannel(channel);
};

const buscarMiembro: NativeFunction<RuntimeValue, [TextValue], RegistryValue | NadaValue> = (
	_self,
	[ búsqueda ],
	scope,
) => {
	const búsquedaResult = expectParam('búsqueda', búsqueda, ValueKinds.TEXT, scope);

	const member = scope.interpreter.provider.fetchMember(búsquedaResult.value);

	if(!member) return makeNada();

	return makeDiscordMember(member);
};

const buscarRol: NativeFunction<RuntimeValue, [TextValue], RegistryValue | NadaValue> = (
	_self,
	[ búsqueda ],
	scope,
) => {
	const búsquedaResult = expectParam('búsqueda', búsqueda, ValueKinds.TEXT, scope);

	const role = scope.interpreter.provider.fetchRole(búsquedaResult.value);

	if(!role) return makeNada();

	return makeDiscordRole(role);
};

export const discordFunctions: NativeFunctionEntry[] = [
	{ id: 'buscarCanal', fn: buscarCanal },
	{ id: 'buscarMiembro', fn: buscarMiembro },
	{ id: 'buscarRol', fn: buscarRol },
];
