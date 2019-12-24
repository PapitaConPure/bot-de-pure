const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'gatos',
	execute(message, args) {
        const { embfile } = await fetch('https://aws.random.cat/meow').then(response => response.json());

		message.channel.send(embfile);
    },
};