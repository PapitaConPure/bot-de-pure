module.exports = {
	name: 'andreas',
	aliases: [
		'andrea'
	],
	desc: 'Comando de discusión de Andreas',
	flags: [
		'meme'
	],

	execute(message, args) {
		//Acción de comando
		message.channel.send({ files: ['https://i.imgur.com/GqepHtl.jpg'] });
	}
};