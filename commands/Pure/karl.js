const { randRange: rr } = require("../../func");

const star = '<:tags:704612794921779290>';
const instruments = [
	':banjo:',
	':accordion:',
	':aquarius:',
	':saxophone:',
	':musical_keyboard:',
	':guitar:',
	':violin:',
	':trumpet:',
];
const drums = {
	common: ':drum:',
	rare: ':long_drum:',
};
const karlRarity = () => {
	const rarity = [];
	const r = Math.random();
	const probs = [ 1, .7, .3, .15, .02, 0.001 ];
	for(let i = 0; i < probs.length; i++)
		if(probs[i] > r) rarity.push(star);
	return rarity;
};
const instrumentsPull = (rarity) => {
	//Curva de probabilidad de instrumentos
	const poolSize = instruments.length; //Cantidad de instrumentos en pileta
	const influence = 0.75; //Influencia de la curva
	const midpoint = 3; //Punto de rareza en el que la curva forma una línea recta
	const curve = (x) => Math.pow(x, Math.pow(2, (midpoint - rarity) * influence));
	const total = rr(1.5 + rarity * 0.5, 2 + rarity * 1.5, true);
	const instr = Array(total).fill``.map(() => instruments[Math.floor(poolSize * curve(Math.random()))]);
	//Probabilidad de drums
	const r = Math.random();
	if(r > 0.95) instr.push(drums.rare);
	else if(r > 0.5) instr.push(drums.common);
	return instr;
}

module.exports = {
	name: 'karl',
	aliases: [
        'karlos', 'zupija'
    ],
    desc: 'Comando de gacha musical de Karl Zuñiga',
    flags: [
        'meme',
		'game'
    ],
	experimental: true,
	
	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {Boolean} isSlash
	 */
	async execute(request, _, isSlash = false) {
		const kr = karlRarity();
		request.reply({
			content:
				`**Buenas, soy Karl (${kr.join('')}). Combina estas weás, créeme soy licenciado** <:reibu:686220828773318663> :thumbsup:\n` +
				`<:arrowr:681963688411922460> ${instrumentsPull(kr.length).join(' ')} <:arrowl:681963688361590897>`
		});
    },
};