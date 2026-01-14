import UserConfig from '../../models/userconfigs';
import { Command, CommandTags, CommandOptions } from '../Commons';
import { recacheUser } from '../../utils/usercache';
import { papita } from '../../data/userIds.json';

const options = new CommandOptions()
	.addParam('usuario', 'USER', 'para especificar el usuario a bannear');

const tags = new CommandTags().add('PAPA');

const command = new Command('papa-ban', tags)
	.setAliases('papa-bannear', 'papa-banear')
	.setDescription('Para bannear a un usuario de usar a Bot de Puré')
	.setOptions(options)
	.setExecution(async (request, args) => {
		const user = await args.getUser('usuario', true);

		if(!user || user.id === papita)
			return request.reply({ content: '⚠️ Usuario inválido' });

		const userConfig = (await UserConfig.findOne({ userId: user.id })) || new UserConfig({ userId: user.id });
		userConfig.banned = !userConfig.banned;
		await userConfig.save().then(() => recacheUser(user.id));
		
		return request.reply({ content: userConfig.banned ? '✅ Usuario banneado' : '✅ Usuario desbanneado' });
	});

export default command;
