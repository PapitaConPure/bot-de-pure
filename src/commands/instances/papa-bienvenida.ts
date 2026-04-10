import { sendWelcomeMessage } from '@/func';
import { CommandTags, Command } from '../commons';

const tags = new CommandTags().add('PAPA');

const command = new Command('papa-bienvenida', tags)
	.setAliases('papa-welcome')
	.setDescription('Para simular una bienvenida.')
	.setExecution(async message => {
		return sendWelcomeMessage(message.member);
	});

export default command;
