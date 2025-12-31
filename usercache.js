const UserConfigs = require("./localdata/models/userconfigs");
const globalConfigs = require('./localdata/config.json');

/**
 * @typedef {{
 * 	language: import("./internationalization").LocaleKey,
 * 	pixivConverter: 'phixiv' | '',
 * 	twitterPrefix: import("./systems/agents/pureet").AcceptedTwitterConverterKey | '',
 * 	banned: Boolean
 * }} UserCache
 * @typedef {import('./commands/Commons/typings.js').AnyRequest
 *         | import('discord.js').Interaction
 *         | import('discord.js').User
 *         | import('discord.js').GuildMember
 *         | string
 * } UserCacheResolvable
 */

/**@type {Map<String, UserCache>}*/
const userCache = new Map();

/**
 * Guarda una ID con caché de usuario para uso posterior frecuente
 * @param {UserCacheResolvable} user
 */
async function cacheUser(user) {
	const userId = resolveUserCacheId(user);
	if(!userId) throw ReferenceError('Se esperaba una ID de usuario');
	
	const userQuery = { userId };
	let userConfigs;
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
 * Sobreescribe una ID en caché de usuario para uso posterior frecuente
 * @param {UserCacheResolvable} user
 */
async function recacheUser(user) {
	return cacheUser(user);
}

/**
 * Devuelve los datos vinculados a la ID de usuario cacheada.
 * Si la ID no está cacheada, se realiza una llamada a la base de datos, se cachea el usuario y se devuelve lo obtenido
 * @param {UserCacheResolvable} user
 * @returns {Promise<UserCache>}
 */
async function fetchUserCache(user) {
	const userId = resolveUserCacheId(user);
	if(!userId) throw ReferenceError('Se esperaba una ID de usuario al recolectar caché');

	if(!userCache.has(userId))
		await cacheUser(userId);
	
	return userCache.get(userId);
}

/**@param {UserCacheResolvable} data*/
function resolveUserCacheId(data) {
	if(typeof data === 'string')
		return data;

	if('member' in data)
		return data.member.user.id;

	return data.id;
}

module.exports = {
	cacheUser,
	recacheUser,
	fetchUserCache,
	resolveUserCacheId,
};
