const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const fetch = require('node-fetch');
const querystring = require('querystring');

const getRandomInt = function(_max) {
  _max = Math.floor(_max);
  return Math.floor(Math.random() * _max);
}

const tmpfunc = async function(tmpch, arglist) {
	let srchtags = 'touhou rating:';
	if(tmpch.nsfw) srchtags += 'explicit';
	else srchtags += 'safe';
	for(let i = 0; i < arglist.length; i++)
		srchtags += ' ' + arglist[i];
	srchtags = querystring.stringify({ tags: srchtags });
	const srchpg = getRandomInt(3);
	const srchlimit = 10;
	const { post } = await fetch(
		`https://gelbooru.com/index.php?page=dapi&s=post&q=index&${srchtags}&pid=${srchpg}&limit=${srchlimit}&api_key=ace81bbbcbf972d37ce0b8b07afccb00261f34ed39e06cd3a8d6936d6a16521b&user_id=497526&json=1`
	).then(response => response.json());

	//Crear y usar embed
	const selected = post[getRandomInt(srchlimit - 1)];
	const salsa = (selected.source.startsWith('http'))?selected.source:'Desconocida.';
	const Embed = new Discord.RichEmbed()
		.setColor('#fa7b62')
		.setTitle('Tohas uwu')
		.addField('Salsa', `${salsa}`)
		.setImage(selected.sample_url);
	tmpch.send(Embed);
}

module.exports = {
	name: 'touhou',
	aliases: [
        'imagentouhou', 'imgtouhou',
        'touhoupic', '2hupic',
		'2hu'
    ],
	execute(message, args){
		tmpfunc(message.channel, args);
    },
};