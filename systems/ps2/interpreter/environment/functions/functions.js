const { utilFunctions } = require('./utils');
const { kindFunctions } = require('./kinds');
const { discordFunctions } = require('./discord');

/**@type {Array<{ id: String, fn: import('../../values').NativeFunction }>}*/
const NativeFunctions = [
	...utilFunctions,
	...kindFunctions,
	...discordFunctions,
];

module.exports = {
	NativeFunctions,
};
