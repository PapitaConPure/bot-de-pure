const { randInt } = require('../../func.js');

module.exports = {
	name: 'rakkidei',
	aliases: [
		'rakki', 'tenshi'
	],
	desc: 'Comando de trompada de Rakkidei\n[🐦 Twitter](https://twitter.com/rakkidei)\n[🇵 pixiv](https://www.pixiv.net/users/58442175)',
	flags: [
		'common'
	],

	execute(message, args) {
		const phrase = [
			'Ahora sí vení que te saco la cresta',
			'Vení que te dejo la cagá en la cara',
			'Ah mira que bacán. Vení que te rajo',
			'Aweonao recontraculiao ijoelamaraca'
		];

		//Acción de comando
		message.channel.send(phrase[randInt(0, phrase.length)], { files: ['https://i.imgur.com/eMyvXiC.png'] });
	}
};