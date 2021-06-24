const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../localdata/config.json'); //Variables globales
const axios = require('axios');
const { randRange } = require('../../func');

const searchForImage = async function(arglist, msg) {
	//msg.channel.startTyping();
	const srchlimit = 42;
	const srchpg = randRange(0, 20000);
	let srchtags = 'touhou -guro -furry -vore -webm -audio -comic -4koma rating:';
	let embedcolor;
	let embedtitle;
	let foundpic = false;

	//#region Presentación
	if(msg.channel.nsfw) {
		srchtags += 'explicit -lolicon -loli -shotacon -bestiality ';
		embedcolor = '#38214e';
		embedtitle = 'Tohitas O//w//O';
	} else {
		srchtags += 'safe -soles -bikini -breast_grab -revealing_clothes -panties -no_bra -no_panties ';
		embedcolor = '#fa7b62';
		embedtitle = 'Tohas uwu';
	}
	//#endregion

	//Búsqueda personalizada
	srchtags += arglist.map(arg => global.boorutags.get(arg) || arg).join(' ');
	
	{
		let i = 0;
		let results = 0;
		axios.get(
			`https://gelbooru.com/index.php?page=dapi&s=post&q=index&tags=${srchtags}&pid=${srchpg}&limit=${srchlimit}&api_key=ace81bbbcbf972d37ce0b8b07afccb00261f34ed39e06cd3a8d6936d6a16521b&user_id=497526&json=1`
		).then((data) => {
			data.data.forEach(image => { results++; });

			//#region Enviar imagen aleatoria, si hay al menos una
			const selectedpic = getRandomInt(results);
			const showtag = ':mag_right: ' + (arglist.length) ?
				`*${srchtags.slice(srchtags.indexOf()).trim().split(/ +/).map(str => str = str.replace('*', '\\*')).join(', ')}*` :
				'No ingresaste etiquetas. `p!touhou <¿etiquetas?>`';

			data.data.forEach(image => {
				if(image !== undefined && i === selectedpic) {
					//Crear y usar embed
					const Embed = new Discord.MessageEmbed()
						.setColor(embedcolor)
						.setTitle(embedtitle)
						.addField('Tu búsqueda',  showtag)
						.addField('Salsa', `https://gelbooru.com/index.php?page=post&s=view&id=${image.id}`)
						.addField('Acciones',
							`Reacciona con <:tags:704612794921779290> para ver las tags.\n` +
							`Reacciona con <:delete:704612795072774164> si la imagen incumple alguna regla.`
						)
						.setAuthor(`Comando invocado por ${msg.author.username}`, msg.author.avatarURL())
						.setFooter('Comando en desarrollo. Siéntanse libres de reportar errores a Papita con Puré#6932.')
						.setImage(image.file_url);
						
					msg.channel.send(Embed).then(sent => {
						console.log(sent.id);
						const actions = [sent.client.emojis.cache.get('704612794921779290'), sent.client.emojis.cache.get('704612795072774164')];
						sent.react(actions[0])
							.then(() => sent.react(actions[1]))
							.then(() => {
								const filter = (rc, user) => !user.bot && actions.some(action => rc.emoji.id === action.id) && msg.author.id === user.id;
								const collector = sent.createReactionCollector(filter, { time: 8 * 60 * 1000 });
								let showtags = false;
								collector.on('collect', reaction => {
									const maxpage = 2;
									if(reaction.emoji.id === actions[0].id) {
										if(!showtags) {
											Embed.fields[2].name = 'Tags';
											Embed.fields[2].value = `*${image.tags.split(/ +/).join(', ')}*`;
											Embed.addField('Acciones', `Reacciona con <:delete:704612795072774164> si la imagen incumple alguna regla.`);

											sent.edit(Embed);
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
			
			if(!foundpic) msg.channel.send(':warning: No hay resultados para estas tags. Prueba usando tags diferentes o un menor número de página :C');
		}).catch((error) => {
			msg.channel.send(':warning: Ocurrió un error en la búsqueda. Prueba revisando las tags o usando un menor rango de páginas umu');
			console.error(error);
		});
		msg.channel.stopTyping(true);
	}
}

module.exports = {
	name: 'touhou',
	aliases: [
        'imagentouhou', 'imgtouhou', 'tohas', 'touhas', 'tojas', 'tohitas', 'touhitas', 'tojitas',
        'touhoupic', '2hupic',
		'2hu'
    ],
    desc: 'Muestra imágenes de Touhou.\n' +
		'**Nota:** en canales NSFW, los resultados serán, respectivamente, NSFW',
    flags: [
        'common',
		'maintenance'
    ],
    options: [
		':coffee: Queda pendiente rehacer comandos de imágenes con banderas y búsqueda ilimitada. Por favor, paciencia'
    ],
	callx: '<rango?> <etiquetas?>',
	
	execute(message, args) {
		searchForImage(args, message);
    },
};