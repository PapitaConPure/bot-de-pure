const Canvas = require('canvas');
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { AttachmentBuilder, GuildMember } = require('discord.js');
const { improveNumber } = require('../../func');

/**
 * @param {String} url 
 * @param {Array<String>} aliases 
 */
const asset = (url, aliases) => ({ url, aliases });

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

const flags = new CommandMetaFlagsManager().add('COMMON');
const options = new CommandOptionsManager()
	.addParam('juego', 		['TEXT','NUMBER'], 												'para elegir el juego')
	.addParam('dificultad', 'TEXT', 														'para establecer la dificultad jugada')
	.addParam('survival', 	{ name: 'calidad', expression: '"clear", "1cc" o "nomiss"' }, 	'para establecer la calidad de supervivencia')
	.addParam('puntaje',	'NUMBER', 														'para establecer el puntaje')
	.addParam('fecha', 		{ name: 'fecha', expression: 'DD/MM/AAAA' }, 					'para establecer la fecha')
	.addFlag('b', 			['nobomb','nb'], 												'para especificar que se logró sin usar bombas')
	.addFlag(['s','c'], 	['nospecial','ns','noc'], 										'para especificar que se logró sin usar la tecla C')
	.addFlag('p', 			['pacifista', 'pacifist'],										'para especificar que se logró sin realizar daño');
const command = new CommandManager('tarjeta', flags)
	.setAliases('logro', 'achievement')
	.setBriefDescription('Para crear una tarjeta de logro personal. Imágenes por WMX#7937')
	.setLongDescription(
		'Para crear una tarjeta de logro personal.',
		'Las imágenes utilizadas son de parte de **WMX#7937**',
		'Deberás facilitar un `<juego>` (ejemplo: "HSiFS", "128" o "Youyoumu") y la calidad de `<survival>` obtenida ("clear", "1cc" o "nomiss"), al igual que la `<fecha>` del logro',
		'Adicionalmente, puedes especificar si el logro incluye desafíos personales como `--nobomb`, `--nospecial` y/o `--pacifista`',
	)
	.setOptions(options)
	.setExecution(async (request, args, isSlash = false) => {
		//Cargar imágenes derivadas de flags
		const canvas = Canvas.createCanvas(640, 1120);
		const ctx = canvas.getContext('2d');
		const challenges = ['nobomb', 'nospecial', 'pacifista']
			.map(ch => options.fetchFlag(args, ch, { callback: ch }))
			.filter(ch => ch);

		const helpstr = `Usa \`${p_pure(request.guildId).raw}ayuda ${module.exports.name}\` para más información`;
		if(args.length < 3) return request.reply(`⚠ Debes ingresar al menos el juego completado, la dificultad y la calidad de supervivencia.\n${helpstr}`);

		const bg = backgrounds.find(b => b.aliases.includes(`${isSlash ? args.getString('juego') : args[0]}`.toLowerCase()));
		if(!bg) return request.reply('⚠ Debes ingresar un nombre o número de juego válido. Solo se permiten juegos oficiales de danmaku tradicional');

		const diff = highlights.difficulty.find(d => d.aliases.includes(`${isSlash ? args.getString('dificultad') : args[1]}`.toLowerCase()));
		if(!diff) return request.reply(`⚠ Debes ingresar una calidad de survival válida.\n${helpstr}`);

		const survivalname = (isSlash ? args.getString('survival') : args[2]).toLowerCase();
		if(!highlights.survival[survivalname]) return request.reply(`⚠ Debes ingresar una calidad de survival válida.\n${helpstr}`);
		
		const score = improveNumber(isSlash ? args.getNumber('puntaje') : args[3], false, 10);
		if(!score || score >= Math.pow(10, 12)) return request.reply(`⚠ Debes ingresar un puntaje final válido.\n${helpstr}`);

		/**@type {String}*/
		let dateStr = isSlash ? args.getString('fecha') : args.slice(4).join('');
		if(!isSlash && !dateStr.length)
			return request.reply(`⚠ Se esperaba una fecha luego del puntaje.\n${helpstr}`);
		const dateNumbers = dateStr.split(/[\/ ]+/);
		if(dateNumbers.some(n => isNaN(n)))
			return request.reply('⚠ Fecha inválida. Asegúrate de seguir el formato DD/MM/AAAA');
		dateStr = dateNumbers.map(d => d.padStart(2, '0')).join('/');
		if(dateStr.length !== 'DD/MM/YYYY'.length)
			return request.reply('⚠ Fecha inválida. Asegúrate de seguir el formato DD/MM/AAAA');

		const issueDate = dateStr
			? dateStr
			: new Date(Date.now()).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' });
		
		//Carga de imágenes
		if(isSlash)
			await request.deferReply();

		/**@type {GuildMember}*/
		const member = request.member;
		const [ bgImage, diffImage, survivalImage, pfp, ...challengeImages ] = await Promise.all([
			Canvas.loadImage(bg.url),
			Canvas.loadImage(diff.url),
			Canvas.loadImage(highlights.survival[survivalname]),
			Canvas.loadImage(member.displayAvatarURL({ size: 512, extension: 'png' })),
			...challenges.map(ch => Canvas.loadImage(highlights.challenge[ch])),
		]).catch(console.error);

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
        ctx.fillText((request.user ?? request.author).username, 40, 500);
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
			files: [ new AttachmentBuilder(canvas.toBuffer(), { name: 'tarjeta.png' }) ],
		};
		if(isSlash)
			return request.editReply(replyContent);
		return request.reply(replyContent);
	});

module.exports = command;