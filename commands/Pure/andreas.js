const andreasurl = 'https://i.imgur.com/GqepHtl.jpg';

module.exports = {
	name: 'andreas',
	aliases: [
		'andrea', 'akime', 'valt'
	],
	desc: 'Comando de discusión de Andreas',
	flags: [
		'meme'
	],

	async execute({ channel }, _) {
		//Acción de comando
		await channel.send({ files: [andreasurl] });
	},

	async interact(interaction) {
		//Acción de comando
		await interaction.reply({ files: [andreasurl] });
	}
};