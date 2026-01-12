import { LocaleKey } from '../i18n';
import UserConfigs, { UserConfigDocument } from '../models/userconfigs';
import globalConfigs from '../data/config.json';

export type UserCache = {
	language: LocaleKey;
	pixivConverter: 'phixiv' | '';
	twitterPrefix: import('../systems/agents/pureet').AcceptedTwitterConverterKey | '';
	banned: Boolean;
};

export type UserCacheResolvable = import('../commands/Commons/typings.js').AnyRequest |
	import('discord.js').Interaction |
	import('discord.js').User |
	import('discord.js').GuildMember |
	string;

const userCache = new Map<string, UserCache>();

/**
 * @description
 * Guarda una ID con caché de usuario para uso posterior frecuente
 */
export async function cacheUser(user: UserCacheResolvable) {
	const userId = resolveUserCacheId(user);
	if(!userId) throw ReferenceError('Se esperaba una ID de usuario');
	
	const userQuery = { userId };
	let userConfigs: UserConfigDocument;
	if(globalConfigs.noDataBase) {
		userConfigs = new UserConfigs(userQuery);
	} else {
		userConfigs = await UserConfigs.findOne(userQuery);
		if(!userConfigs) {
			userConfigs = new UserConfigs(userQuery);
			await userConfigs.save();
		}
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
	if(!userId) throw ReferenceError('Se esperaba una ID de usuario al recolectar caché');

	if(!userCache.has(userId))
		await cacheUser(userId);
	
	return userCache.get(userId);
}

export function resolveUserCacheId(data: UserCacheResolvable) {
	if(typeof data === 'string')
		return data;

	if('member' in data)
		return data.member.user.id;

	return data.id;
}
