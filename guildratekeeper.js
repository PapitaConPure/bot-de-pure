const Logger = require('./logs');
const { debug, info } = Logger('DEBUG', 'GRK');

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
const rateKeeper = {
    client: null,
};

/**
 * 
 * @param {import('discord.js').Client} client 
 */
function setupGuildRateKeeper(client) {
    rateKeeper.client = client;
    setInterval(tickRateKeeper, 60e3);
}

function tickRateKeeper() {
    debug('Ticked registry');

}

/**
 * @typedef {import('discord.js').Guild | string} GuildResolvable
 */

/**
 * 
 * @param {GuildResolvable} target 
 * @param {{ withPresences?: boolean }} [fetchOptions]
 */
async function fetchGuildMembers(target, fetchOptions = {}) {
    const { withPresences = false } = fetchOptions;
    const guild = await resolveGuild(target);
    const guildId = guild.id;
    const now = new Date();

    debug(`Attempting to fetch all guild members for ${guildId}`);
    
    const previousEntry = fetchRegistry.members.get(guildId);
    if(previousEntry && Math.abs(+previousEntry - +now) <= 60e3 * 30) {
        debug(`Valid caché hit for ${guildId}. Cannot request`);
        return;
    }
    
    debug(`Caché miss for ${guildId}. Attempting request`);
    guild.members.fetch({ withPresences });
    fetchRegistry.members.set(guildId, now);
    info(`All members of ${guildId} have been fetched`);
}

/**
 * @param {GuildResolvable} data 
 */
async function resolveGuild(data) {
    if(typeof data === 'string')
        return rateKeeper.client.guilds.fetch(data);

    return data;
}

module.exports = {
    setupGuildRateKeeper,
    fetchGuildMembers,
};
