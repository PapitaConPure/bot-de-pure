module.exports = {
	name: 'youmu',
	aliases: [
		'bee'
	],
	desc: 'Muestra el script completo de la película "Bee"',
	flags: [
		'meme'
	],

	execute(message, args) {
		message.channel.send("Test.");
	}
};