const Canvas = require('canvas');
const { CommandOptionsManager } = require('../Commons/cmdOpts');
const { p_pure } = require('../../localdata/prefixget');
const { MessageAttachment } = require('discord.js');
const { dibujarAvatar } = require('../../func.js');

/**
 * @param {String} url 
 * @param {Array<String>} aliases 
 */
const game = (url, aliases) => ({
	url: url,
	aliases: aliases,
});

const backgrounds = [						//Nº		Título		Subtítulo
	game('https://i.imgur.com/oH8TyAc.png', [ '01', 	'hrtp',		'reiiden',		]),
	game('https://i.imgur.com/4GGHQSi.png', [ '02', 	'soew',		'fuumaroku',	]),
	game('https://i.imgur.com/eSBjjt2.png', [ '03', 	'podd',		'yumejikuu', 	]),
	game('https://i.imgur.com/io9lMCa.png', [ '04', 	'lls',		'gensoukyou',	]),
	game('https://i.imgur.com/CapkX40.png', [ '05', 	'ms',		'kaikidan',		]),
	game('https://i.imgur.com/c1xiN6V.png', [ '06', 	'eosd',		'koumakyou',	]),
	game('https://i.imgur.com/hl11DcF.png', [ '07', 	'pcb',		'youyoumu',		]),
	game('https://i.imgur.com/nilssyx.png', [ '08', 	'in',		'eiyashou',		]),
	game('https://i.imgur.com/KivUNlq.png', [ '09', 	'pofv',		'kaeidzuka',	]),
	game('https://i.imgur.com/SShhvZw.png', [ '10', 	'mof',		'fuujinroku',	]),
	game('https://i.imgur.com/WP6DJsd.png', [ '11', 	'sa',		'chireiden',	]),
	game('https://i.imgur.com/bkQgS6F.png', [ '12', 	'ufo',		'seirensen',	]),
	game('https://i.imgur.com/rqnXz67.png', [ '128',	'gfw',		'daisensou',	]),
	game('https://i.imgur.com/TGCfTaO.png', [ '13', 	'td',		'shinreibyou',	]),
	game('https://i.imgur.com/WkN5IVx.png', [ '14', 	'ddc',		'kishinjou',	]),
	game('https://i.imgur.com/zt2SADg.png', [ '15', 	'lolk',		'kanjuden',		]),
	game('https://i.imgur.com/KvXsR81.png', [ '16', 	'hsifs',	'tenkuushou',	]),
	game('https://i.imgur.com/MziOqiy.png', [ '17', 	'wbawc',	'kikeijuu',		]),
	game('https://i.imgur.com/11X8Wkt.png', [ '18', 	'um',		'kouryuudou',	]),
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
		pacifist: 	'https://i.imgur.com/Gp98keQ.png',
	},
	difficulty: [
		{ url: 'https://i.imgur.com/3LZJpWC.png', aliases: [ 'es', 	'fácil', 	'easy', 	'facil',	] },
		{ url: 'https://i.imgur.com/KSTUyjI.png', aliases: [ 'nm', 	'normal', 							] },
		{ url: 'https://i.imgur.com/nZGtdw0.png', aliases: [ 'hd', 	'difícil', 	'hard', 	'dificil',	] },
		{ url: 'https://i.imgur.com/ur0CMwN.png', aliases: [ 'ln', 	'lunático', 'lunatic', 	'luna',		] },
		{ url: 'https://i.imgur.com/YyIbi1C.png', aliases: [ 'ex', 	'extra', 							] },
	],
};

const options = new CommandOptionsManager()
	.addParam('juego', 		['TEXT','NUMBER'], 												'para elegir el juego')
	.addParam('dificultad', ['TEXT'], 	'para establecer la dificultad jugada')
	.addParam('survival', 	{ name: 'calidad', expression: '"clear", "1cc" o "nomiss"' }, 	'para establecer la calidad de supervivencia')
	.addFlag('b', 			['nobomb','nb'], 												'para especificar que se logró sin usar bombas')
	.addFlag(['s','c'], 	['nospecial','ns','noc'], 										'para especificar que se logró sin usar la tecla C')
	.addFlag(['p'], 		['pacifista', 'pacifist'],										'para especificar que se logró sin realizar daño');

module.exports = {
	name: 'tarjeta',
	aliases: [
		'logro',
		'achievement',
	],
	desc: [
		'Para crear una tarjeta de logro personal.',
		'Deberás facilitar un juego (ejemplo: "HSiFS", "128" o "Youyoumu") y la calidad de survival obtenida ("clear", "1cc" o "nomiss")',
		'Adicionalmente, puedes especificar si el logro incluye desafíos personales como `--nobomb`, `--nospecial` y/o `pacifista`',
	].join('\n'),
	flags: [
		'common',
	],
	options: options,
	callx: '<juego> <survival>',
	experimental: false,

	/**
	 * @param {import('../Commons/typings').CommandRequest} request 
	 * @param {import('../Commons/typings').CommandOptions} args 
	 * @param {Boolean} isSlash 
	 */
	async execute(request, args, isSlash = false) {
		//Acción de comando
		if(args.length < 3) return await request.reply(`⚠ Debes ingresar al menos el juego completado, la dificultad y la calidad de supervivencia.\nUsa \`${p_pure(request.guildId).raw}ayuda\` para más información`);

		const bg = backgrounds.find(b => b.aliases.includes(`${isSlash ? args.getString('juego') : args[0]}`.toLowerCase()));
		if(!bg) return await request.reply('⚠ Debes ingresar un nombre o número de juego válido. Solo se permiten juegos oficiales de danmaku tradicional');

		const diff = highlights.difficulty.find(d => d.aliases.includes(`${isSlash ? args.getString('dificultad') : args[1]}`.toLowerCase()));
		if(!diff) return await request.reply(`⚠ Debes ingresar una calidad de survival válida.\nUsa \`${p_pure(request.guildId).raw}ayuda\` para más información`);

		const survivalname = (isSlash ? args.getString('survival') : args[2]).toLowerCase();
		if(!highlights.survival[survivalname]) return await request.reply(`⚠ Debes ingresar una calidad de survival válida.\nUsa \`${p_pure(request.guildId).raw}ayuda\` para más información`);

		//Creación de imagen
    	const canvas = Canvas.createCanvas(640, 1120);
    	const ctx = canvas.getContext('2d');
		const [ bgimg, diffimg, survivalimg, pfp ] = await Promise.all([
			Canvas.loadImage(bg.url),
			Canvas.loadImage(diff.url),
			Canvas.loadImage(highlights.survival[survivalname]),
			Canvas.loadImage(request.user ?? request.author.displayAvatarURL({ format: 'png', dynamic: false, size: 1024 })),
		]);
        ctx.drawImage(bgimg, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(diffimg, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(survivalimg, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(pfp, 38, 804, 156, 156);

		await request.reply({
			content: 'test',
			files: [ new MessageAttachment(canvas.toBuffer(), 'bienvenida.png') ],
		});
	}
};