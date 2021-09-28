const aquaurl = 'https://media.tenor.co/videos/160249b37d22ffac37e6bbb98ee34f24/mp4';

module.exports = {
	name: 'aqua',
	aliases: [
		'minato'
	],
	desc: 'Comando de cachetitos de Minato Aqua',
	flags: [
		'meme'
	],

	async execute({ channel }, _) {
		//Acción de comando
		await channel.send({ content: aquaurl });
	},

	async interact(interaction, _) {
		//Acción de comando
		await interaction.reply({ content: aquaurl });
	}
};