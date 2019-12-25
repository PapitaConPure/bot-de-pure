const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const fetch = require('node-fetch');

const getRandomInt = function(_max) {
  _max = Math.floor(_max);
  return Math.floor(Math.random() * _max);
}

const tmpfunc = async function(tmpch) {
	const srchoff = getRandomInt(100);
	const srchlimit = 10;
	const { data } = await fetch(
		`https://api.giphy.com/v1/gifs/search?api_key=Qu29veK701szqoFK6tXgOiybuc1q3PaX&q=coffee&offset=${srchoff}&limit=${srchlimit}`
	).then(response => response.json());

	// inside a command, event listener, etc.
	const tempnum = getRandomInt(srchlimit - 1);
	const selected = data[tempnum];
	const Embed = new Discord.RichEmbed()
		.setColor('#6a4928')
		.setTitle('Café uwu')
		.setURL(`${selected.bitly_url}`)
		.addField('Fórmula de búsqueda', `${srchoff} + [0~${srchlimit} => ${tempnum}]`)
		.setImage(`https://media.giphy.com/media/${selected.id}/giphy.gif`);
	
	tmpch.send(Embed);
}

module.exports = {
	name: 'cafe',
	aliases: [
        'café', 'cafecito',
        'coffee', 'cawfee'
    ],
	execute(message, args){
		tmpfunc(message.channel);
    },
};