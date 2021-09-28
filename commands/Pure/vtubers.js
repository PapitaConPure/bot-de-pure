const { engines } = require('../../localdata/booruprops.js'); //Variables globales
const { searchImage, options, callx } = require('./buscar.js');

module.exports = {
	name: 'vtubers',
	aliases: [
        'vtuber', 'vt'
    ],
	brief: 'Muestra imágenes de vtubers',
    desc: 'Muestra imágenes de vtubers de cualquier agencia o independientes.\n' +
		'Por defecto, las imágenes se buscan con Gelbooru.\n' +
		'Si lo deseas, puedes usar otro `--motor` de esta lista:\n' +
		'```\n' +
		`${engines.map(e => `${e.charAt(0).toUpperCase()}${e.slice(1)}`).join(', ')}\n` +
		'```\n' +
		'**Nota:** en canales NSFW, los resultados serán, respectivamente, NSFW\n' +
		'**Nota 2:** no todos los motores funcionan y con algunos no habrá búsqueda personalizada',
    flags: [
        'common'
    ],
    options: options,
	callx: callx,
	
	execute: async(message, args) => await searchImage(message, args, { cmdtag: 'virtual_youtuber', sfwtitle: 'Vtubers uwu', nsfwtitle: 'Vtubas O//w//O' })
};