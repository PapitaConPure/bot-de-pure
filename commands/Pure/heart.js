const { options } = require('./buscar.js');
const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');
const { searchAndReplyWithPost } = require('../../systems/boorusend.js');

const flags = new CommandMetaFlagsManager().add(
	'COMMON',
	'MEME',
	'OUTDATED',
);
const command = new CommandManager('heart', flags)
	.setAliases('holo')
	.setBriefDescription('Muestra imágenes de Holo, en rendimiento a Heartnix')
	.setLongDescription(
		'Muestra imágenes de Holo, en rendimiento a Heartnix.',
		'**Nota:** ni siquiera intentes buscarla en canales NSFW',
	)
	.setOptions(options)
	.setExecution((request, args, isSlash) => searchAndReplyWithPost(request, args, isSlash, options, { cmdtag: 'holo', sfwtitle: 'HOLO OWO' }));

module.exports = command;