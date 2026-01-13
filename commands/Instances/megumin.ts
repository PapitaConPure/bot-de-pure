import { CommandTags, Command } from '../Commons/';
import { searchAndReplyWithPost } from '../../systems/booru/boorusend.js';
import { options } from './buscar.js';

const tags = new CommandTags().add(
	'COMMON',
	'MEME',
);

const command = new Command('megumin', tags)
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

export default command;
