const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const fetch = require('node-fetch');

const getRandomInt = function(_max) {
  _max = Math.floor(_max);
  return Math.floor(Math.random() * _max);
}

const tmpfunc = async function(tmpch, alist) {
	const srchoff = getRandomInt(100);
	const srchlimit = 10;
	let srchextra = '';
	for(let i = 0; i < alist.length; i++)
		srchextra += ` ${alist[i]}`;
	const { data } = await fetch(
		`https://api.giphy.com/v1/gifs/search?api_key=Qu29veK701szqoFK6tXgOiybuc1q3PaX&q=coffee${srchextra}&offset=${srchoff}&limit=${srchlimit}`
	).then(response => response.json());

	//Crear y usar embed
	const selected = data[getRandomInt(srchlimit - 1)];
	const Embed = new Discord.MessageEmbed()
		.setColor('#6a4928')
		.setTitle('Café uwu')
		.addField('Salsa', `${selected.bitly_url}`)
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
		tmpfunc(message.channel, args);
    },
};