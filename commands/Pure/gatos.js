const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const fetch = require('node-fetch');

const tmpfunc = async function(tmpch) {
	const { file } = await fetch('https://aws.random.cat/meow').then(response => response.json());
	tmpch.send(file);
}

module.exports = {
	name: 'gatos',
	aliases: [
        'gato', 'felino', 'gatito', 'gatitos', 'miau', 'nya',
        'cats', 'cat', 'meow'
    ],
	execute(message, args){
		tmpfunc(message.channel);
    },
};