const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'imagine',
	aliases: [
        'tryhard', 'tryhardeo'
    ],
	execute(message, args) {
		message.channel.send(
			'```\n' +
			'[REPORTE DE ESTADO DEL BOT]\n' +
			'Estoy investigando un error con los comandos con auto reacción personalizada que hace que tiren error al intentar conseguir las IDs de los emotes.\n' +
			'~Papita con Puré\n' +
			'```'
		);
		return;

		const mayuwu = [
			'<:mayuwu:654489124413374474>',
			'<:keikuwu:725572179101614161>',
			'<:koipwaise:657346542847524875>',
			'<:pepe:697320983106945054>',
			'<:kokocrong:697323104141049867>'
		];
		const lel = [
			message.client.emojis.get('697320983106945054'),
			message.client.emojis.get('697323104141049867')
		];

		message.channel.send(`${mayuwu[Math.floor(Math.random() * mayuwu.length)]} (?`).then(sent => {
			sent.react(lel[0])
				.then(() => sent.react(lel[1]));
		});
    },
};