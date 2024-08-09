const { randRange } = require('../../func.js');
const { CommandTags, CommandManager } = require('../Commons/commands');

const phrases = [
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

const flags = new CommandTags().add('COMMON');
const command = new CommandManager('rakkidei', flags)
	.setAliases('rakki', 'tenshi')
	.setBriefDescription('Comando de trompada de Rakkidei')
	.setLongDescription(
		'Comando de trompada de Rakkidei',
		'[<:twitter:919403803114094682> Twitter](https://twitter.com/rakkidei)\n[<:pixiv:919403803126661120> pixiv](https://www.pixiv.net/users/58442175)',
	)
	.setExecution(async function (request) {
		return request.reply({
			content: phrases[randRange(0, phrases.length)],
			files: [tenshiurl],
		});
	});

module.exports = command;