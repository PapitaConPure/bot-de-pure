const { CommandOptionsManager } = require("../Commons/cmdOpts");

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
    flags: [
        'common',
        'emote',
		'uwu'
    ],
    options,
	callx: 'uwu',
	
	async execute(message, args) {
		message.channel.send({ content: uwusopt[Math.floor(Math.random() * uwusopt.length)] });
		if(args.includes('-d')) message.delete();
    },
	
	async interact(interaction, args) {
		interaction.reply({ content: uwusopt[Math.floor(Math.random() * uwusopt.length)] });
    }
};