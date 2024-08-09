const UserConfig = require("../../localdata/models/userconfigs");
const { CommandManager, CommandTags, CommandOptions } = require("../Commons/commands");
const { recacheUser } = require("../../usercache");
const { peopleid } = require("../../localdata/config.json");

const options = new CommandOptions()
	.addParam('usuario', 'USER', 'para especificar el usuario a bannear');
const flags = new CommandTags().add('PAPA');
const command = new CommandManager('papa-ban', flags)
	.setAliases('papa-bannear', 'papa-banear')
	.setDescription('Para bannear a un usuario de usar a Bot de Puré')
	.setOptions(options)
	.setExecution(async (request, args) => {
		const user = await options.in(request).fetchParam(args, 'usuario', true);

		if(!user || user.id === peopleid.papita)
			return request.reply({ content: '⚠️ Usuario inválido' });

		const userConfig = (await UserConfig.findOne({ userId: user.id })) || new UserConfig({ userId: user.id });
		userConfig.banned = !userConfig.banned;
		await userConfig.save().then(_ => recacheUser(user.id));
		
		return request.reply({ content: userConfig.banned ? '✅ Usuario banneado' : '✅ Usuario desbanneado' });
	});

module.exports = command;