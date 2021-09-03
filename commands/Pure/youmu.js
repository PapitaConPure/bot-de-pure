module.exports = {
	name: 'youmu',
	desc: 'Yomujugo',
	flags: [
		'meme'
	],

	async execute(message, args) {
		message.channel.send({ content: '<:yomujugo:748626431914934282>' });
	},

	async interact(interaction) {
		interaction.reply({ content: '<:yomujugo:748626431914934282>' });
	}
};