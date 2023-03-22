const { p_pure } = require('../config.json');

/**
 * @typedef {{raw: String, regex: RegExp}} PrefixPair
 */

module.exports = {
    /**
     * @param {String} gid La id del servidor
     * @returns {PrefixPair} Un objeto conteniendo el texto crudo y RegExp del prefijo
     */
    p_pure: (gid = '0') => p_pure[gid] || p_pure['0'],
}