const { randRange } = require('../../func.js');

const phrase = [
	'Ahora sí vení que te saco la cresta',
	'Vení que te dejo la cagá en la cara',
	'Ah mira que bacán. Vení que te rajo',
	'Aweonao recontraculiao ijoelamaraca',
	'Avíspate po\'',
	'Te voy a pegar el meo pape, maraco ctm',
	'Chúpalo gil qliao',
	'Te tiraste',
	'Te rifaste',
	'Te cagaste'
];
const tenshiurl = 'https://i.imgur.com/eMyvXiC.png';

module.exports = {
	name: 'rakkidei',
	aliases: [
		'rakki', 'tenshi'
	],
	brief: 'Comando de trompada de Rakkidei',
	desc: 'Comando de trompada de Rakkidei\n[🐦 Twitter](https://twitter.com/rakkidei)\n[🇵 pixiv](https://www.pixiv.net/users/58442175)',
	flags: [
		'common'
	],

	async execute({ channel }, _) {
		//Acción de comando
		channel.send({
			content: phrase[randRange(0, phrase.length)],
			files: [tenshiurl]
		});
	},

	async interact(interaction) {
		//Acción de comando
		interaction.reply({
			content: phrase[randRange(0, phrase.length)],
			files: [tenshiurl]
		});
	}
};