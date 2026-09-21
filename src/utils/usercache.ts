import type { GuildMember, Interaction, User } from 'discord.js';
import type { LocaleKey } from '@/i18n';
import UserConfigModel from '@/models/userconfigs';
import type {
	AcceptedGelbooruConverterKey,
	AcceptedInstagramConverterKey,
	AcceptedPixivConverterKey,
	AcceptedTwitterConverterKey,
} from '@/systems/converters/instances';
import type { AnyRequest } from '@/types/commands';

export interface UserCache {
	language: LocaleKey;
	pixivConverter: AcceptedPixivConverterKey | '';
	twitterPrefix: AcceptedTwitterConverterKey | '';
	gelbooruConverter: AcceptedGelbooruConverterKey | '';
	instagramConverter: AcceptedInstagramConverterKey | '';
	banned: boolean;
}

export type UserCacheResolvable = AnyRequest | Interaction | User | GuildMember | string;

/**Stores frequently-used configuration and metadata associated to specific users.*/
const cachedUsers = new Map<string, UserCache>();

/**
 * @description
 * Stores frequently-used configuration and metadata associated to a user.
 */
export async function cacheUser(user: UserCacheResolvable): Promise<UserCache> {
	const userId = resolveUserCacheId(user);
	if (!userId) throw new ReferenceError('Se esperaba una ID de usuario');

	const userQuery = { userId };
	let userConfigs = await UserConfigModel.findOne(userQuery);

	if (!userConfigs) {
		userConfigs = new UserConfigModel(userQuery);
		await userConfigs.save();
	}

	const userCache: UserCache = {
		language: userConfigs.language,
		pixivConverter: userConfigs.pixivConverter || '',
		twitterPrefix: userConfigs.twitterPrefix || '',
		gelbooruConverter: userConfigs.gelbooruConverter || '',
		instagramConverter: userConfigs.instagramConverter || '',
		banned: userConfigs.banned ?? false,
	};

	cachedUsers.set(userId, userCache);

	return userCache;
}

/**
 * @description
 * Refreshes a user's cache ID.
 * @returns The refreshed {@link UserCache}.
 */
export async function recacheUser(user: UserCacheResolvable): Promise<UserCache> {
	return cacheUser(user);
}

/**
 * @description
 * Obtains frequently-used configuration and metadata associated to a user.
 * If the user is not cached, a database query is performed in order to cache it.
 * @returns The obtained {@link UserCache}.
 */
export async function fetchUserCache(user: UserCacheResolvable): Promise<UserCache> {
	const userId = resolveUserCacheId(user);
	if (!userId) throw new ReferenceError('User ID expected.');

	const found = cachedUsers.get(userId);

	if (found == null) return cacheUser(userId);

	return found;
}

/**
 * @description
 * Attempts to resolve supplied data into a key of the users cache store.
 * @returns The ID (or cache key) of the user that was found to be associated to the supplied data.
 */
function resolveUserCacheId(data: UserCacheResolvable): string | undefined {
	if (typeof data === 'string') return data;

	if ('member' in data) {
		if (!data.member) throw new Error('Malformed data.');

		return data.member.user.id;
	}

	if ('user' in data) {
		if (!data.user) throw new Error('Malformed data.');

		return data.user.id;
	}

	return data.id;
}
