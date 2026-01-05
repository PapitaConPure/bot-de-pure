const { readdirSync } = require('fs');
const commandOptions = require('./cmdOpts');
const commandFlags = require('./cmdTags');
const commandBuilder = require('./cmdBuilder');

const commandFilenames = readdirSync('./commands/Instances').filter(file => file.endsWith('.js'));

module.exports = {
    ...commandOptions,
    ...commandFlags,
    ...commandBuilder,
    commandFilenames,
};
