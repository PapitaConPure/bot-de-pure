const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const axios = require('axios');

const getRandomInt = function(_max) {
  _max = Math.floor(_max);
  return Math.floor(Math.random() * _max);
}

const tmpfunc = async function(tmpch, arglist) {
	let ReturnMessage = -1;
	let srchtags = 'touhou rating:';
	if(tmpch.nsfw) { srchtags += 'explicit -guro -lolicon'; }
	else { srchtags += 'safe'; }
	for(let i = 0; i < arglist.length; i++)
		srchtags += ' ' + arglist[i];
	const srchpg = getRandomInt(20);
	const srchlimit = 42;
	{
		let i = 0;
		let selectedpic = getRandomInt(9);
		let foundpic = false;
		axios.get(
			`https://gelbooru.com/index.php?page=dapi&s=post&q=index&tags=${srchtags}&pid=${srchpg}&limit=${srchlimit}&api_key=ace81bbbcbf972d37ce0b8b07afccb00261f34ed39e06cd3a8d6936d6a16521b&user_id=497526&json=1`
		).then((data) => {
			data.data.forEach(image => {
				if(image !== undefined && i === selectedpic) {
					//Crear y usar embed
					const Embed = new Discord.RichEmbed()
						.setColor('#fa7b62')
						.setTitle('Tohas uwu')
						.addField('Salsa', `https://gelbooru.com/index.php?page=post&s=view&id=${image.id}`)
						.addField('Eliminar imagen', `Si la imagen incumple las reglas del canal/servidor/ToS de Discord, escribe "d" para eliminar este mensaje.`)
						.setImage(image.file_url);
					tmpch.send(Embed).then(sent => {ReturnMessage = sent.id;});
					foundpic = true;
				}
				i++;
			})

			if(!foundpic) tmpch.send(':warning: No hay resultados para estas tags >:C');
		}).catch((error) => {
			tmpch.send(':warning: Ocurrió un error en la búsqueda. Revisa las tags umu');
		});
	}
	return ReturnMessage;
}

module.exports = {
	name: 'touhou',
	aliases: [
        'imagentouhou', 'imgtouhou',
        'touhoupic', '2hupic',
		'2hu'
    ],
	execute(message, args){
		const botmsg = tmpfunc(message.channel, args);

		if(botmsg !== -1) {
			const filter = m => m.content.startsWith('d') && m.author.id === message.author.id;
			const collector = message.channel.createMessageCollector(filter, { time: 40000 });
			collector.on('collect', m => {
				console.log(`Collected ${m.content}`);
				botmsg.delete();
			});
		}
    },
};