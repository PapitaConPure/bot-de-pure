const { options } = require('./buscar.js');
const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');
const { searchAndReplyWithPost } = require('../../systems/boorusend.js');

const flags = new CommandMetaFlagsManager().add('COMMON');
const command = new CommandManager('vtubers', flags)
	.setAliases('vtuber', 'vt')
	.setBriefDescription('Muestra imágenes de vtubers')
	.setLongDescription(
		'Muestra imágenes de vtubers.',
		'**Nota:** en canales NSFW, los resultados serán NSFW',
	)
	.setOptions(options)
	.setExecution((request, args, isSlash) => searchAndReplyWithPost(request, args, isSlash, options, { cmdtag: 'virtual_youtuber', sfwtitle: 'Vtubers uwu', nsfwtitle: 'Vtubas O//w//O' }));

module.exports = command;