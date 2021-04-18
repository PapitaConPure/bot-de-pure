const Discord = require('discord.js'); //Integrar discord.js
const { randInt } = require('../../func');

module.exports = {
	name: 'sassafras',
	aliases: [
        'sassa', 'recomendaciones', 'sassapon', 'drossafras', 'dross'
    ],
    desc: 'Comando de recomendaciones de Sassafras\n' +
		'Cuidado con hacer enojar al tío Sassa, o puede que active su `--sassamodo`',
    flags: [
        'meme'
    ],
    options: [
		'`-s` o `--sassamodo` para despertar al demonio interno de Sassa',
		'`-t` o `--total` para saber la cantidad total de líneas'
    ],
	
	execute(message, args) {
		let showtotal = false;
		let sassamodo = false;
		args.some((arg, i) => {
			if(arg.startsWith('--'))
				switch(arg.slice(2)) {
				case 'total': showtotal = true; break;
				case 'sassamodo': forcesassamodo = true; break;
				}
			else if(arg.startsWith('-'))
				for(c of arg.slice(1))
					switch(c) {
					case 't': showtotal = true; break;
					case 's': forcesassamodo = true; break;
					}
		});
		
		if(!showtotal && sassamodo)
			message.channel.send(
				'***Una cagada asquerosa, repelente, abyecta, vomitiva, mugrosa, maldita, diarreosa, estercolera, inmunda, malnacida, pudenda, apestosa, maloliente, cabrona, ' +
				'maricona, huevona, pendeja, tarada, cancerígena, jodida, culeada, gilipollesca, pelotuda, encamada, malnacida, retardada, atrasada, inútil, móngola, incestuosa, ' +
				'burda, estúpida, insulsa, putrefacta, traicionera, indigna, chupapollas, soplahuevos, esnifacojones, hueleculo, coprofágica, masca-morrones, infecta, cerda, ' +
				'nauseabunda, cochambrosa, cochina, verdulera, infame, ruin, rastrera, degradada, descerebrada, zopenca, zafia, puta, engreída, esquizofrénica, granulenta, infeliz, ' +
				'profana, calamitosa, deficiente, cretina, lela, ramera, fulana, calientaguevos, ridícula, petarda, pasmarote, fistro, desidiosa, puta, reputa, soputa, recontraputa, ' +
				'hija de puta, hija de un millón de putas, escupepitos, caradepedo, necrofílica, alientoamojón, lambe-bukaka, revuelcaleche, coñoesumadre y de su abuela, conchuda, ' +
				'culoroto, nalgas reventadas, tragasable, succionaditos, esfinterpartido, ojetedesilachado, sorbemocos, capulla, pelmaza, zoquete, masturbadora crónica, espuria, ' +
				'chupa-tampones, regluda, coprófaga, gerontofílica, turra, ojete, atorrante, tierrúa, pajúa, amamaguevos, onanista caradeconcha y MALA.***\n' +
				'-FWnpxCRVIo'
			);
		else {
			//Lista general con sublistas de juegos y música
			let list = [ //Juegos
				'Jueguen [Rabi-Ribi](https://store.steampowered.com/app/400910/RabiRibi/) <:wtfchomu:725582341401083967>',
				'Que jueguen [CosmoDreamer](https://store.steampowered.com/app/1424630/CosmoDreamer/) <:spookedSyura:725577379665281094>',
				'Escuché que [Copy Kitty](https://store.steampowered.com/app/349250/Copy_Kitty/) está barato a esta altura del año <:boomer:748627305244524656>',
				'Jueguen [ZeroRanger](https://store.steampowered.com/app/809020/ZeroRanger/) :tangerine:',
				'Si te gusta Paper Mario, escuché que [Bug Fables](https://store.steampowered.com/app/1082710/Bug_Fables_The_Everlasting_Sapling/) es bastante bueno.',
				'Si andás con ganas de algo que te haga acordar a tu infancia, estás buscando [Gurumin](https://store.steampowered.com/app/322290/Gurumin_A_Monstrous_Adventure/).',
				'¿Sabías que los [creadores de Jugo](https://store.steampowered.com/publisher/fruitbatfactory) hicieron otros juegos como QP Shooting, Xmas Shooting, Suguri y Sora? Dales una oportunidad',
				'Recordatorio de que [Cyber Shadow](https://store.steampowered.com/app/861250/Cyber_Shadow/) existe y está publicado por los devs de Shovel Knight',
				'Si sabés japonés definitivamente deberías jugar la [trilogía de GBA de Densetsu no Stafy](https://www.emuparadise.me/roms/search.php?query=densetsu+no+stafy&section=all) y pasarme la traducción para este martes.',
				'Imaginate ser el pobre desgraciado que nunca jugó [Kirby](https://www.romulation.org/rom/NDS/2696-Kirby-Super-Star-Ultra-%28U%29)',
				'Denle bola a [GENETOS](https://web.archive.org/web/20130728190315/http://www.tatsuya-koyama.com/software/wg002_genetos_eng.html), que es Literalmente Gratis',
				'Me dan lástima los devs de [Wonder Wickets](https://store.steampowered.com/app/598640/Wonder_Wickets/) y estaría bueno que alguien de hecho les comprara el juego. Tiene multijugador y un Workshop con muchos mods. Por favor.',
				'¿Sabías que el juego Cave Story tiene un hermano llamado [Kero Blaster](https://store.steampowered.com/app/292500/Kero_Blaster/)? Si no estás seguro tiene dos demos, [Pink Hour](https://store.steampowered.com/app/409670/Pink_Hour/) y [Pink Heaven](https://store.steampowered.com/app/409690/Pink_Heaven/)',
				'UMUSIC', //Música desconocida
				'dBWKwbjj020',
				'w5leZrtrFi0',
				'5ok9bzDzaS0',
				'LKNBOzazxZE',
				'U_0TeykT5NA',
				'uvQTE7H2M68',
				'c47DEa8ICoY',
				'jj5CLg0GS5U',
				'1FPwPLfIubg',
				'IyXBZ4M09ts',
				'p7hhRd-BafY',
				'wiwHcEF2kiI',
				'55LnD7TNNGc',
				'Rar7taiH0dY',
				'wC5EQUvamQU',
				'ElRQjuWmTUg',
				'jAnx-rU0psE',
				'D7chqmf2ThM',
				'GlHKKdtLuqo',
				'_ImmjLQi5mE',
				'qmandi2nKi4',
				'uddmkZiPjCw',
				'ZjevDeTvbbw',
				'FSJObE6eyCU',
				'4_gObHt1uZA',
				'rRyy0yn2Qx8',
				'owghgsl_z5o',
				'cOlCCc-_2sg',
				'GPAyRytnLWE',
				'tmI92GX-xF0',
				'LseIASl1Pbk',
				'Zz1jjTbVoew',
				'3fb8JL-fz0M',
				'8fll7w2xqcI',
				'z3VSYWmbJFg',
				'dE00u-GUYnw',
				'Swd6aXqW0qM',
				'GKVulqzzq5U',
				'I-4dX4mxfVI',
				'dot0iGpUL5I',
				'DTUdiGFmVRI',
				'wz4s6quLDLg',
				'KMUSIC', //Música conocida
				'wGcyKEZtWuE',
				'AdDbbzuq1vY',
				'qIk6YFTzckc',
				'Mdnnfg6Yvb0',
				'llnXhrCn9Yo',
				'dVVZaZ8yO6o',
				'2b8TKhIz_ZY',
				'qVXeWfFTFGo',
				'8VyaShl6urc',
				'HSZIej-ZraE',
				'Y0VYKbTSxu0',
				'yn3GPjhtYJ8',
				'LicR6XLP94U',
				'tApsiCYkOfw',
				'wqAYMZSOQao',
				'Q1kf-OJdvb4',
				'ey4JY8aox4E',
				'QWhhMxrX-Us',
				'GlUeW7IOSFc',
				'Pm7b43TQxUU',
				'r9xAig0C00E'
			];

			//#region Agregar a la lista si es un día especial
			const today = new Date(Date.now());
			const date = today.getUTCDate();
			let hint;
			switch(today.getUTCMonth() + 1) {
			case 10: //Octubre
				if(date === 31) { //Halloween
					hint = 'The air is getting colder around you:';
					list = [
						...list,
						'XMUSIC',
						'jHg1_AloGEk',
						'tgUu8N05N24',
						'jLUaYqH-1hw',
						'nK8uH34mpnE',
						'0K_xO8JltXc',
						'b677_os3s34',
						'R4LlkoVBPFY',
						'qcoXUuq1At8',
						'G2oq0lVmIwU',
						'fkZkN7uSZfk',
						'I3kGiA3EGP4',
						'rEmDpKsMJWc',
						'oY9m2sHQwLs',
						'cDd_GlynA6A',
						'NIWyZmFSep0'
					];
				}
				break;
			case 12: //Diciembre
				if(date === 24 || date === 25) { //Navidad
					hint = '¡Niños y niñas del mundo, vamos por ustedes!:';
					list = [
						...list,
						'XMUSIC',
						'TVeFyqISlHY',
						'HHBb0z9584w',
						'qOYbGBPnT_M',
						'-fWMWkrfoRU',
						'bGUZG8V1OMU',
						'shvbqQ-1vww',
						'DxTr51RmEjE',
						'iuc7L50iUhw',
						'Bk8B2Tynet0'
					];
				}
				break;
			}
			//#endregion

			//#region Envío de línea de recomendación o total
			//Índices de listas
			const umusic = list.indexOf('UMUSIC'), //Unknown music
			  	  kmusic = list.indexOf('KMUSIC'), //Known Music
				  xmusic = list.indexOf('XMUSIC'); //Extra Music
			let m; //Mensaje
			if(!showtotal) {
				const i = randInt(0, list.length); //Índice aleatorio
				
				//Comprobado de tipo de recomendación
				if(i < umusic) //Juegos
					m = new Discord.MessageEmbed()
						.setColor('#cccccc')
						.addField('El tío Sassa dice:', list[i]);
				else if(i < kmusic) //Música desconocida
					m = `**Seguro nunca te escuchaste este temazo:**\nhttps://youtu.be/${list[i + (i === umusic?1:0)]}`;
				else if(xmusic === -1 || i < xmusic) //Música """conocida"""
					m = `**¿Y si voy con uno que sepamos todos?:**\nhttps://youtu.be/${list[i + (i === kmusic?1:0)]}`;
				else if(xmusic !== -1) //Música especial
					m = `**${hint}**\nhttps://youtu.be/${list[i + (i === xmusic?1:0)]}`;
			} else {
				m = new Discord.MessageEmbed()
						.setColor('#cccccc')
						.addField('Total', `Hay ${list.length} recomendaciones de Sassa disponibles ahora mismo`, true)
						.addField('Subgrupos comunes', `🎮x${umusic}\n❓x${kmusic - umusic}\n😳x${((xmusic === -1)?list.length:xmusic) - kmusic}`, true)
						.addField('Subgrupo especial', (xmusic !== -1)?(list.length - xmusic):'No hay subgrupos especiales ahora mismo...', true);
			}
			message.channel.send(m);
			//#endregion
		}
    },
};