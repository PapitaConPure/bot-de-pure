import { Guild, type GuildResolvable, Invite, InviteGuild } from 'discord.js';
import { ClientNotFoundError, client } from '@/core/client';
import Logger from '@/utils/logs';

const { debug, info, error } = Logger('WARN', 'GRK');

const fetchRegistry: {
	members: Map<string, Date>;
} = {
	members: new Map(),
};

/**@description Refresca la caché de miembros del servidor indicado, si es que no ha sido refrescada en un tiempo.*/
export async function fetchGuildMembers(
	target: GuildResolvable,
	fetchOptions: { withPresences?: boolean } = {},
) {
	const { withPresences = false } = fetchOptions;
	const guild = await resolveGuild(target);
	const guildId = guild.id;
	const now = new Date();

	debug(`Attempting to fetch all guild members for ${guildId}`);

	try {
		const previousEntry = fetchRegistry.members.get(guildId);
		if (previousEntry && Math.abs(+previousEntry - +now) <= 60e3 * 30) {
			debug(`Valid caché hit for ${guildId}. Cannot request`);
			return;
		}

		debug(`Caché miss for ${guildId}. Attempting request`);
		await guild.members.fetch({ withPresences });
		fetchRegistry.members.set(guildId, now);
		info(`All members of ${guildId} have been fetched`);
	} catch (err) {
		error(err);
	}
}

export async function fetchAllGuildMembers(): Promise<void> {
	info('Attempting to fetch all guild members on all guilds...');

	if (!client) throw new ClientNotFoundError();

	try {
		await client.guilds.fetch();
		await Promise.all(
			client.guilds.cache.map((guild) => fetchGuildMembers(guild, { withPresences: true })),
		);
	} catch (err) {
		error(err);
	}
}

/**@description Resuelve un {@link GuildResolvable}.*/
async function resolveGuild(data: GuildResolvable): Promise<Guild> {
	if (!client) throw new ClientNotFoundError();

	if (typeof data === 'string') return client.guilds.fetch(data);

	if (data instanceof Guild) return data;

	if (data instanceof Invite) {
		if (data.guild == null || data.guild instanceof InviteGuild)
			throw new TypeError(undefined, { cause: data });

		return data.guild;
	}

	return data.guild;
}
