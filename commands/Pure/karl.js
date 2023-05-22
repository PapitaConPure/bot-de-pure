const { randRange: rr } = require("../../func");
const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

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
	const totalLowFloor = 1.5;
	const totalHighFloor = 2;
	const totalLowWeight = 0.5;
	const totalHighWeight = 1.5;
	const total = rr(totalLowFloor + rarity * totalLowWeight, totalHighFloor + rarity * totalHighWeight, true);
	const instr = Array(total).fill``.map(() => instruments[Math.floor(poolSize * curve(Math.random()))]);
	//Probabilidad de drums
	const r = Math.random();
	if(r > 0.95) instr.push(drums.rare);
	else if(r > 0.5) instr.push(drums.common);
	return instr;
}

const flags = new CommandMetaFlagsManager().add(
	'MEME',
	'GAME',
);
const command = new CommandManager('karl', flags)
	.setAliases('karlos', 'zupija')
	.setDescription('Comando de gacha musical de Karl Zuñiga')
	.setExecution(async request => {
		const rarity = karlRarity();
		return request.reply({
			content:
				`**Buenas, soy Karl (${rarity.join('')}). Combina estas weás, créeme soy licenciado** <:reibu:1107876018171162705> :thumbsup:\n` +
				`<:arrowr:681963688411922460> ${instrumentsPull(rarity.length).join(' ')} <:arrowl:681963688361590897>`
		});
	});

module.exports = command;