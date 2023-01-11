const { randRange } = require('../../func.js');
const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const phrase = [
	'Ahora sí vení que te saco la cresta',
	'Vení que te dejo la cagá en la cara',
	'Ah mira que bacán. Vení que te rajo',
	'Aweonao recontraculiao ijoelamaraca',
	'Avíspate po\'',
	'Te voy a pegar el meo pape, maraco ctm',
	'Chúpalo gil qliao',
	'Te tiraste',
	'Te rifaste',
	'Cagaste',
];
const tenshiurl = 'https://i.imgur.com/eMyvXiC.png';

const flags = new CommandMetaFlagsManager().add('COMMON');
const command = new CommandManager('rakkidei', flags)
	.setAliases('rakki', 'tenshi')
	.setBriefDescription('Comando de trompada de Rakkidei')
	.setLongDescription(
		'Comando de trompada de Rakkidei',
		'[🐦 Twitter](https://twitter.com/rakkidei)\n[🇵 pixiv](https://www.pixiv.net/users/58442175)',
	)
	.setReply({
		content: phrase[randRange(0, phrase.length)],
		files: [tenshiurl],
	});

module.exports = command;