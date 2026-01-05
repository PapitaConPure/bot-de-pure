const { options } = require('./buscar.js');
const { CommandTags, Command } = require('../Commons/commands.js');
const { searchAndReplyWithPost } = require('../../systems/booru/boorusend.js');

const flags = new CommandTags().add('COMMON');
const command = new Command('touhou', flags)
	.setAliases(
		'imagentouhou', 'imgtouhou', 'tohas', 'touhas', 'tojas', 'tohitas', 'touhitas', 'tojitas',
        'touhoupic', '2hupic',
		'2hu', '2ho',
	)
	.setBriefDescription('Muestra imágenes de Touhou')
	.setLongDescription(
		'Muestra imágenes de Touhou.',
		'**Nota:** en canales NSFW, los resultados serán NSFW',
	)
	.setOptions(options)
	.setExecution((request, args) => searchAndReplyWithPost(request, args, { cmdtag: 'touhou', sfwtitle: 'Tohas', nsfwtitle: 'Tohitas' }));

module.exports = command;
