module.exports = {
	name: 'youmu',
	desc: 'Muestra el script completo de la película "Bee"',
	flags: [
		'meme'
	],

	execute(message, args) {
		message.channel.send({ content: '<:yomujugo:748626431914934282>' });
	}
};