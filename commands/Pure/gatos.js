const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const fetch = require('node-fetch');

const tmpfunc = async function(tmpch) {
	const { file } = await fetch('https://aws.random.cat/meow').then(response => response.json());
	//Crear y usar embed
	const Embed = new Discord.MessageEmbed()
		.setColor('#ffc0cb')
		.setTitle('Gatitos uwu')
		.addField('Salsa', file)
		.setImage(file);
	tmpch.send(Embed);
}

module.exports = {
	name: 'gatos',
	aliases: [
        'gato', 'felino', 'gatito', 'gatitos', 'miau', 'michi', 'michis',
        'cats', 'cat', 'meow', 'nya', 'kitty', 'kitties'
    ],
	execute(message, args) {
		/*message.channel.send(
			'```\n' +
			'[REPORTE DE ESTADO DEL BOT]\n' +
			'Estoy investigando un error con los comandos con Embed.\n' +
			'~Papita con Puré\n' +
			'```'
		);
		return;*/

		tmpfunc(message.channel);
    },
};