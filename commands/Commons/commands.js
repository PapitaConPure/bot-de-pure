const commandOptions = require('./cmdOpts');
const commandFlags = require('./cmdTags');
const commandBuilder = require('./cmdBuilder');

module.exports = {
    ...commandOptions,
    ...commandFlags,
    ...commandBuilder,
};