const { randRange }  = require('../../func.js');

const h = [
	':heart:',
	':orange_heart:',
	':yellow_heart:',
	':green_heart:',
	':blue_heart:',
	':purple_heart:',
	':brown_heart:',
	':white_heart:',
	':heartpulse:'
];

module.exports = {
	name: 'mabel',
	aliases: [
		'merraz', 'mármol', 'gay',
		'pride'
	],
	desc: 'Comando de inclusión de Mabel',
	flags: [
		'meme'
	],

	async execute({ channel }, _) {
		channel.send({ content: `:gay_pride_flag: ${Array(7).fill``.map(() => h[randRange(0, h.length)]).join(' ')} :transgender_flag:` });
	},

	async interact(interaction, _) {
		interaction.reply({ content: `:gay_pride_flag: ${Array(7).fill``.map(() => h[randRange(0, h.length)]).join(' ')} :transgender_flag:` });
	}
};