const { modifyPresence } = require('../../presence.js');
const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const flags = new CommandMetaFlagsManager().add('PAPA');
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