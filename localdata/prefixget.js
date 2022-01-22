const { p_pure, p_drmk } = require('./config.json');

module.exports = {
    /**
     * @param {String} gid La id del servidor
     * @typedef {{raw: String, regex: RegExp}} PrefixPair
     * @returns {PrefixPair} Un objeto conteniendo el texto crudo y RegExp del prefijo
     */
    p_pure: (gid = '0') => p_pure[gid] || p_pure['0'],
    /**
     * @param {String} gid La id del servidor
     * @typedef {{raw: String, regex: RegExp}} PrefixPair
     * @returns {PrefixPair} Un objeto conteniendo el texto crudo y RegExp del prefijo
     */
    p_drmk: (gid = '0') => p_drmk[gid] || p_drmk['0']
}