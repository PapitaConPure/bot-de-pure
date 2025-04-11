const { modifyPresence } = require('../../presence.js');
const { CommandTags, CommandManager } = require('../Commons/commands');

const flags = new CommandTags().add('PAPA');
const command = new CommandManager('papa-próximo', flags)
	.setAliases('papa-proximo')
	.setDescription('...')
	.setExecution(async request => {
		if(request.isInteraction)
			return request.reply({ content: '❌ Este comando solo puede ser llamado por mensaje' });

		const message = request.inferAsMessage();

		return Promise.all([
			modifyPresence(message.client),
			message.react('✅'),
		])
	});

module.exports = command;
