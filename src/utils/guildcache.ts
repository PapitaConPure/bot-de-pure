import type { Guild, GuildMember, Interaction } from 'discord.js';
import type { LocaleKey } from '@/i18n';
import GuildConfigModel from '@/models/guildconfigs';
import type { AnyRequest } from '@/types/commands';

export interface GuildCache {
	locale: LocaleKey;
}

export type GuildCacheResolvable = AnyRequest | Interaction | GuildMember | Guild | string;

/**Stores frequently-used configuration and metadata associated to specific guilds.*/
const cachedGuilds = new Map<string, GuildCache>();

/**
 * @description
 * Stores frequently-used configuration and metadata associated to a guild.
 */
export async function cacheGuild(guild: GuildCacheResolvable): Promise<GuildCache> {
	const guildId = resolveGuildCacheId(guild);
	if (!guildId) throw new ReferenceError('Se esperaba una ID de servidor');

	const guildQuery = { guildId };
	let guildConfigs = await GuildConfigModel.findOne(guildQuery);

	if (!guildConfigs) {
		guildConfigs = new GuildConfigModel(guildQuery);
		await guildConfigs.save();
	}

	const guildCache: GuildCache = {
		locale: guildConfigs.locale,
	};

	cachedGuilds.set(guildId, guildCache);

	return guildCache;
}

/**
 * @description
 * Refreshes a guild's cache ID.
 * @returns The refreshed {@link GuildCache}.
 */
export async function recacheGuild(guild: GuildCacheResolvable): Promise<GuildCache> {
	return cacheGuild(guild);
}

/**
 * @description
 * Obtains frequently-used configuration and metadata associated to a guild.
 * If the guild is not cached, a database query is performed in order to cache it.
 * @returns The obtained {@link GuildCache}.
 */
export async function fetchGuildCache(guild: GuildCacheResolvable): Promise<GuildCache> {
	const guildId = resolveGuildCacheId(guild);
	if (!guildId) throw new ReferenceError('Guild ID expected.');

	const found = cachedGuilds.get(guildId);

	if (found == null) return cacheGuild(guildId);

	return found;
}

/**
 * @description
 * Attempts to resolve supplied data into a key of the guilds cache store.
 * @returns The ID (or cache key) of the guild that was found to be associated to the supplied data.
 */
function resolveGuildCacheId(data: GuildCacheResolvable): string | undefined {
	if (typeof data === 'string') return data;

	if ('guild' in data) {
		if (!data.guild) throw new Error('Malformed data.');

		return data.guild.id;
	}

	return data.id;
}
