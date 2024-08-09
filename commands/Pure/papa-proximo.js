const { modifyPresence } = require('../../presence.js');
const { CommandTags, CommandManager } = require('../Commons/commands');

const flags = new CommandTags().add('PAPA');
const command = new CommandManager('papa-próximo', flags)
	.setAliases('papa-proximo')
	.setDescription('...')
	.setExecution(async request => {
		return Promise.all([
			modifyPresence(request.client),
			request.react('✅'),
		])
	});

module.exports = command;