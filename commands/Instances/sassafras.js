const Discord = require('discord.js'); //Integrar discord.js
const { randRange } = require('../../func');
const { CommandOptions, CommandTags, Command } = require('../Commons/');

const sassadata = {
	sassamodo:
		'***Una cagada asquerosa, repelente, abyecta, vomitiva, mugrosa, maldita, diarreosa, estercolera, inmunda, malnacida, pudenda, apestosa, maloliente, cabrona, ' +
		'maricona, huevona, pendeja, tarada, cancerígena, jodida, culeada, gilipollesca, pelotuda, encamada, malnacida, retardada, atrasada, inútil, móngola, incestuosa, ' +
		'burda, estúpida, insulsa, putrefacta, traicionera, indigna, chupapollas, soplahuevos, esnifacojones, hueleculo, coprofágica, masca-morrones, infecta, cerda, ' +
		'nauseabunda, cochambrosa, cochina, verdulera, infame, ruin, rastrera, degradada, descerebrada, zopenca, zafia, puta, engreída, esquizofrénica, granulenta, infeliz, ' +
		'profana, calamitosa, deficiente, cretina, lela, ramera, fulana, calientaguevos, ridícula, petarda, pasmarote, fistro, desidiosa, puta, reputa, soputa, recontraputa, ' +
		'hija de puta, hija de un millón de putas, escupepitos, caradepedo, necrofílica, alientoamojón, lambe-bukaka, revuelcaleche, coñoesumadre y de su abuela, conchuda, ' +
		'culoroto, nalgas reventadas, tragasable, succionaditos, esfinterpartido, ojetedesilachado, sorbemocos, capulla, pelmaza, zoquete, masturbadora crónica, espuria, ' +
		'chupa-tampones, regluda, coprófaga, gerontofílica, turra, ojete, atorrante, tierrúa, pajúa, amamaguevos, onanista caradeconcha y MALA.***\n' +
		'https://youtu.be/-FWnpxCRVIo',
	recomm: {
		total: 0,
		games: [
			'Jueguen [Rabi-Ribi](https://store.steampowered.com/app/400910/RabiRibi/) <:aruStare:1107843505008689263>',
			'Que jueguen [CosmoDreamer](https://store.steampowered.com/app/1424630/CosmoDreamer/) <:spookedSyura:725577379665281094>',
			'Escuché que [Copy Kitty](https://store.steampowered.com/app/349250/Copy_Kitty/) está barato a esta altura del año <:boomer:748627305244524656>',
			'Jueguen [ZeroRanger](https://store.steampowered.com/app/809020/ZeroRanger/) :tangerine:',
			'Si te gusta Paper Mario, escuché que [Bug Fables](https://store.steampowered.com/app/1082710/Bug_Fables_The_Everlasting_Sapling/) es bastante bueno.',
			'Si andás con ganas de algo que te haga acordar a tu infancia, estás buscando [Gurumin](https://store.steampowered.com/app/322290/Gurumin_A_Monstrous_Adventure/).',
			'¿Sabías que los [creadores de Jugo](https://store.steampowered.com/publisher/fruitbatfactory) hicieron otros juegos como QP Shooting, Xmas Shooting, Suguri y Sora? Dales una oportunidad.',
			'Recordatorio de que [Cyber Shadow](https://store.steampowered.com/app/861250/Cyber_Shadow/) existe y está publicado por los devs de Shovel Knight.',
			'Si sabés japonés definitivamente deberías jugar la [trilogía de GBA de Densetsu no Stafy](https://www.emuparadise.me/roms/search.php?query=densetsu+no+stafy&section=all) y pasarme la traducción para este martes.',
			'Imaginate ser el pobre desgraciado que nunca jugó [Kirby](https://www.romulation.org/rom/NDS/2696-Kirby-Super-Star-Ultra-%28U%29).',
			'Denle bola a [GENETOS](https://web.archive.org/web/20130728190315/http://www.tatsuya-koyama.com/software/wg002_genetos_eng.html), que es Literalmente Gratis.',
			'Me dan lástima los devs de [Wonder Wickets](https://store.steampowered.com/app/598640/Wonder_Wickets/) y estaría bueno que alguien de hecho les comprara el juego. Tiene multijugador y un Workshop con muchos mods. Por favor.',
			'¿Sabías que el juego Cave Story tiene un hermano llamado [Kero Blaster](https://store.steampowered.com/app/292500/Kero_Blaster/)? Si no estás seguro tiene dos demos, [Pink Hour](https://store.steampowered.com/app/409670/Pink_Hour/) y [Pink Heaven](https://store.steampowered.com/app/409690/Pink_Heaven/).',
			'¿Querés jugar Touhou pero no tenés el tiempo o las ganas de jugarte 6 niveles? ¿Qué tal si jugás [Glory of Deep Skies](https://www.bulletforge.org/u/teaalternative-snding/p/dong-fang-meng-jiu-shi-glory-of-deep-skies)? Solo tiene tres niveles y una rejugabilidad decente.',
			'¿Ya jugaste [Khimera: Destroy All Monster Girls](https://store.steampowered.com/app/467380/Khimera_Destroy_All_Monster_Girls/)? Es gratis y como 5 veces mejor de lo que parece.',
			'Si andás aburrido y querés ver algo surreal con toques de YouTube Poop viejos, puede que te interese la serie de vídeos de [ENA](https://www.youtube.com/playlist?list=PLhPaJURyApsoMQDaoft5t0l0iAwUOLtlM), por Joel Guerra',
			'¿Querés jugar un juego de terror que no se toma a si mismo muy en serio, pero sigue siendo perfectamente capaz de asustar? Pues [Spooky\'s Jumpscare Mansion](https://store.steampowered.com/app/356670/Spookys_Jump_Scare_Mansion/) podría interesarles. Pueden elegir la versión gratuita (en cuyo caso los DLCs son pagos) o una [versión renovada](https://store.steampowered.com/app/577690/Spookys_Jump_Scare_Mansion_HD_Renovation/) de pago que aparte de cambiar algunas mecánicas viene con todos los DLC',
			'¿Te gusta Silent Hill pero seguís llorando porque la franquicia está completamente muerta? Pues te tengo un juego que podría ayudarte a disimular: [Lost In Vivo](https://store.steampowered.com/app/963710/Lost_in_Vivo/)',
			'¿Sabías que el juego Cave Story tiene... una secuela? Después de muchísimos años, el mod [Jenka\'s Nightmare](http://jenkasnightmare.srb2.org/) fue finalmente concluido en 2015. Es una segunda visita a la isla con caras nuevas y viejas. A propósito, es compatible con partidas del Cave Story original (el gratuito, no la versión + de Steam), así que si lo tienen por ahí, aprovechen. (Nota: Dificultad elevada, se sugiere jugar el juego original primero)',
			'La verdad no estoy muy seguro de cómo presentar este, pero es uno de mis hacks favoritos de EarthBound y siento que, a pesar de sus defectos, sigue siendo bastante divertido y algo a lo que más gente debería prestarle atención. También es razonablemente largo. En fin, acá está [Hallow\'s End](https://forum.starmen.net/forum/Community/PKHack/Hallow-s-End), donde vas a acompañar a Sally, Clyde y Craig en una extraña, más o menos tenebrosa desventura.',
			'¿Se te da bien pensar con portales? ¿Por qué no tratás de pensar en cuatro dimensiones, pequeña puta? Esa es más o menos la base de [Portal: Reloaded](https://store.steampowered.com/app/1255980/Portal_Reloaded/), un mod gratuito que requiere poseer una copia Portal 2 para funcionar',
		],
		music: {
			unknown: [
				'dBWKwbjj020', 'w5leZrtrFi0', '5ok9bzDzaS0', 'LKNBOzazxZE', 'U_0TeykT5NA', 'uvQTE7H2M68', 'c47DEa8ICoY', 'jj5CLg0GS5U', '1FPwPLfIubg', 'IyXBZ4M09ts',
				'p7hhRd-BafY', 'wiwHcEF2kiI', '55LnD7TNNGc', 'Rar7taiH0dY', 'wC5EQUvamQU', 'ElRQjuWmTUg', 'jAnx-rU0psE', 'D7chqmf2ThM', 'GlHKKdtLuqo', '_ImmjLQi5mE',
				'qmandi2nKi4', 'uddmkZiPjCw', 'ZjevDeTvbbw', 'FSJObE6eyCU', '4_gObHt1uZA', 'rRyy0yn2Qx8', 'owghgsl_z5o', 'cOlCCc-_2sg', 'GPAyRytnLWE', 'tmI92GX-xF0',
				'LseIASl1Pbk', 'Zz1jjTbVoew', '3fb8JL-fz0M', '8fll7w2xqcI', 'z3VSYWmbJFg', 'dE00u-GUYnw', 'Swd6aXqW0qM', 'GKVulqzzq5U', 'I-4dX4mxfVI', 'dot0iGpUL5I',
				'DTUdiGFmVRI', 'wz4s6quLDLg', 'leIMP5mbB14', 'pHKkgTZS5K8', 'peuTnilEv9g', 'GI1y1kJAsIo', 'mPl-ns-yIUE', 'B77hKKI4SbI', 'dkxrXWokYqQ', 'ZHlrHvt1dUE',
				'zKaoDdNZhJE', 'SJW697Ey5EE', '5qJ4wmwarbc', 'WWnKwcAY8iU', 'nVydgPgAIRo', 'SJwh3erQlyE', 'PLNlF1QQrrM', '3H0Jh-CJJTg', 'X0l0bWReD50', 'B__f4zx2iQg',
				'CyWCpFFovw0', 'gK7dszd_j1c', 'J9IM6KcO7qk', 'XctAezJ_OEc', '2D4tdy8b2dM', 'WrJFBmxHXuY', 'h4ioYorKqYo', 'pZOHMxAOXro', 'noXWHJVMrJg', 'OPC4eJlOXs0',
				'2AQ_k_WVs2c', 'O9XLWW39F08', 'GvRKIxTUbf4', 'NIWyZmFSep0', '8Jo5v0yo1Mg'
			],
			known: [
				'wGcyKEZtWuE', 'AdDbbzuq1vY', 'qIk6YFTzckc', 'Mdnnfg6Yvb0', 'llnXhrCn9Yo', 'dVVZaZ8yO6o', '2b8TKhIz_ZY', 'qVXeWfFTFGo', '8VyaShl6urc', 'HSZIej-ZraE',
				'Y0VYKbTSxu0', 'yn3GPjhtYJ8', 'LicR6XLP94U', 'tApsiCYkOfw', 'wqAYMZSOQao', 'Q1kf-OJdvb4', 'ey4JY8aox4E', 'QWhhMxrX-Us', 'GlUeW7IOSFc', 'Pm7b43TQxUU',
				'r9xAig0C00E', 'U730ft9yESk', 'YiUz1OiSqd8', 'qxhQghflIqg', 'axibQV5YsOk', '4EcgruWlXnQ', 'UgPKvxfzp6k', 'uV-CxxDpnqA', 'CZMWszd5SRk', 'lxKb48wvt60',
				'S9c43s8Yfhc',
			],
		},
		special: {
			music: {
				fool: [
					'vJzZ_LkYEb8', 'dQw4w9WgXcQ', 'X-cfWM0BC_4', '7jRnpUKHCTg', 'sC0cvwnG0Ik', '-GeC0kanxPQ', 'fZdBVzSGudA', 'MmwMVBrMRHI', 'ZcJjMnHoIBI', '0tdyU_gW6WE',
					'li5mXnHyg9w', 'czTksCF6X8Y'
				],
				birthday: [ 'xdCv0TAp4hc', 'E3tkgU0pQmQ' ],
				halloween: [
					'jHg1_AloGEk', 'tgUu8N05N24', 'jLUaYqH-1hw', 'nK8uH34mpnE', '0K_xO8JltXc', 'b677_os3s34', 'R4LlkoVBPFY', 'qcoXUuq1At8', 'G2oq0lVmIwU', 'fkZkN7uSZfk',
					'I3kGiA3EGP4', 'krD919h-UpE', 'oY9m2sHQwLs', 'cDd_GlynA6A', 'j90KEYE4LkU', '3_puJwNY4gM', 'w7VORG3t2sA', 'HcwyDL3-Qqo', 'yPnCwRGkg1E', 'Fi1WNXgkshk',
					'DAZdaUF6YNA', 'mybz71DEn9k',
				],
				xmas: [
					'TVeFyqISlHY', 'HHBb0z9584w', 'qOYbGBPnT_M', '-fWMWkrfoRU', 'bGUZG8V1OMU', 'shvbqQ-1vww', 'DxTr51RmEjE', 'iuc7L50iUhw', 'Bk8B2Tynet0', 'wTKvewEtnRY',
					'jSQkFYziGNU', '2EFOZcg0rjE', 'rS09sGZhQ0w', 's91vGclKnmg', 'UirushkxQuI', '1ssOSHSnwdo',
				],
			},
		},
	},
};

