const Discord = require('discord.js'); //Integrar discord.js
const fetch = require('node-fetch'); //Integrar node-fetch
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'gatos',
	execute(message, args){
		try {
			const { file } = await fetch.fetch('https://aws.random.cat/meow').then(response => response.json());
			await message.channel.send(file);
		} catch (error) {
			
		}
    },
};