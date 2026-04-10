import { searchAndReplyWithPost } from '@/systems/booru/boorusend.js';
import { Command, CommandTags } from '../commons';
import { searchCommandOptions } from './buscar';

const tags = new CommandTags().add('COMMON', 'MEME');

const command = new Command('megumin', tags)
	.setAliases('megu', 'explosión', 'bakuretsu', 'waifu', 'bestgirl', 'explosion')
	.setBriefDescription('Muestra imágenes de Megumin, la esposa de Papita')
	.setLongDescription('Muestra imágenes de Megumin.', '❤️🤎🧡💛💚💙💜🤍💟♥️❣️💕💞💓💗💖💝')
	.setOptions(searchCommandOptions)
	.setExecution((request, args) =>
		searchAndReplyWithPost(request, args, {
			cmdtag: 'megumin',
			sfwtitle: 'MEGUMIN 🥹',
			nsfwtitle: 'MEGUMIN 🫣',
		}),
	);

export default command;
