const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const fetch = require('node-fetch');

const getRandomInt = function(_max) {
  _max = Math.floor(_max);
  return Math.floor(Math.random() * _max);
}

const tmpfunc = async function(tmpch) {
	const srchoff = getRandomInt;
	const srchlimit = 10;
	const { data } = await fetch(
		`https://api.giphy.com/v1/gifs/search?api_key=Qu29veK701szqoFK6tXgOiybuc1q3PaX&q=coffee&offset=${srchoff}&limit=${srchlimit}`
	).then(response => response.json());
	tmpch.send(`https://media.giphy.com/media/${data[getRandomInt(srchlimit - 1)].id}/giphy.gif`);
}

module.exports = {
	name: 'cafe',
	aliases: [
        'café',
        'coffee', 'cawfee'
    ],
	execute(message, args){
		tmpfunc(message.channel);
    },
};