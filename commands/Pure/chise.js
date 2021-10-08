const chiseFiles = [
	{ name: 'chise1.png', attachment: 'https://cdn.discordapp.com/attachments/659885154105294874/723765798799147038/unknown.png'},
	{ name: 'chise2.png', attachment: 'https://cdn.discordapp.com/attachments/659885154105294874/723765958552060004/unknown.png'},
	{ name: 'chise3.png', attachment: 'https://cdn.discordapp.com/attachments/659885154105294874/723765965086523463/unknown.png'},
	{ name: 'chise4.png', attachment: 'https://cdn.discordapp.com/attachments/659885154105294874/723766052928094249/unknown.png'}
];

module.exports = {
	name: 'chise',
	aliases: [
		'sylvia', 'empalar'
	],
    desc: 'Comando de empalamiento de Chise',
    flags: [
        'meme',
		'hourai'
    ],
	
	async execute({ channel }, _) {
		channel.send({ files: chiseFiles });
    },
	
	async interact(interaction, _) {
		interaction.reply({ files: chiseFiles });
    }
};