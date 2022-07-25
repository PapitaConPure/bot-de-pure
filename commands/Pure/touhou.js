const { searchImage, molds, options, callx } = require('./buscar.js');
const { CommandMetaFlagsManager } = require('../Commons/commands');

module.exports = {
	name: 'touhou',
	aliases: [
        'imagentouhou', 'imgtouhou', 'tohas', 'touhas', 'tojas', 'tohitas', 'touhitas', 'tojitas',
        'touhoupic', '2hupic',
		'2hu', '2ho'
    ],
	brief: molds.brief.replace('#THEME', 'de Touhou'),
    desc: molds.desc
		.replace('#THEME', 'de Touhou')
		.replace('#NSFW_NOTE', 'en canales NSFW, los resultados serán, respectivamente, NSFW'),
	flags: new CommandMetaFlagsManager().add('COMMON'),
    options: options,
	callx: callx,
	experimental: true,
	
	execute: async(message, args, isSlash = false) => await searchImage(message, args, isSlash, { cmdtag: 'touhou', sfwtitle: 'Tohas uwu', nsfwtitle: 'Tohitas O//w//O' })
};