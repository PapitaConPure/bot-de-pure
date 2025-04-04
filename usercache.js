const UserConfigs = require("./localdata/models/userconfigs");
const globalConfigs = require('./localdata/config.json');

/**
 * @typedef {{ language: import("./internationalization").LocaleKey, pixivConverter: 'phixiv' | 'webhook' | '', twitterPrefix: 'vx' | 'fx' | '', banned: Boolean }} UserCache
 * @type {Map<String, UserCache>}
 */
const userCache = new Map();

/**
 * Guarda una ID con caché de usuario para uso posterior frecuente
 * @param {String} userId 
 */
async function cacheUser(userId) {
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
 * @param {String} userId 
 */
async function recacheUser(userId) {
    return cacheUser(userId);
}

/**
 * Devuelve los datos vinculados a la ID de usuario cacheada.
 * Si la ID no está cacheada, se realiza una llamada a la base de datos, se cachea el usuario y se devuelve lo obtenido
 * @param {String} userId 
 * @returns {Promise<UserCache>}
 */
async function fetchUserCache(userId) {
    if(!userId) throw ReferenceError('Se esperaba una ID de usuario al recolectar caché');
    if(!userCache.has(userId))
        await cacheUser(userId);
    
    return userCache.get(userId);
}

module.exports = {
    cacheUser,
    recacheUser,
    fetchUserCache,
};
