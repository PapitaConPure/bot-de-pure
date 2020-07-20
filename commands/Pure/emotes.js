const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const axios = require('axios');

module.exports = {
	name: 'emotes',
	aliases: [
		'emojis', 'emote', 'emoji',
		'emt'
	],
	execute(message, args) {
		message.channel.send(
			'```\n' +
			'[REPORTE DE ESTADO DEL BOT]\n' +
			'Estoy investigando un error con el comando p!emotes que hace que no se pueda ver ninguno de los emotes disponibles al utilizarlo.\n' +
			'~Papita con Puré\n' +
			'```'
		);
		return;
		
		message.channel.send('**Oe mira po, emotes** <:yumou:708158159180660748>\n');
		message.channel.send(message.client.guilds.cache.get('676251911850164255').emojis.map(emote => `<:${emote.name}:${emote.id}>`).join(' '));
    },
};