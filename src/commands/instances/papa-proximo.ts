import { modifyPresence } from '@/systems/presence/presence';
import { Command, CommandTags } from '../commons';

const tags = new CommandTags().add('PAPA');

const command = new Command('papa-próximo', tags)
	.setAliases('papa-proximo')
	.setDescription('...')
	.setExecution(async (request) => {
		if (request.isInteraction)
			return request.reply({ content: '❌ Este comando solo puede ser llamado por mensaje' });

		const message = request.inferAsMessage();

		return Promise.all([modifyPresence(message.client), message.react('✅')]);
	});

export default command;
