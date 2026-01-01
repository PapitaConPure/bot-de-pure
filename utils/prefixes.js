const { p_pure: prefixes } = require('../data/config.json');

/**
 * @typedef {{raw: String, regex: RegExp}} PrefixPair
 */

/**@type {PrefixPair}*/
const slashPrefixPair = { raw: '/', regex: /\//i };

/**
 * @param {import('../commands/Commons/typings').ComplexCommandRequest | string} context Contexto de servidor o request
 * @returns {PrefixPair} Un objeto conteniendo el texto crudo y RegExp del prefijo
 */
function p_pure(context = '0') {
    if(typeof context === 'string')
        return prefixes[context] || prefixes['0'];
    
    return context.isInteraction ? slashPrefixPair : p_pure(context.guildId);
}
module.exports = {
    slashPrefixPair,
    p_pure,
}
