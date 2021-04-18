const Discord = require('discord.js'); //Integrar discord.js
const { randInt } = require('../../func');

module.exports = {
	name: 'sassafras',
	aliases: [
        'sassa', 'drossafras', 'dross'
    ],
    desc: 'Comando perturbador de Sassafras',
    flags: [
        'meme'
    ],
    options: [
		'`-s` o `--sassamodo` para despertar al demonio interno de Sassa'
    ],

	
	execute(message, args) {
		let sassamodo = false;
		args.some((arg, i) => {
			if(arg.startsWith('--'))
				switch(arg.slice(2)) {
				case 'sassamodo': forcesassamodo = true; break;
				}
			else if(arg.startsWith('-'))
				for(c of arg.slice(1))
					switch(c) {
					case 's': forcesassamodo = true; break;
					}
		});
		
		if(sassamodo)
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
			const games = [ //Juegos
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
				'Me dan lástima los devs de [Wonder Wickets](https://store.steampowered.com/app/598640/Wonder_Wickets/) y estaría bueno que alguien de hecho les comprara el juego. Tiene multijugador y un Workshop con muchos mods. Por favor.'
			];
			const umusic = [ //Música desconocida
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
				'FSJObE6eyCU'
			];
			const kmusic = [ //Música conocida
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
				'ey4JY8aox4E'
			];
			const i = randInt(0, games.length + umusic.length + kmusic.length);
			
			let m;
			if(i < games.length)
				m = new Discord.MessageEmbed()
					.setColor('#cccccc')
					.addField('El tío Sassa dice:', games[i]);
			else if(i < (games.length + umusic.length))
				m = `**Seguro nunca te escuchaste este temazo:**\nhttps://www.youtube.com/watch?v=${umusic[i - games.length]}`;
			else
				m = `**¿Y si voy con uno que sepamos todos?:**\nhttps://www.youtube.com/watch?v=${kmusic[i - games.length - umusic.length]}`;
			message.channel.send(`games[${i}]=${games[i]}\numusic[${i - games.length}]=${umusic[i - games.length]}\nkmusic[${i - games.length - umusic.length}]=${[i - games.length - umusic.length]}`);
			message.channel.send(m);
		}
    },
};