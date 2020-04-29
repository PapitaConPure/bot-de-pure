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
		message.channel.send('**Oe mira po, emotes** <:yumou:697323299801137161>\n');
		message.channel.send(message.client.guilds.get('676251911850164255').emojis.map(emote => `<:${emote.name}:${emote.id}>`).join(' '));
    },
};