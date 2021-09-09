const { engines } = require('../../localdata/booruprops.js'); //Variables globales
const { searchImage, options, callx } = require('./buscar.js');

module.exports = {
	name: 'megumin',
	aliases: [
        'megu', 'explosión', 'bakuretsu', 'papiwaifu', 'papawaifu', 'waifu',
		'bestgirl', 'explosion'
    ],
	brief: 'Muestra imágenes de Megumin, la esposa de Papita',
    desc: 'Muestra imágenes de Megumin, también conocida como "La Legítima Esposa de Papita con Puré"\n' +
		'❤️🤎🧡💛💚💙💜🤍💟♥️❣️💕💞💓💗💖💝\n' +
		'Por defecto, las imágenes se buscan con Gelbooru.\n' +
		'Si lo deseas, puedes usar otro `--motor` de esta lista:\n' +
		'```\n' +
		`${engines.map(e => `${e.charAt(0).toUpperCase()}${e.slice(1)}`).join(', ')}\n` +
		'```\n' +
		'**Nota:** no intentes buscarla en canales NSFW, conchetumare :rage:\n' +
		'**Nota 2:** no todos los motores funcionan y con algunos no habrá búsqueda personalizada',
    flags: [
        'common',
		'meme'
    ],
    options: options,
	callx: callx,
	
	execute: async(message, args) => await searchImage(message, args, { cmdtag: 'megumin', sfwtitle: 'MEGUMIN ÙwÚ', nsfwtitle: 'MEGUMIN Ú//w//Ù' })
};