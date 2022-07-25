const commandOptions = require('./cmdOpts');
const commandFlags = require('./cmdFlags');
const commandBuilder = require('./cmdBuilder');

module.exports = {
    ...commandOptions,
    ...commandFlags,
    ...commandBuilder,
};