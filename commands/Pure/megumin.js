const { searchImage, molds, options, callx } = require('./buscar.js');

module.exports = {
	name: 'megumin',
	aliases: [
        'megu', 'explosión', 'bakuretsu', 'papiwaifu', 'papawaifu', 'waifu',
		'bestgirl', 'explosion'
    ],
	brief: molds.brief.replace('#THEME', 'de Megumin, la esposa de Papita'),
    desc: molds.desc
		.replace('#THEME', 'de Megumin, también conocida como "La Legítima Esposa de Papita con Puré".\n❤️🤎🧡💛💚💙💜🤍💟♥️❣️💕💞💓💗💖💝')
		.replace('#NSFW_NOTE', 'no intentes buscarla en canales NSFW, conchetumare :rage:'),
    flags: [
        'common',
		'meme'
    ],
    options: options,
	callx: callx,
	experimental: true,
	
	execute: async(message, args, isSlash = false) => await searchImage(message, args, isSlash, { cmdtag: 'megumin', sfwtitle: 'MEGUMIN ÙwÚ', nsfwtitle: 'MEGUMIN Ú//w//Ù' })
};