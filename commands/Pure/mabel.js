const { randInt }  = require('../../func.js');

module.exports = {
	name: 'mabel',
	aliases: [
		'merraz', 'mármol', 'gay',
		'pride'
	],
	desc: 'Comando de inclusión de Mabel',
	flags: [
		'meme',
		'hourai'
	],

	execute(message, args) {
		const hearts = [
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

		message.channel.send(`:gay_pride_flag: ${hearts[randInt(0, hearts.length)]} ${hearts[randInt(0, hearts.length)]} ${hearts[randInt(0, hearts.length)]} :transgender_flag:`);
	}
};