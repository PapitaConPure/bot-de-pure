const { CommandPermissions } = require('../Commons/cmdPerms');
const { CommandMetaFlagsManager, CommandManager, CommandOptionsManager } = require('../Commons/commands');

const perms = new CommandPermissions('ManageGuild');

const options = new CommandOptionsManager()
	.addFlag('c', 'canal', 'para especificar el canal al cuál enviar la bienvenida', { name: 'cn', type: 'CHANNEL' });

const flags = new CommandMetaFlagsManager().add(
	'MOD',
	'MAINTENANCE',
);

const command = new CommandManager('bienvenida', flags)
	.setBriefDescription('Configura una bienvenida para este servidor')
	.setLongDescription([
		'Edita el mensaje de bienvenida para este servidor.',
		'Las bienvenidas se envían en el canal de mensajes de sistema o en el `--canal` que especifiques',
	])
	.setPermissions(perms)
	.setOptions(options)
	.setExecution(async (request) => {
		request.reply('a');
	});

module.exports = command;