const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const axios = require('axios');

const getRandomInt = function(_max) {
  _max = Math.floor(_max);
  let _randnum = Math.floor(Math.random() * _max);
  if(_randnum === _max && _max > 0) _randnum--;
  return _randnum;
}

const tmpfunc = async function(tmpch, arglist, tmpauth, msg) {;
	tmpch.startTyping();
	let BotMessage = -1;
	let srchtags = 'megumin -guro -furry -vore -webm -audio rating:';
	let embedcolor;
	let embedtitle;

	//#region Presentación
	if(tmpch.nsfw) {
		srchtags += 'explicit -bestiality';
		embedcolor = '#921131';
		embedtitle = 'MEGUMIN Ó//w//Ò';
	} else {
		srchtags += 'safe -soles -bikini -breast_grab -revealing_clothes -panties -no_bra -no_panties';
		embedcolor = '#e51a4c';
		embedtitle = 'MEGUMIN ÙwÚ';
	}
	//#endregion

	//#region Preparación de búsqueda
	let srchpg = 0;
	let customtags = '';
	if(arglist.length) {
		if(isNaN(arglist[0])) customtags += ` ${arglist[0]}`;
		else {
			if(arglist[0] < 2) {
				tmpch.send(':warning: no se pueden buscar números de página menores que 2 (por defecto: 1).');
				return;
			}
			srchpg = getRandomInt(arglist[0]);
		}
		for(let i = 1; i < arglist.length; i++)
			customtags += ' ' + arglist[i];
	}
	//#endregion

	const srchlimit = 42;
	{
		let i = 0;
		let foundpic = false;
		let results = 0;
		axios.get(
			`https://gelbooru.com/index.php?page=dapi&s=post&q=index&tags=${srchtags+customtags}&pid=${srchpg}&limit=${srchlimit}&api_key=ace81bbbcbf972d37ce0b8b07afccb00261f34ed39e06cd3a8d6936d6a16521b&user_id=497526&json=1`
		).then((data) => {
			data.data.forEach(image => { results++; });

			//#region Enviar imagen aleatoria, si hay al menos una
			const selectedpic = getRandomInt(results);
			let showpg = ':book: ';
			let showtag = ':mag_right: ';
			if(!isNaN(arglist[0])) showpg += `[1~**${arglist[0]}**] => Seleccionada: ***${srchpg + 1}***`;
			else showpg += 'No ingresaste un rango de páginas. `p!megumin <¿rango?> <¿etiquetas?>`'
			if(customtags.length) showtag += `*${customtags.trim().split(/ +/).map(str => str = str.replace('*', '\\*')).join(', ')}*`;
			else showtag += 'No ingresaste etiquetas. `p!megumin <¿rango?> <¿etiquetas?>`'; 
			data.data.forEach(image => {
				if(image !== undefined && i === selectedpic) {
					//Crear y usar embed
					const Embed = new Discord.RichEmbed()
						.setColor(embedcolor)
						.setTitle(embedtitle)
						.addField('Tu búsqueda', 
							`${showpg}\n`+
							`${showtag}`
						)
						.addField('Salsa', `https://gelbooru.com/index.php?page=post&s=view&id=${image.id}`)
						.addField('Acciones',
							`Reacciona con <:tags:704612794921779290> para ver las tags.\n` +
							`Reacciona con <:delete:704612795072774164> si la imagen incumple alguna regla.`
						)
						.setAuthor(`Comando invocado por ${tmpauth.username}`, tmpauth.avatarURL)
						.setFooter('Comando en desarrollo. Siéntanse libres de reportar errores a Papita con Puré#6932.')
						.setImage(image.file_url);
						
					tmpch.send(Embed).then(sent => {
						BotMessage = sent.id;
						console.log(BotMessage);
						const actions = [sent.client.emojis.get('704612794921779290'), sent.client.emojis.get('704612795072774164')];
						sent.react(actions[0])
							.then(() => sent.react(actions[1]))
							.then(() => {
								const filter = (rc, user) => !user.bot && actions.some(action => rc.emoji.id === action.id) && tmpauth.id === user.id;
								const collector = sent.createReactionCollector(filter, { time: 8 * 60 * 1000 });
								let showtags = false;
								collector.on('collect', reaction => {
									const maxpage = 2;
									if(reaction.emoji.id === actions[0].id) {
										if(!showtags) {
											const Embed2 = new Discord.RichEmbed()
												.setColor(embedcolor)
												.setTitle(embedtitle)
												.addField('Tu búsqueda', 
													`${showpg}\n`+
													`${showtag}`
												)
												.addField('Salsa', `https://gelbooru.com/index.php?page=post&s=view&id=${image.id}`)
												.addField('Tags', `*${image.tags.split(/ +/).join(', ')}*`)
												.addField('Acciones', `Reacciona con <:delete:704612795072774164> si la imagen incumple alguna regla.`)
												.setAuthor(`Comando invocado por ${tmpauth.username}`, tmpauth.avatarURL)
												.setFooter('Comando en desarrollo. Siéntanse libres de reportar errores a Papita con Puré#6932.')
												.setImage(image.file_url);	

											sent.edit(Embed2);
											showtags = true;
										}
									} else {
										msg.delete();
										sent.delete();
									}
								});
							}).then(() => sent.channel.stopTyping(true));
					});
					foundpic = true;
				}
				i++;
			});
			//#endregion
			
			if(!foundpic) tmpch.send(':warning: No hay resultados para estas tags. Prueba usando tags diferentes o un menor número de página :C');
		}).catch((error) => {
			tmpch.send(':warning: Ocurrió un error en la búsqueda. Prueba revisando las tags o usando un menor rango de páginas umu');
			console.error(error);
		});
		tmpch.stopTyping(true);
	}
}

module.exports = {
	name: 'megumin',
	aliases: [
        'megu', 'explosión', 'bakuretsu', 'papiwaifu', 'papawaifu', 'waifu',
		'bestgirl', 'explosion'
    ],
	execute(message, args) {
		message.channel.send(
				'```\n' +
				'[REPORTE DE ESTADO DEL BOT]\n' +
				'Estoy investigando un error con los comandos con Embed.\n' +
				'~Papita con Puré\n' +
				'```'
			);
			return;

		const admitted = [
			'651244470691561473', //Server de Puré
			'698323332160028792', //Hourai Doll
			'654471968200065034', //USD
			'676251911850164255' //Slot 1
		];
		
		if(!(admitted.some(soleID => (message.guild.id === soleID)))) {
			message.channel.send('_Este comando solo puede ser usado en la superficie..._');
			return;
		}
		if(message.channel.nsfw) {
			message.channel.send('*fokiu.*');
			return;
		}
		tmpfunc(message.channel, args, message.author, message);
    },
};