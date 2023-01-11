const { randRange }  = require('../../func.js');
const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const h = [
	':heart:',
	':orange_heart:',
	':yellow_heart:',
	':green_heart:',
	':blue_heart:',
	':purple_heart:',
	':brown_heart:',
	':white_heart:',
	':heartpulse:'
];

const flags = new CommandMetaFlagsManager().add('MEME');
const command = new CommandManager('mabel', flags)
	.setAliases('merraz', 'mármol', 'gay', 'pride')
	.setDescription('Comando de inclusión de Mabel')
	.setExecution(async request => {
		request.reply({ content: `:gay_pride_flag: ${Array(7).fill``.map(() => h[randRange(0, h.length)]).join(' ')} :transgender_flag:` });
	});

module.exports = command;