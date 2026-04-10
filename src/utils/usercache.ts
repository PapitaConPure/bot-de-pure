import type { GuildMember, Interaction, User } from 'discord.js';
import type { LocaleKey } from '../i18n';
import UserConfigs from '../models/userconfigs';
import type { AcceptedTwitterConverterKey } from '../systems/converters/pureet';
import type { AnyRequest } from '../types/commands';

export type UserCache = {
	language: LocaleKey;
	pixivConverter: 'phixiv' | '';
	twitterPrefix: AcceptedTwitterConverterKey | '';
	banned: boolean;
};

export type UserCacheResolvable = AnyRequest | Interaction | User | GuildMember | string;

const userCache = new Map<string, UserCache>();

/**
 * @description
 * Guarda una ID con caché de usuario para uso posterior frecuente
 */
export async function cacheUser(user: UserCacheResolvable) {
	const userId = resolveUserCacheId(user);
	if (!userId) throw ReferenceError('Se esperaba una ID de usuario');

	const userQuery = { userId };
	let userConfigs = await UserConfigs.findOne(userQuery);

	if (!userConfigs) {
		userConfigs = new UserConfigs(userQuery);
		await userConfigs.save();
	}

	return userCache.set(userId, {
		language: userConfigs.language,
		pixivConverter: userConfigs.pixivConverter || '',
		twitterPrefix: userConfigs.twitterPrefix || '',
		banned: userConfigs.banned,
	});
}

/**
 * @description
 * Sobreescribe una ID en caché de usuario para uso posterior frecuente
 */
export async function recacheUser(user: UserCacheResolvable) {
	return cacheUser(user);
}

/**
 * @description
 * Devuelve los datos vinculados a la ID de usuario cacheada.
 * Si la ID no está cacheada, se realiza una llamada a la base de datos, se cachea el usuario y se devuelve lo obtenido
 */
export async function fetchUserCache(user: UserCacheResolvable): Promise<UserCache> {
	const userId = resolveUserCacheId(user);
	if (!userId) throw ReferenceError('Se esperaba una ID de usuario al recolectar caché');

	if (!userCache.has(userId)) await cacheUser(userId);

	return userCache.get(userId);
}

export function resolveUserCacheId(data: UserCacheResolvable) {
	if (typeof data === 'string') return data;

	if ('member' in data) return data.member.user.id;

	return data.id;
}
