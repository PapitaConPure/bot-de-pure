const { options } = require('./buscar.js');
const { CommandTags, Command } = require('../Commons/commands');
const { searchAndReplyWithPost } = require('../../systems/booru/boorusend.js');

const flags = new CommandTags().add(
	'COMMON',
	'MEME',
);
const command = new Command('megumin', flags)
	.setAliases(
		'megu', 'explosión', 'bakuretsu', 'waifu',
		'bestgirl', 'explosion',
	)
	.setBriefDescription('Muestra imágenes de Megumin, la esposa de Papita')
	.setLongDescription(
		'Muestra imágenes de Megumin.',
		'❤️🤎🧡💛💚💙💜🤍💟♥️❣️💕💞💓💗💖💝',
	)
	.setOptions(options)
	.setExecution((request, args) => searchAndReplyWithPost(request, args, { cmdtag: 'megumin', sfwtitle: 'MEGUMIN 🥹', nsfwtitle: 'MEGUMIN 🫣' }));

module.exports = command;
