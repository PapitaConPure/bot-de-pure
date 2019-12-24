const Discord = require('discord.js'); //Integrar discord.js
const fetch = require('node-fetch'); //Integrar node-fetch
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'gatos',
	executeAsync(message, args) {
		const { file } = fetch('https://aws.random.cat/meow').then(response => response.json());
		message.channel.send(file);
    },
};