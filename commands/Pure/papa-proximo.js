const { modifyPresence } = require('../../systems/presence/presence');
const { CommandTags, Command } = require('../Commons/commands');

const flags = new CommandTags().add('PAPA');
const command = new Command('papa-próximo', flags)
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
