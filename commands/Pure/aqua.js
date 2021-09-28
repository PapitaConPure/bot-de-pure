const aquaurl = 'https://tenor.com/bF5ID.gif';

module.exports = {
	name: 'aqua',
	aliases: [
		'minato', 'onion'
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