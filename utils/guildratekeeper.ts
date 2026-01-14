const Logger = require('../utils/logs').default;
const { debug, info, error } = Logger('WARN', 'GRK');

const fetchRegistry: {
    members: Map<string, Date>;
} = {
    members: new Map()
};

const GuildRateKeeper: {
    client?: import('discord.js').Client;
} = {
    client: null,
};

interface GuildRateKeeperSetupOptions {
    client: import('discord.js').Client;
}

export function setupGuildRateKeeper({ client }: GuildRateKeeperSetupOptions) {
    GuildRateKeeper.client = client;
}

type GuildResolvable = import('discord.js').Guild | string;

/**@description Refresca la caché de miembros del servidor indicado, si es que no ha sido refrescada en un tiempo.*/
export async function fetchGuildMembers(target: GuildResolvable, fetchOptions: { withPresences?: boolean; } = {}) {
    const { withPresences = false } = fetchOptions;
    const guild = await resolveGuild(target);
    const guildId = guild.id;
    const now = new Date();

    debug(`Attempting to fetch all guild members for ${guildId}`);
    
    try {
        const previousEntry = fetchRegistry.members.get(guildId);
        if(previousEntry && Math.abs(+previousEntry - +now) <= 60e3 * 30) {
            debug(`Valid caché hit for ${guildId}. Cannot request`);
            return;
        }
        
        debug(`Caché miss for ${guildId}. Attempting request`);
        await guild.members.fetch({ withPresences });
        fetchRegistry.members.set(guildId, now);
        info(`All members of ${guildId} have been fetched`);
    } catch(err) {
        error(err);
    }
}

export async function fetchAllGuildMembers(): Promise<void[]> {
    info('Attempting to fetch all guild members on all guilds...');

    try {
        await GuildRateKeeper.client.guilds.fetch();
        return Promise.all(GuildRateKeeper.client.guilds.cache.map(guild => fetchGuildMembers(guild, { withPresences: true })));
    } catch(err) {
        error(err);
    }
}

/**@description Resuelve un {@link GuildResolvable}.*/
async function resolveGuild(data: GuildResolvable) {
    if(typeof data === 'string')
        return GuildRateKeeper.client.guilds.fetch(data);

    return data;
}
