import Canvas from '@napi-rs/canvas';
import { CommandOptions, CommandTags, Command, CommandParam, CommandFlag } from '../Commons';
import { p_pure } from '../../utils/prefixes';
import { AttachmentBuilder } from 'discord.js';
import { improveNumber } from '../../func';

const asset = (url: string, aliases: string[]) => ({ url, aliases });

const backgrounds = [						  //Nº		Título		Subtítulo
	asset('https://i.imgur.com/oH8TyAc.png', [ '01', 	'hrtp',		'reiiden',		]),
	asset('https://i.imgur.com/4GGHQSi.png', [ '02', 	'soew',		'fuumaroku',	]),
	asset('https://i.imgur.com/eSBjjt2.png', [ '03', 	'podd',		'yumejikuu', 	]),
	asset('https://i.imgur.com/io9lMCa.png', [ '04', 	'lls',		'gensoukyou',	]),
	asset('https://i.imgur.com/CapkX40.png', [ '05', 	'ms',		'kaikidan',		]),
	asset('https://i.imgur.com/c1xiN6V.png', [ '06', 	'eosd',		'koumakyou',	]),
	asset('https://i.imgur.com/hl11DcF.png', [ '07', 	'pcb',		'youyoumu',		]),
	asset('https://i.imgur.com/nilssyx.png', [ '08', 	'in',		'eiyashou',		]),
	asset('https://i.imgur.com/KivUNlq.png', [ '09', 	'pofv',		'kaeidzuka',	]),
	asset('https://i.imgur.com/SShhvZw.png', [ '10', 	'mof',		'fuujinroku',	]),
	asset('https://i.imgur.com/WP6DJsd.png', [ '11', 	'sa',		'chireiden',	]),
	asset('https://i.imgur.com/bkQgS6F.png', [ '12', 	'ufo',		'seirensen',	]),
	asset('https://i.imgur.com/rqnXz67.png', [ '128',	'gfw',		'daisensou',	]),
	asset('https://i.imgur.com/TGCfTaO.png', [ '13', 	'td',		'shinreibyou',	]),
	asset('https://i.imgur.com/WkN5IVx.png', [ '14', 	'ddc',		'kishinjou',	]),
	asset('https://i.imgur.com/zt2SADg.png', [ '15', 	'lolk',		'kanjuden',		]),
	asset('https://i.imgur.com/KvXsR81.png', [ '16', 	'hsifs',	'tenkuushou',	]),
	asset('https://i.imgur.com/MziOqiy.png', [ '17', 	'wbawc',	'kikeijuu',		]),
	asset('https://i.imgur.com/11X8Wkt.png', [ '18', 	'um',		'kouryuudou',	]),
];

const highlights = {
	/**@type {Object}*/
	survival: {
		clear: 		'https://i.imgur.com/b7eKjYR.png',
		['1cc']: 	'https://i.imgur.com/LOpNoOO.png',
		nomiss: 	'https://i.imgur.com/gmSxROn.png',
	},
	challenge: {
		nobomb: 	'https://i.imgur.com/VWoI0FU.png',
		nospecial: 	'https://i.imgur.com/e0p59jL.png',
		pacifista: 	'https://i.imgur.com/Gp98keQ.png',
	},
	difficulty: [
		asset('https://i.imgur.com/3LZJpWC.png', [ 'es', 	'fácil', 	'easy', 	'facil',	]),
		asset('https://i.imgur.com/KSTUyjI.png', [ 'nm', 	'normal', 							]),
		asset('https://i.imgur.com/nZGtdw0.png', [ 'hd', 	'difícil', 	'hard', 	'dificil',	]),
		asset('https://i.imgur.com/ur0CMwN.png', [ 'ln', 	'lunático', 'lunatic', 	'luna',		]),
		asset('https://i.imgur.com/YyIbi1C.png', [ 'ex', 	'extra', 							]),
	],
};

const options = new CommandOptions()
	.addOptions(
		new CommandParam('juego', [ 'TEXT', 'NUMBER' ])
			.setDesc('para elegir el juego')
			.setAutocomplete((interaction) => {
				return interaction.respond(
					backgrounds
						.flatMap(background =>
							background.aliases.map(alias => ({
								name: alias,
								value: alias,
							}))
						)
						.slice(0, 10)
				);
			}),
		new CommandParam('dificultad', 'TEXT')
			.setDesc('para establecer la dificultad jugada')
			.setAutocomplete((interaction) => {
				return interaction.respond(
					highlights.difficulty
						.flatMap(difficulty =>
							difficulty.aliases.map(alias => ({
								name: alias,
								value: alias,
							}))
						)
						.slice(0, 10)
				);
			}),
		new CommandParam('survival', { name: 'calidad', expression: '"clear", "1cc" o "nomiss"' })
			.setDesc('para indicar logros de de supervivencia')
			.setAutocomplete((interaction) => {
				return interaction.respond(
					highlights.difficulty
						.flatMap(difficulty =>
							difficulty.aliases.map(alias => ({
								name: alias,
								value: alias,
							}))
						)
						.slice(0, 10)
				);
			}),
		new CommandParam('puntaje', 'NUMBER')
			.setDesc('para establecer el puntaje'),
		new CommandParam('fecha', 'DATE')
			.setDesc('para establecer la fecha'),
		new CommandFlag()
			.setShort('b')
			.setLong(['nobomb', 'nb'])
			.setDesc('para especificar que se logró sin usar bombas'),
		new CommandFlag()
			.setShort('sc')
			.setLong(['nospecial','ns','noc'])
			.setDesc('para especificar que se logró sin usar las teclas C o D'),
		new CommandFlag()
			.setShort('p')
			.setLong(['pacifista', 'pacifist'])
			.setDesc('para especificar que se logró sin realizar daño'),
	);

