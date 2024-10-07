const { options } = require('./buscar.js');
const { CommandTags, CommandManager } = require('../Commons/commands');
const { searchAndReplyWithPost } = require('../../systems/booru/boorusend.js');

const flags = new CommandTags().add('COMMON');
const command = new CommandManager('vtubers', flags)
	.setAliases('vtuber', 'vt')
	.setBriefDescription('Muestra imágenes de vtubers')
	.setLongDescription(
		'Muestra imágenes de vtubers.',
		'**Nota:** en canales NSFW, los resultados serán NSFW',
	)
	.setOptions(options)
	.setExecution((request, args, isSlash) => searchAndReplyWithPost(request, args, isSlash, options, { cmdtag: 'virtual_youtuber', sfwtitle: 'Vtubers', nsfwtitle: 'Vtubas' }));

module.exports = command;
