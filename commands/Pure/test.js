const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const axios = require('axios');

module.exports = {
	name: 'test',
	execute(message, args) {
		message.channel.send(
			'Oe mira po, emotes <:yumou:697323299801137161>\n' +
			`${message.client.guilds.cache.get('676251911850164255').emojis.cache.map(emote => `<:${emote.name}:${emote.id}>`)}`
		);
    },
};