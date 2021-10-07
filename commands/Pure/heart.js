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

	execute: async(message, args) => await searchImage(message, args, { cmdtag: 'holo', sfwtitle: 'HOLO OWO' })
};