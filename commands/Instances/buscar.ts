import { CommandOptions, CommandTags, Command } from '../Commons';
import { searchAndReplyWithPost } from '../../systems/booru/boorusend';

export const searchCommandOptions = new CommandOptions()
	.addParam('etiquetas', 'TEXT',  'para filtrar resultados de búsqueda', { optional: true })
	.addFlag([], ['bomba', 'bomb'], 'para mostrar una cierta cantidad de imágenes', { name: 'cnt', type: 'NUMBER' });

const flags = new CommandTags().add('COMMON');

const command = new Command('buscar', flags)
	.setAliases(
		'imágenes', 'imagenes',
		'search', 'image',
		'img',
	)
	.setBriefDescription('Muestra imágenes desde Gelbooru')
	.setLongDescription(
		'Muestra imágenes de cualquier cosa. La búsqueda se realiza con Gelbooru.',
		'**Nota:** en canales NSFW, los resultados serán NSFW',
	)
	.setOptions(searchCommandOptions)
	.setExecution((request, args) => searchAndReplyWithPost(request, args));

export default command;
