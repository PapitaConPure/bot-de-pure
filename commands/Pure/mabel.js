const { randRange }  = require('../../func.js');

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

	execute(message, args) {
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

		message.channel.send(
			`:gay_pride_flag: ${h[randRange(0, h.length)]} ${h[randRange(0, h.length)]} ${h[randRange(0, h.length)]} ${h[randRange(0, h.length)]} ${h[randRange(0, h.length)]} :transgender_flag:`
		);
	}
};