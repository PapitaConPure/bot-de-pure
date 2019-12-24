const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const fetch = require('node-fetch');

const tmpfunc = async function() {
	const { file } = await fetch('https://aws.random.cat/meow').then(response => response.json());
	message.channel.send(file);
}

module.exports = {
	name: 'gatos',
	execute(message, args){
		tmpfunc();
    },
};