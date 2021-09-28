const { p_pure, p_drmk } = require('./config.json');

module.exports = {
    p_pure: (gid = '0') => p_pure[gid] || p_pure,
    p_drmk: (gid = '0') => p_drmk[gid] || p_drmk
}