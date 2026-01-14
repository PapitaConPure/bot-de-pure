import { dibujarBienvenida } from '../../func';
import { CommandTags, Command } from '../Commons/';

const tags = new CommandTags().add('PAPA');

const command = new Command('papa-bienvenida', tags)
	.setAliases('papa-welcome')
	.setDescription('Para simular una bienvenida.')
	.setExecution(async message => {
		return dibujarBienvenida(message.member, true);
	});

export default command;
