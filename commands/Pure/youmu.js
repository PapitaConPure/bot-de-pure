module.exports = {
	name: 'youmu',
	desc: 'Yomujugo',
	flags: [
		'meme',
		'emote'
	],

	async execute({ channel }, _) {
		await channel.send({ content: '<:yomujugo:748626431914934282>' });
	},

	async interact(interaction) {
		await interaction.reply({ content: '<:yomujugo:748626431914934282>' });
	}
};