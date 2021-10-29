const { searchImage, molds, options, callx } = require('./buscar.js');

module.exports = {
	name: 'vtubers',
	aliases: [
        'vtuber', 'vt'
    ],
	brief: molds.brief.replace('#THEME', 'de vtubers'),
    desc: molds.desc
		.replace('#THEME', 'de vtubers')
		.replace('#NSFW_NOTE', 'en canales NSFW, los resultados serán, respectivamente, NSFW'),
    flags: [
        'common'
    ],
    options: options,
	callx: callx,
	experimental: true,
	
	execute: async(message, args, isSlash = false) => await searchImage(message, args, isSlash, { cmdtag: 'virtual_youtuber', sfwtitle: 'Vtubers uwu', nsfwtitle: 'Vtubas O//w//O' })
};

