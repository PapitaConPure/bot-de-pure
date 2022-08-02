const {  } = require('discord.js'); //Integrar discord.js
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require("../Commons/commands");

const options = new CommandOptionsManager()
	.addParam('comando', 'TEXT', 'para especificar el comando a configurar');
const flags = new CommandMetaFlagsManager().add(
	'COMMON',
	'MAINTENANCE',
);
const command = new CommandManager('config', flags)
	.setAliases('configs')
	.setLongDescription('Para configurar Preferencias de usuario')
	.setOptions(options)
	.setExecution(async (request, args, isSlash) => {
		return request.reply({ content: 'ola' });
	});

module.exports = command;