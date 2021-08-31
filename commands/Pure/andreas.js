module.exports = {
	name: 'andreas',
	aliases: [
		'andrea', 'akime', 'valt'
	],
	desc: 'Comando de discusión de Andreas',
	flags: [
		'meme'
	],

	async execute(message, args) {
		//Acción de comando
		message.channel.send({ files: ['https://i.imgur.com/GqepHtl.jpg'] });
	},

	async interact(interaction) {
		//Acción de comando
		await interaction.reply({ files: ['https://i.imgur.com/GqepHtl.jpg'] });
	}
};