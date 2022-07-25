const { searchImage, molds, options, callx } = require('./buscar.js');
const { CommandMetaFlagsManager } = require('../Commons/commands');

module.exports = {
	name: 'heart',
	aliases: [
        'holo'
    ],
	brief: molds.brief.replace('#THEME', 'de Holo, en rendimiento a Heartnix'),
    desc: molds.desc
		.replace('#THEME', 'de Holo, en rendimiento a Heartnix')
		.replace('#NSFW_NOTE', 'ni siquiera intentes buscarla en canales NSFW'),
    flags: new CommandMetaFlagsManager().add(
        'COMMON',
		'MEME',
		'OUTDATED',
    ),
    options: options,
	callx: callx,
	experimental: true,

	execute: async(message, args, isSlash = false) => await searchImage(message, args, isSlash, { cmdtag: 'holo', sfwtitle: 'HOLO OWO' })
};