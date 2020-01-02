const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const axios = require('axios');

const getRandomInt = function(_max) {
  _max = Math.floor(_max);
  let _randnum = Math.floor(Math.random() * _max);
  if(_randnum === _max && _max > 0) _randnum--;
  return _randnum;
}

const tmpfunc = async function(tmpch, arglist, tmpauth) {
	let BotMessage = -1;
	let srchtags = 'megumin -guro -furry -vore -webm -audio rating:';
	let embedcolor;
	let embedtitle;

	if(tmpch.nsfw) {
		srchtags += 'explicit -lolicon -loli -shotacon -bestiality';
		embedcolor = '#921131';
		embedtitle = 'MEGUMIN Ó//w//Ò';
	} else {
		srchtags += 'safe';
		embedcolor = '#e51a4c';
		embedtitle = 'MEGUMIN ÙwÚ';
	}
	let srchpg = 0;
	if(arglist.length) {
		if(isNaN(arglist[0])) srchtags += ` ${arglist[0]}`;
		else {
			if(arglist[0] < 1) {
				tmpch.send(':warning: no se pueden buscar números de página menores que 1.');
				return;
			}
			srchpg = getRandomInt(arglist[0]);
		}
		for(let i = 1; i < arglist.length; i++)
			srchtags += ' ' + arglist[i];
	}
	const srchlimit = 42;
	{
		let i = 0;
		let foundpic = false;
		let results = 0;
		axios.get(
			`https://gelbooru.com/index.php?page=dapi&s=post&q=index&tags=${srchtags}&pid=${srchpg}&limit=${srchlimit}&api_key=ace81bbbcbf972d37ce0b8b07afccb00261f34ed39e06cd3a8d6936d6a16521b&user_id=497526&json=1`
		).then((data) => {
			data.data.forEach(image => { results++; });

			const selectedpic = getRandomInt(results);
			data.data.forEach(image => {
				if(image !== undefined && i === selectedpic) {
					//Crear y usar embed
					const Embed = new Discord.RichEmbed()
						.setColor(embedcolor)
						.setTitle(embedtitle)
						.addField('Salsa', `https://gelbooru.com/index.php?page=post&s=view&id=${image.id}`)
						.addField('Eliminar imagen', `Si la imagen incumple alguna regla, escribe "d" para eliminar este mensaje.`)
						.setImage(image.file_url)
					tmpch.send(Embed).then(sent => {
						BotMessage = sent.id;
						console.log(BotMessage);
					});
					foundpic = true;
				}
				i++;
			});

			if(foundpic) {
				const filter = m => (m.content.toLowerCase() === 'd' || m.content.toLowerCase().startsWith('p!')) && m.author.id === tmpauth.id;
				global.imgcollector = tmpch.createMessageCollector(filter, { time: 120000 });
				global.imgcollector.on('collect', m => {
					console.log(`Collected ${m.content}`);
					console.log(BotMessage);
					if(m.content.toLowerCase() === 'd') tmpch.fetchMessage(BotMessage).then(msg => msg.delete());
					else global.imgcollector.stop();
				});
				global.imgcollector.on('end', collected => {
					console.log(`Collected ${collected.size} items`);
				});
			} else tmpch.send(':warning: No hay resultados para estas tags. Prueba usando tags diferentes o un menor rango de páginas :C');
		}).catch((error) => {
			tmpch.send(':warning: Ocurrió un error en la búsqueda. Prueba revisando las tags o usando un menor rango de páginas umu');
			console.error(error);
		});
	}
}

module.exports = {
	name: 'megumin',
	aliases: [
        'megu', 'explosión', 'bakuretsu', 'papiwaifu', 'papawaifu', 'waifu',
		'bestgirl', 'explosion'
    ],
	execute(message, args) {
		tmpfunc(message.channel, args, message.author);
    },
};