sassadata.recomm.total = (() => {
	const sr = sassadata.recomm;
	const { music: srm, special: srs } = sr;
	return [
		sr.games,
		srm.unknown,
		srm.known,
		srs.music.fool,
		srs.music.birthday,
		srs.music.halloween,
		srs.music.xmas,
	].map(coll => coll.length).reduce((a,b) => a + b);
})();

const flags = new CommandTags().add('MEME', 'OUTDATED');
const options = new CommandOptions()
	.addFlag('sd', ['sassamodo', 'dross'], 'para despertar al demonio interno de Sassa')
	.addFlag('t', 'total', 'para saber la cantidad total de recomendaciones');
const command = new Command('sassafras', flags)
	.setAliases('sassa', 'recomendaciones', 'sassapon', 'bassado', 'drossafras', 'dross')
	.setBriefDescription('Comando de recomendaciones de Sassafras')
	.setLongDescription(
		'Comando de recomendaciones de Sassafras',
		'Cuidado con hacer enojar al tío Sassa, o puede que active su `--sassamodo`',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const showTotal = args.hasFlag('total');
		const sassamodo = args.hasFlag('sassamodo');
		
		if(!showTotal && sassamodo)
			return request.reply({ content: sassadata.sassamodo });
		
		//Lista general con sublistas de juegos y música
		const sr = sassadata.recomm;
		let list = [
			...sr.games,
			'UMUSIC',
			...sr.music.unknown,
			'KMUSIC',
			...sr.music.known,
		];

		//#region Agregar a la lista si es un día especial
		//Probablemente debería reemplazar esos if internos con switches en el futuro
		const today = new Date(Date.now());
		const date = today.getUTCDate();
		let hint, spemote;
		switch(today.getUTCMonth() + 1) {
		case 4:
			if(date === 1) { //Día de los inocentes
				hint = 'Y mirá, la verdad que me olvidé de pensar una frase para esto, pero sobala, puto';
				spemote = '🤡';
				list = sr.special.music.fool;
			}
			break;
		case 6:
			if(date === 1) { //Cum
				hint = 'Paga tributo al macho alfa de la casa, pequeño vividor';
				spemote = '🍰';
				list = sr.special.music.birthday;
			}
			break;
		case 10:
			if(date >= 30) { //Halloween
				hint = '_The air is getting colder around you..._';
				spemote = '🎃';
				list = sr.special.music.halloween;
			}
			break;
		case 12:
			if([24, 25].includes(date)) { //Navidad
				hint = '¡Niños y niñas del mundo, vamos por ustedes!';
				spemote = '🌟';
				list = sr.special.music.xmas;
			}
			break;
		}
		//#endregion

		//#region Envío de línea de recomendación o total
		let m; //Mensaje
		if(showTotal) {
			m = new Discord.EmbedBuilder()
				.setColor(0xcccccc)
				.addFields(
					{ name: 'Total general',     value: `Sassa tiene **${sr.total}** recomendaciones bajo la manga`, inline: true },
					{ name: 'Disponible actual', value: `Sassa quiere recomendarte **${list.length}** cosas`,        inline: true },
				);

			if(!hint) m.addFields({ name: 'Subgrupos comunes', value: `🎮x${sr.games.length}\n❓x${sr.music.unknown.length}\n😳x${sr.music.known.length}`, inline: true });
			else m.addFields({ name: 'Subgrupo especial', value: `${spemote}x${(list.length)}`, inline: true });
			return request.reply({ embeds: [m] });
		}
		const i = randRange(0, list.length); //Índice aleatorio
		
		//Comprobado de tipo de recomendación
		//Índices de listas
		const umusic = list.indexOf('UMUSIC'), //Unknown music
			  kmusic = list.indexOf('KMUSIC'); //Known music
		if(hint) //Música especial
			m = `**${hint}**\nhttps://youtu.be/${list[i]}`;
		else if(i < umusic) //Juegos
			m = new Discord.EmbedBuilder()
				.setColor(0xcccccc)
				.addFields({ name: 'El tío Sassa dice:', value: list[i] });
		else if(i < kmusic) //Música desconocida
			m = `**Seguro nunca te escuchaste este temazo:**\nhttps://youtu.be/${list[i + (i === umusic?1:0)]}`;
		else if(i < list.length) //Música """"conocida"""""
			m = `**¿Y si voy con uno que sepamos todos?:**\nhttps://youtu.be/${list[i + (i === kmusic?1:0)]}`;
		
		return request.reply(typeof m === 'string'
			? { content: m }
			: { embeds: [m] }
		);
		//#endregion
	});

module.exports = command;