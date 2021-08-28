const { MessageEmbed } = require('discord.js'); //Integrar discord.js
const { randRange } = require('../../func');
const fetch = require('node-fetch');

const tmpfunc = async function(tmpch, alist) {
	const srchoff = randRange(0, 100);
	const srchlimit = 10;
	let srchextra = '';
	for(let i = 0; i < alist.length; i++)
		srchextra += ` ${alist[i]}`;
	const { data } = await fetch(
		`https://api.giphy.com/v1/gifs/search?api_key=Qu29veK701szqoFK6tXgOiybuc1q3PaX&q=coffee${srchextra}&offset=${srchoff}&limit=${srchlimit}`
	).then(response => response.json());

	//Crear y usar embed
	const selected = data[randRange(0, srchlimit)];
	const Embed = new MessageEmbed()
		.setColor('#6a4928')
		.setTitle('Café uwu')
		.addField('Salsa', `${selected.bitly_url}`)
		.setImage(`https://media.giphy.com/media/${selected.id}/giphy.gif`);
	tmpch.send({ embeds: [Embed] });
}

module.exports = {
	name: 'cafe',
	aliases: [
        'café', 'cafecito',
        'coffee', 'cawfee'
    ],
    desc: 'Muestra imágenes de café',
    flags: [
        'common'
    ],
    options: [

    ],

	execute(message, args) {
		tmpfunc(message.channel, args);
    },
};