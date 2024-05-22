const { options } = require('./buscar.js');
const { CommandTags, CommandManager } = require('../Commons/commands');
const { searchAndReplyWithPost } = require('../../systems/booru/boorusend.js');

const flags = new CommandTags().add(
	'COMMON',
	'MEME',
);
const command = new CommandManager('megumin', flags)
	.setAliases(
		'megu', 'explosión', 'bakuretsu', 'waifu',
		'bestgirl', 'explosion',
	)
	.setBriefDescription('Muestra imágenes de Megumin, la esposa de Papita')
	.setLongDescription(
		'Muestra imágenes de Megumin, también conocida como "La Legítima Esposa de Papita con Puré".',
		'❤️🤎🧡💛💚💙💜🤍💟♥️❣️💕💞💓💗💖💝',
	)
	.setOptions(options)
	.setExecution((request, args, isSlash) => searchAndReplyWithPost(request, args, isSlash, options, { cmdtag: 'megumin', sfwtitle: 'MEGUMIN ÙwÚ', nsfwtitle: 'MEGUMIN Ú//w//Ù' }));

module.exports = command;