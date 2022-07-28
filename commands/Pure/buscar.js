const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require("../Commons/commands");
const { searchAndReplyWithPost } = require('../../systems/boorusend.js');

const options = new CommandOptionsManager()
	.addParam('etiquetas', 'TEXT',  'para filtrar resultados de búsqueda', { optional: true })
	.addFlag([], ['bomba', 'bomb'], 'para mostrar una cierta cantidad de imágenes', { name: 'cnt', type: 'NUMBER' });
const flags = new CommandMetaFlagsManager().add('COMMON');
const command = new CommandManager('buscar', flags)
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
	.setOptions(options)
	.setExecution((request, args, isSlash) => searchAndReplyWithPost(request, args, isSlash, options));

module.exports = command;