const tags = new CommandTags().add('COMMON');

const command = new Command('tarjeta', tags)
	.setAliases('logro', 'achievement')
	.setBriefDescription('Para crear una tarjeta de logro personal. Imágenes por WMX#7937')
	.setLongDescription(
		'Para crear una tarjeta de logro personal.',
		'Las imágenes utilizadas son de parte de **WMX#7937**',
		'Deberás facilitar un `<juego>` (ejemplo: "HSiFS", "128" o "Youyoumu") y la calidad de `<survival>` obtenida ("clear", "1cc" o "nomiss"), al igual que la `<fecha>` del logro',
		'Adicionalmente, puedes especificar si el logro incluye desafíos personales como `--nobomb`, `--nospecial` y/o `--pacifista`',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		//Cargar imágenes derivadas de flags
		const canvas = Canvas.createCanvas(640, 1120);
		const ctx = canvas.getContext('2d');
		const challenges = ['nobomb', 'nospecial', 'pacifista']
			.map(ch => args.flagIf(ch, ch))
			.filter(ch => ch);

		const helpstr = `Usa \`${p_pure(request.guildId).raw}ayuda ${module.exports.name}\` para más información`;
		if(request.isMessage && args.count < 3) return request.reply(`⚠️ Debes ingresar al menos el juego completado, la dificultad y la calidad de supervivencia.\n${helpstr}`);

		const bg = backgrounds.find(b => b.aliases.includes(args.getString('juego')?.toLowerCase()));
		if(!bg) return request.reply('⚠️ Debes ingresar un nombre o número de juego válido. Solo se permiten juegos oficiales de danmaku tradicional');

		const diff = highlights.difficulty.find(d => d.aliases.includes(args.getString('dificultad')?.toLowerCase()));
		if(!diff) return request.reply(`⚠️ Debes ingresar una calidad de survival válida.\n${helpstr}`);

		const survivalname = args.getString('survival')?.toLowerCase();
		if(!highlights.survival[survivalname]) return request.reply(`⚠️ Debes ingresar una calidad de survival válida.\n${helpstr}`);
		
		const score = improveNumber(args.getNumber('puntaje'), { minDigits: 10 });
		if(!score || +score >= Math.pow(10, 12)) return request.reply(`⚠️ Debes ingresar un puntaje final válido.\n${helpstr}`);

		let dateStr: string = request.isInteraction ? args.getString('fecha') : (args.args as string[]).slice(4).join('');
		if(request.isMessage && !dateStr.length)
			return request.reply(`⚠️ Se esperaba una fecha luego del puntaje.\n${helpstr}`);

		const dateNumbers = dateStr.split(/[/ ]+/);
		if(dateNumbers.some(n => isNaN(+n)))
			return request.reply('⚠️ Fecha inválida. Asegúrate de seguir el formato DD/MM/AAAA');

		dateStr = dateNumbers.map(d => d.padStart(2, '0')).join('/');
		if(dateStr.length !== 'DD/MM/YYYY'.length)
			return request.reply('⚠️ Fecha inválida. Asegúrate de seguir el formato DD/MM/AAAA');

		const issueDate = dateStr
			? dateStr
			: new Date(Date.now()).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' });
		
		//Carga de imágenes
		await request.deferReply();

		try {
			const member = request.member;
			const [ bgImage, diffImage, survivalImage, pfp, ...challengeImages ] = await Promise.all([
				Canvas.loadImage(bg.url),
				Canvas.loadImage(diff.url),
				Canvas.loadImage(highlights.survival[survivalname]),
				Canvas.loadImage(member.displayAvatarURL({ size: 512, extension: 'png' })),
				...challenges.map(ch => Canvas.loadImage(highlights.challenge[ch])),
			]);
	
			//Dibujar imágenes
			ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
			ctx.drawImage(diffImage, 0, 0, canvas.width, canvas.height);
			ctx.drawImage(survivalImage, 0, 0, canvas.width, canvas.height);
			ctx.drawImage(pfp, 38, 804, 156, 156);
			challengeImages.forEach(challengeImage => ctx.drawImage(challengeImage, 0, 0, canvas.width, canvas.height));

			//Dibujar texto
			ctx.fillStyle = '#e0e0e0';
			ctx.textAlign = 'left';
			ctx.textBaseline = 'top';
			ctx.font = 'bold 64px "bebas"';
			ctx.fillText(request.user.username, 40, 500);
			ctx.textBaseline = 'bottom';
			ctx.font = '64px "dinpro"';
			ctx.fillText(score, 208, 969);
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'center';
			ctx.font = 'bold 48px "dinpro"';
			ctx.fillText(issueDate, 530, 1080);

			const phrases = [
				'¡Bien hecho!',
				'¡Felicidades!',
				'Al fin, ¿eh? Bien hecho~',
				'¡Buen trabajo!',
				'Perfecto. ¡Buen trabajo!',
				'¿Valió la pena? Seguro que sí',
				'¡Buena~!',
			];
			const replyContent = {
				content: phrases[Math.floor(Math.random() * phrases.length)],
				files: [ new AttachmentBuilder(canvas.toBuffer('image/webp'), { name: 'tarjeta.webp' }) ],
			};
			return request.editReply(replyContent);
		} catch {
			return request.editReply('Algo salió mal...');
		}
	});

export default command;
