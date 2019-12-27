const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const axios = require('axios');

const getRandomInt = function(_max) {
  _max = Math.floor(_max);
  return Math.floor(Math.random() * _max);
}

const tmpfunc = async function(tmpch, arglist, tmpauth) {
	let BotMessage = -1;
	let srchtags = 'touhou -guro -furry';
	let embedcolor;
	let embedtitle;
	if(tmpch.nsfw) {
		srchtags += ' -rating:safe -lolicon -shotacon -bestiality';
		embedcolor = '#38214e';
		embedtitle = 'Tohitas O//w//O';
	} else {
		srchtags += ' rating:safe';
		embedcolor = '#fa7b62';
		embedtitle = 'Tohas uwu';
	}
	let srchpg = 0;
	if(isNaN(args[0])) srchtags += ` ${args[0]}`;
	else {
		if(args[0] < 0) {
			tmpch.send(':warning: no se pueden buscar números de página negativos.');
		}
		srchpg = args[0];
	}
	for(let i = 1; i < arglist.length; i++)
		srchtags += ` ${arglist[i]}`;
	const srchlimit = 42;
	{
		let i = 0;
		let selectedpic = 0;
		let foundpic = false;
		axios.get(
			`https://gelbooru.com/index.php?page=dapi&s=post&q=index&tags=${srchtags}&pid=${srchpg}&limit=${srchlimit}&api_key=ace81bbbcbf972d37ce0b8b07afccb00261f34ed39e06cd3a8d6936d6a16521b&user_id=497526&json=1`
		).then((data) => {
			data.data.forEach(image => {
				if(image !== undefined && i === selectedpic) {
					//Crear y usar embed
					const Embed = new Discord.RichEmbed()
						.setColor(embedcolor)
						.setTitle(embedtitle)
						.addField('Salsa', `https://gelbooru.com/index.php?page=post&s=view&id=${image.id}`)
						.addField('Eliminar imagen', `Si la imagen incumple alguna regla, escribe "d" para eliminar este mensaje.`)
						.setImage(image.file_url);
					tmpch.send(Embed).then(sent => {
						BotMessage = sent.id;
						console.log(BotMessage);
					});
					foundpic = true;
				}
				i++;
			})

			if(foundpic) {
				const filter = m => m.content.startsWith('d') && m.author.id === tmpauth.id;
				const collector = tmpch.createMessageCollector(filter, { time: 40000 });
				collector.on('collect', m => {
					console.log(`Collected ${m.content}`);
					console.log(BotMessage);
					tmpch.fetchMessage(BotMessage).then(msg => msg.delete());
				});
				collector.on('end', collected => {
					console.log(`Collected ${collected.size} items`);
				});
			} else tmpch.send(':warning: No hay resultados para estas tags >:C');
		}).catch((error) => {
			tmpch.send(':warning: Ocurrió un error en la búsqueda. Prueba revisando las tags umu');
			console.error(error);
		});
	}
}

module.exports = {
	name: 'touhou',
	aliases: [
        'imagentouhou', 'imgtouhou', 'tohas', 'touhas', 'tojas', 'tohitas', 'touhitas', 'tojitas',
        'touhoupic', '2hupic',
		'2hu'
    ],
	execute(message, args){
		tmpfunc(message.channel, args, message.author);
    },
};