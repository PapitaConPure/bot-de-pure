const celesteurl = 'https://i.imgur.com/h9L6qy9.png';

module.exports = {
	name: 'celeste',
	desc: 'La versión que nunca te contaron del comando de Sassa',
	flags: [
		'meme'
	],

	async execute({ channel }, _) {
		//Acción de comando
		channel.send({ files: [celesteurl] });
	},

	async interact(interaction, _) {
		//Acción de comando
		interaction.reply({ files: [celesteurl] });
	}
};