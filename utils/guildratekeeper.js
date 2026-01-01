const Logger = require('../utils/logs');
const { debug, info, error } = Logger('WARN', 'GRK');

/**
 * @type {{
 *      members: Map<string, Date>,
 * }}
 */
const fetchRegistry = {
    members: new Map()
};

/**
 * @type {{
 *      client?: import('discord.js').Client,
 * }}
 */
const GuildRateKeeper = {
    client: null,
};

/**
 * @typedef {Object} GuildRateKeeperSetupOptions
 * @property {import('discord.js').Client} client 
 * 
 * @param {GuildRateKeeperSetupOptions} setupOptions
 */
function setupGuildRateKeeper({ client }) {
    GuildRateKeeper.client = client;
}

/**
 * @typedef {import('discord.js').Guild | string} GuildResolvable
 */

/**
 * Refresca la caché de miembros del servidor indicado, si es que no ha sido refrescada en un tiempo
 * @param {GuildResolvable} target 
 * @param {{ withPresences?: boolean }} [fetchOptions]
 */
async function fetchGuildMembers(target, fetchOptions = {}) {
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

async function fetchAllGuildMembers() {
    info('Attempting to fetch all guild members on all guilds...');

    try {
        await GuildRateKeeper.client.guilds.fetch();
        return Promise.all(GuildRateKeeper.client.guilds.cache.map(guild => fetchGuildMembers(guild, { withPresences: true })));
    } catch(err) {
        error(err);
    }
}

/**
 * Resuelve un {@link GuildResolvable}
 * @param {GuildResolvable} data 
 */
async function resolveGuild(data) {
    if(typeof data === 'string')
        return GuildRateKeeper.client.guilds.fetch(data);

    return data;
}

module.exports = {
    setupGuildRateKeeper,
    fetchGuildMembers,
    fetchAllGuildMembers,
};
