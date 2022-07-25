const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

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
	.setExperimental(true)
	.setExecution(async (request, args, isSlash) => {
		request.reply('a');
	});

module.exports = command;