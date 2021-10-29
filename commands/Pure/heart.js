const { searchImage, molds, options, callx } = require('./buscar.js');

module.exports = {
	name: 'heart',
	aliases: [
        'holo'
    ],
	brief: molds.brief.replace('#THEME', 'de Holo, en rendimiento a Heartnix'),
    desc: molds.desc
		.replace('#THEME', 'de Holo, en rendimiento a Heartnix')
		.replace('#NSFW_NOTE', 'nisiquiera intentes buscarla en canales NSFW'),
    flags: [
        'common',
		'meme'
    ],
    options: options,
	callx: callx,
	experimental: true,

	execute: async(message, args, isSlash = false) => await searchImage(message, args, isSlash, { cmdtag: 'holo', sfwtitle: 'HOLO OWO' })
};