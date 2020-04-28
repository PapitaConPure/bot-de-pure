const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
const axios = require('axios');

const getRandomInt = function(_max) {
  _max = Math.floor(_max);
  let _randnum = Math.floor(Math.random() * _max);
  if(_randnum === _max && _max > 0) _randnum--;
  return _randnum;
}

const tmpfunc = async function(tmpch, arglist, tmpauth, msg) {
	tmpch.startTyping();
	let BotMessage = -1;
	let srchtags = 'touhou -guro -furry -vore -webm -audio -comic -4koma rating:';
	let embedcolor;
	let embedtitle;
	//Nombres de tohas a tags y tags raras a tags más raras
	for(let i = 0; i < arglist.length; i++) {
		switch(arglist[i].toLowerCase()) {
			//#region Otras
			case 'gif': arglist[i] = 'animated'; break;
			case 'breasts': arglist[i] = 'large_breasts'; break;
			case 'big_breasts': arglist[i] = 'large_breasts'; break;
			//#endregion
			//#region Protagonistas
			case 'reimu': arglist[i] = 'hakurei_reimu'; break;
			case 'marisa': arglist[i] = 'kirisame_marisa'; break;
			//#endregion
			//#region EoSD (6)
			case 'meiling': arglist[i] = 'hong_meiling'; break;
			case 'patchouli': arglist[i] = 'patchouli_knowledge'; break;
			case 'sakuya': arglist[i] = 'izayoi_sakuya'; break;
			case 'remilia': arglist[i] = 'remilia_scarlet'; break;
			case 'flandre': arglist[i] = 'flandre_scarlet'; break;
			//#endregion
			//#region PCB (7)
			case 'letty': arglist[i] = 'letty_whiterock'; break;
			case 'alice': arglist[i] = 'alice_margatroid'; break;
			case 'shanghai': arglist[i] = 'shanghai_doll'; break;
			case 'hourai': arglist[i] = 'hourai_doll'; break;
			case 'lily': arglist[i] = 'lily_white'; break;
			case 'lyrica': arglist[i] = 'lyrica_prismriver'; break;
			case 'lunasa': arglist[i] = 'lunasa_prismriver'; break;
			case 'merlin': arglist[i] = 'merlin_prismriver'; break;
			case 'youmu': arglist[i] = 'konpaku_youmu'; break;
			case 'yuyuko': arglist[i] = 'saigyouji_yuyuko'; break;
			case 'ran': arglist[i] = 'yakumo_ran'; break;
			case 'yukari': arglist[i] = 'yakumo_yukari'; break;
			//#endregion
			//#region IN (8)
			case 'wriggle': arglist[i] = 'wriggle_nightbug'; break;
			case 'mystia': arglist[i] = 'mystia_lorelei'; break;
			case 'keine': arglist[i] = 'kamishirasawa_keine'; break;
			case 'tewi': arglist[i] = 'inaba_tewi'; break;
			case 'reisen': arglist[i] = 'reisen_udongein_inaba'; break;
			case 'eirin': arglist[i] = 'yagokoro_eirin'; break;
			case 'kaguya': arglist[i] = 'houraisan_kaguya'; break;
			case 'mokou': arglist[i] = 'fujiwara_no_mokou'; break;
			//#endregion
			//#region PoFV (9)
			case 'aya': arglist[i] = 'shameimaru_aya'; break;
			case 'medicine': arglist[i] = 'medicine_melancholy'; break;
			case 'yuuka': arglist[i] = 'kazami_yuuka'; break;
			case 'komachi': arglist[i] = 'onozuka_komachi'; break;
			case 'eiki': arglist[i] = 'shiki_eiki'; break;
			//#endregion
			//#region MoF (10)
			case 'shizuha': arglist[i] = 'aki_shizuha'; break;
			case 'minoriko': arglist[i] = 'aki_minoriko'; break;
			case 'hina': arglist[i] = 'kagiyama_hina'; break;
			case 'nitori': arglist[i] = 'kawashiro_nitori'; break;
			case 'momiji': arglist[i] = 'inubashiri_momiji'; break;
			case 'sanae': arglist[i] = 'kochiya_sanae'; break;
			case 'kanako': arglist[i] = 'yasaka_kanako'; break;
			case 'suwako': arglist[i] = 'moriya_suwako'; break;
			//#endregion
			//#region SA (11)
			case 'yamame': arglist[i] = 'kurodani_yamame'; break;
			case 'parsee': arglist[i] = 'mizuhashi_parsee'; break;
			case 'yuugi': arglist[i] = 'hoshiguma_yuugi'; break;
			case 'satori': arglist[i] = 'komeiji_satori'; break;
			case 'rin': arglist[i] = 'kaenbyou_rin'; break;
			case 'orin': arglist[i] = 'kaenbyou_rin'; break;
			case 'utsuho': arglist[i] = 'reiuji_utsuho'; break;
			case 'okuu': arglist[i] = 'reiuji_utsuho'; break;
			case 'koishi': arglist[i] = 'komeiji_koishi'; break;
			//#endregion
			//#region UFO (12)
			case 'kogasa': arglist[i] = 'tatara_kogasa'; break;
			case 'ichirin': arglist[i] = 'kumoi_ichirin'; break;
			case 'murasa': arglist[i] = 'murasa_minamitsu'; break;
			case 'shou': arglist[i] = 'toramaru_shou'; break;
			case 'byakuren': arglist[i] = 'hijiri_byakuren'; break;
			case 'nue': arglist[i] = 'houjuu_nue'; break;
			case 'nuee': arglist[i] = 'houjuu_nue'; break;
			//#endregion
			//#region TD (13)
			case 'kyouko': arglist[i] = 'kasodani_kyouko'; break;
			case 'yoshika': arglist[i] = 'miyako_yoshika'; break;
			case 'seiga': arglist[i] = 'kaku_seiga'; break;
			case 'tojiko': arglist[i] = 'soga_no_tojiko'; break;
			case 'futo': arglist[i] = 'mononobe_no_futo'; break;
			case 'miko': arglist[i] = 'toyosatomimi_no_miko'; break;
			case 'mamizou': arglist[i] = 'futatsuiwa_mamizou'; break;
			//#endregion
			//#region DDC (14)
			case 'kagerou': arglist[i] = 'imaizumi_kagerou'; break;
			case 'benben': arglist[i] = 'tsukumo_benben'; break;
			case 'yatsuhashi': arglist[i] = 'tsukumo_yatsuhashi'; break;
			case 'seija': arglist[i] = 'kijin_seija'; break;
			case 'sukuna': arglist[i] = 'sukuna_shinmyoumaru'; break;
			case 'shinmyoumaru': arglist[i] = 'sukuna_shinmyoumaru'; break;
			case 'raiko': arglist[i] = 'horikawa_raiko'; break;
			//#endregion
			//#region LoLK (15)
			case 'seiran': arglist[i] = 'seiran*'; break;
			case 'ringo': arglist[i] = 'ringo*'; break;
			case 'doremy': arglist[i] = 'doremy_sweet'; break;
			case 'sagume': arglist[i] = 'kishin_sagume'; break;
			case 'junko': arglist[i] = 'junko*'; break;
			case 'hecatia': arglist[i] = 'hecatia_lapislazuli'; break;
			//#endregion
			//#region HSiFS (16)
			case 'eternity': arglist[i] = 'eternity_larva'; break;
			case 'nemuno': arglist[i] = 'sakata_nemuno'; break;
			case 'aunn': arglist[i] = 'komano_aun'; break;
			case 'komano': arglist[i] = 'komano_aun'; break;
			case 'narumi': arglist[i] = 'yatadera_narumi'; break;
			case 'satono': arglist[i] = 'nishida_satono'; break;
			case 'mai': arglist[i] = 'teireida_mai'; break;
			case 'okina': arglist[i] = 'matara_okina'; break;
			//#endregion
			//#region WBaWC (17)
			case 'eika': arglist[i] = 'ebisu_eika'; break;
			case 'urumi': arglist[i] = 'ushizaki_urumi'; break;
			case 'kutaka': arglist[i] = 'niwatari_kutaka'; break;
			case 'yachie': arglist[i] = 'kicchou_yachie'; break;
			case 'mayumi': arglist[i] = 'joutouguu_mayumi'; break;
			case 'keiki': arglist[i] = 'haniyasushin_keiki'; break;
			case 'saki': arglist[i] = 'kurokoma_saki'; break;
			//#endregion
			//#region Fighters
			case 'suika': arglist[i] = 'ibuki_suika'; break;
			case 'iku': arglist[i] = 'nagae_iku'; break;
			case 'tenshi': arglist[i] = 'hinanawi_tenshi'; break;
			case 'kokoro': arglist[i] = 'hata_no_kokoro'; break;
			case 'usami': arglist[i] = 'usami_sumireko'; break;
			case 'sumireko': arglist[i] = 'usami_sumireko'; break;
			case 'jo\'on': arglist[i] = 'yorigami_jo\'on'; break;
			case 'shion': arglist[i] = 'yorigami_shion'; break;
			//#endregion
			//#region Novelas, Spin-off y CDs
			case 'rinnosuke': arglist[i] = 'morichika_rinnosuke'; break;
			case 'toyohime': arglist[i] = 'watatsuki_no_toyohime'; break;
			case 'yorihime': arglist[i] = 'watatsuki_no_yorihime'; break;
			case 'hatate': arglist[i] = 'himekaidou_hatate'; break;
			case 'luna': arglist[i] = 'luna_child'; break;
			case 'star': arglist[i] = 'star_sapphire'; break;
			case 'sunny': arglist[i] = 'sunny_milk'; break;
			case 'kosuzu': arglist[i] = 'motoori_kosuzu'; break;
			case 'maribel': arglist[i] = 'maribel_hearn'; break;
			case 'merry': arglist[i] = 'maribel_hearn'; break;
			case 'renko': arglist[i] = 'usami_renko'; break;
			case 'akyuu': arglist[i] = 'hieda_no_akyuu'; break;
			case 'kasen': arglist[i] = 'ibaraki_kasen'; break;
			case 'miyoi': arglist[i] = 'okunoda_miyoi'; break;
			case 'tokiko': arglist[i] = 'tokiko_(touhou)'; break;
			//#endregion
		}
	}

	//#region Presentación
	if(tmpch.nsfw) {
		srchtags += 'explicit -lolicon -loli -shotacon -bestiality';
		embedcolor = '#38214e';
		embedtitle = 'Tohitas O//w//O';
	} else {
		srchtags += 'safe';
		embedcolor = '#fa7b62';
		embedtitle = 'Tohas uwu';
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
			else showpg += 'No ingresaste un rango de páginas. `p!2hu <¿rango?> <¿etiquetas?>`'
			if(customtags.length) showtag += `*${customtags.trim().split(/ +/).map(str => str = str.replace('*', '\\*')).join(', ')}*`;
			else showtag += 'No ingresaste etiquetas. `p!2hu <¿rango?> <¿etiquetas?>`'; 
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
						.addField('Tags', `Reacciona con <:tags:704612794921779290> para ver las tags.`)
						.addField('Eliminar imagen', `Reacciona con <:delete:704612795072774164> si la imagen incumple alguna regla.`)
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
								const filter = (rc, user) => !user.bot && actions.some(action => rc.emoji.id === action.id);
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
												.addField('Eliminar imagen', `Reacciona con <:delete:704612795072774164> si la imagen incumple alguna regla.`)
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
	name: 'test',
	/*aliases: [
        'imagentouhou', 'imgtouhou', 'tohas', 'touhas', 'tojas', 'tohitas', 'touhitas', 'tojitas',
        'touhoupic', '2hupic',
		'2hu'
    ],*/
	execute(message, args) {
		tmpfunc(message.channel, args, message.author, message);
    },
};