const violojiaurl = 'https://i.imgur.com/eXS3nxn.png';

module.exports = {
	name: 'cromosomas',
	aliases: [
		'biología', 'biologia', 'violojía', 'violojia',
		'biology', 'violoyi'
	],
	desc: 'Comando de VIOLOJÍA de Mabel',
	flags: [
		'meme'
	],

	async execute({ channel }, _) {
		//Acción de comando
		await channel.send({ files: [violojiaurl] });
	},

	async interact(interaction, _) {
		//Acción de comando
		await interaction.reply({ files: [violojiaurl] });
	}
};