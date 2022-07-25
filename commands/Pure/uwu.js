const { fetchFlag } = require("../../func");
const { CommandOptionsManager, CommandMetaFlagsManager } = require('../Commons/commands');

const uwusopt = [
	'<:uwu:681935702308552730>',
	'<:uwu2:681936445958914128>',
	'<:uwu3:681937073401233537>',
	'<:uwu4:681937074047549467>',
	'<:uwu5:720506981743460472>'
];

const options = new CommandOptionsManager()
	.addParam('uwu', { name: 'uwu', expression: 'uwu' }, 'uwu')
	.addFlag('u', 'uwuwu', 'uwu')
	.addFlag('bd', ['borrar', 'delete'], 'para borrar el mensaje original');

module.exports = {
	name: 'uwu',
	aliases: ['uwu'],
    desc: 'uwu',
    flags: new CommandMetaFlagsManager().add(
		'MEME',
		'EMOTE',
	),
    options,
	callx: 'uwu',
	experimental: true,
	
	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} args
	 * @param {Boolean} isSlash
	 */
	async execute(request, args, isSlash = false) {
		const deleteOriginal = isSlash ? false : fetchFlag(args, { ...options.flags.get('borrar').structure, callback: true });
		const randomUwu = uwusopt[Math.floor(Math.random() * uwusopt.length)];
		
		if(!deleteOriginal)
			return request.reply({ content: uwusopt[Math.floor(Math.random() * uwusopt.length)] });
		
		return Promise.all([
			request.reply({ content: randomUwu }),
			request.delete().catch(console.error),
		]);
    },
};