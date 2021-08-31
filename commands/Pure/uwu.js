module.exports = {
	name: 'uwu',
	aliases: ['uwu'],
    desc: 'uwu',
    flags: [
        'common',
		'uwu'
    ],
    options: [
		'`uwu` _(uwu)_ uwu',
		'`-u` o `--uwu` para uwu',
        '`-b` o `--borrar` para borrar el mensaje original'
    ],
	callx: 'uwu',
	
	async execute(message, args) {
		const uwusopt = [
			'<:uwu:681935702308552730>',
			'<:uwu2:681936445958914128>',
			'<:uwu3:681937073401233537>',
			'<:uwu4:681937074047549467>',
			'<:uwu5:720506981743460472>'
		];
		message.channel.send({ content: uwusopt[Math.floor(Math.random() * uwusopt.length)] });
		if(args.includes('-d')) message.delete();
    },
};