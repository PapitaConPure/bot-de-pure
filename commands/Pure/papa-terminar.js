const { CommandTags, Command } = require('../Commons/commands');

const flags = new CommandTags().add('PAPA');
const command = new Command('papa-terminar', flags)
	.setAliases('papa-matar')
	.setDescription('Termina este proceso de Bot de Puré')
	.setExecution(async request => {
		await request.reply({ content: '💬 Finalizando proceso...' });
		process.exit(0);
	});

module.exports = command;
