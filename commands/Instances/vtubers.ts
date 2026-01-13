import { CommandTags, Command } from '../Commons/';
import { searchAndReplyWithPost } from '../../systems/booru/boorusend';
import { searchCommandOptions } from './buscar';

const tags = new CommandTags().add('COMMON');

const command = new Command('vtubers', tags)
	.setAliases('vtuber', 'vt')
	.setBriefDescription('Muestra imágenes de vtubers')
	.setLongDescription(
		'Muestra imágenes de vtubers.',
		'**Nota:** en canales NSFW, los resultados serán NSFW',
	)
	.setOptions(searchCommandOptions)
	.setExecution((request, args) => searchAndReplyWithPost(request, args, { cmdtag: 'virtual_youtuber', sfwtitle: 'Vtubers', nsfwtitle: 'Vtubas' }));

export default command;
