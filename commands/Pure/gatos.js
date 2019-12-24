const Discord = require('discord.js'); //Integrar discord.js
const fetch = require('node-fetch'); //Integrar node-fetch
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'gatos',
	execute(message, args) {
		try {
			const { file } = await fetch('https://aws.random.cat/meow').then(response => response.json());
			message.channel.send(file);
		} catch(error) {
			message.channel.send(':radioactive: Ha ocurrido un error mientras se buscaban tus gatitos.');
		}
    },
};