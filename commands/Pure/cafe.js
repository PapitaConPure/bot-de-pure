const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const fetch = require('node-fetch');

const getRandomInt = function(_max) {
  _max = Math.floor(_max);
  return Math.floor(Math.random() * _max);
}

const tmpfunc = async function(tmpch) {
	const { file } = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=Qu29veK701szqoFK6tXgOiybuc1q3PaX&q=coffee&limit=25`).then(response => response.json());
	tmpch.send(file[getRandomInt(24)]);
}

module.exports = {
	name: 'cafe',
	aliases: [
        'café',
        'coffee'
    ],
	execute(message, args){
		tmpfunc(message.channel);
    },
};