const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const flags = new CommandMetaFlagsManager().add('PAPA');
const command = new CommandManager('papa-anunciar', flags)
	.setAliases('papa-matar')
	.setDescription('Termina este proceso de Bot de Puré')
	.setExecution(async request => {
		await request.reply({ content: '💬 Finalizando proceso...' });
		process.exit(0);
	});

module.exports = command;