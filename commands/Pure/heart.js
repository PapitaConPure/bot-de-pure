const Discord = require('discord.js'); //Integrar discord.js
const axios = require('axios');

const getRandomInt = function(_max) {
  _max = Math.floor(_max);
  let _randnum = Math.floor(Math.random() * _max);
  if(_randnum === _max && _max > 0) _randnum--;
  return _randnum;
}

const tmpfunc = async function(tmpch, arglist, tmpauth, msg) {
	tmpch.sendTyping();
	let BotMessage = -1;
	let srchtags = 'holo -guro -furry -vore -webm -audio rating:';
	let embedcolor;
	let embedtitle;

	//#region Presentación
	if(tmpch.nsfw) {
		tmpch.send({ content: 'NO.' });
		return;
	} else {
		srchtags += 'safe -soles -bikini -breast_grab -revealing_clothes -panties -no_bra -no_panties -ass';
		embedcolor = '#dc7018';
		embedtitle = 'HOLO OWO';
	}
	//#endregion

	//#region Preparación de búsqueda
	let srchpg = 0;
	let customtags = '';
	if(arglist.length) {
		if(isNaN(arglist[0])) customtags += ` ${arglist[0]}`;
		else {
			if(arglist[0] < 2) {
				tmpch.send({ content: ':warning: no se pueden buscar números de página menores que 2 (por defecto: 1).' });
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
			else showpg += 'No ingresaste un rango de páginas. `p!heart <¿rango?> <¿etiquetas?>`'
			if(customtags.length) showtag += `*${customtags.trim().split(/ +/).map(str => str = str.replace('*', '\\*')).join(', ')}*`;
			else showtag += 'No ingresaste etiquetas. `p!heart <¿rango?> <¿etiquetas?>`'; 
			data.data.forEach(image => {
				if(image !== undefined && i === selectedpic) {
					//Crear y usar embed
					const Embed = new Discord.MessageEmbed()
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
						.setAuthor(`Comando invocado por ${tmpauth.username}`, tmpauth.avatarURL())
						.setFooter('Comando en desarrollo. Siéntanse libres de reportar errores a Papita con Puré#6932.')
						.setImage(image.file_url);
						
					tmpch.send({ embeds: [Embed] }).then(sent => {
						BotMessage = sent.id;
						console.log(BotMessage);
						const actions = [sent.client.emojis.cache.get('704612794921779290'), sent.client.emojis.cache.get('704612795072774164')];
						sent.react(actions[0])
							.then(() => sent.react(actions[1]))
							.then(() => {
								const filter = (rc, user) => !user.bot && actions.some(action => rc.emoji.id === action.id) && tmpauth.id === user.id;
								const collector = sent.createReactionCollector({ filter: filter, time: 8 * 60 * 1000 });
								let showtags = false;
								collector.on('collect', reaction => {
									const maxpage = 2;
									if(reaction.emoji.id === actions[0].id) {
										if(!showtags) {
											const Embed2 = new Discord.MessageEmbed()
												.setColor(embedcolor)
												.setTitle(embedtitle)
												.addField('Tu búsqueda', 
													`${showpg}\n`+
													`${showtag}`
												)
												.addField('Salsa', `https://gelbooru.com/index.php?page=post&s=view&id=${image.id}`)
												.addField('Tags', `*${image.tags.split(/ +/).join(', ')}*`)
												.addField('Acciones', `Reacciona con <:delete:704612795072774164> si la imagen incumple alguna regla.`)
												.setAuthor(`Comando invocado por ${tmpauth.username}`, tmpauth.avatarURL())
												.setFooter('Comando en desarrollo. Siéntanse libres de reportar errores a Papita con Puré#6932.')
												.setImage(image.file_url);	

											sent.edit({ content: [Embed2] });
											showtags = true;
										}
									} else {
										msg.delete();
										sent.delete();
									}
								});
							});
					});
					foundpic = true;
				}
				i++;
			});
			//#endregion
			
			if(!foundpic) tmpch.send({ content: ':warning: No hay resultados para estas tags. Prueba usando tags diferentes o un menor número de página :C' });
		}).catch((error) => {
			tmpch.send({ content: ':warning: Ocurrió un error en la búsqueda. Prueba revisando las tags o usando un menor rango de páginas umu' });
			console.error(error);
		});
	}
}

module.exports = {
	name: 'heart',
	aliases: [
        'holo'
    ],
    desc: 'Muestra imágenes de Holo, en rendimiento a Heartnix',
    flags: [
        'meme',
		'maintenance'
    ],
    options: [
		':coffee: Queda pendiente rehacer comandos de imágenes con banderas y búsqueda ilimitada. Por favor, paciencia'
    ],
	callx: '<rango?> <etiquetas?>',
	
	async execute(message, args) {
		if(message.guild.id !== '651244470691561473' && message.guild.id !== '654471968200065034') {
			message.channel.send({ content: '_Este comando solo puede ser usado en la superficie..._' });
			return;
		}
		if(message.guild.id === '654471968200065034' && message.channel.nsfw) {
			message.channel.send({ content: '*fokiu.*' });
			return;
		}
		tmpfunc(message.channel, args, message.author, message);
    },
};