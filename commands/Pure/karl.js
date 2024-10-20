const { CommandTags, CommandManager } = require('../Commons/commands');
const { randRange: randRange, rand } = require("../../func");
const { EmbedBuilder } = require('discord.js');

const star = '⭐';

const instruments = [
	//Ordenados de común a raro
	':banjo:',
	':accordion:',
	':aquarius:',
	':flute:',
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

const tiers = [
	{ n: 1, weight: 1.000, hex: 0xA0A0A0, label: 'Común',        img: '', karl: 'Hola, soy Karl. No me hago responsable por esta mamadera <:reibu:1107876018171162705>' },
	{ n: 2, weight: 0.700, hex: 0x4CAF50, label: 'Raro',         img: '', karl: 'Buenas, soy Karl. Combina estas weás, créeme soy licenciado <:reibu:1107876018171162705> :thumbsup:' },
	{ n: 3, weight: 0.300, hex: 0x2196F3, label: 'Épico',        img: '', karl: 'Aló, soy Karl. ¿Y esa mamasita? Te traes unos MIDIS muy buenos eh <:reibu:1107876018171162705> :thumbsup:' },
	{ n: 4, weight: 0.150, hex: 0x9C27B0, label: 'Pachamama',    img: '', karl: 'Mucho gusto, soy Karl. Te traes unas trompetas muy chad la verdad :muscle: <:reibu:1107876018171162705>' },
	{ n: 5, weight: 0.020, hex: 0xFF9800, label: 'Machu Picchu', img: '', karl: 'Muy buenas tardes, soy Karl y... QUÉ ES ESO LOCO, TREMENDO MIDI <:reibu:1107876018171162705> :ok_hand:' },
	{ n: 6, weight: 0.001, hex: 0xE53935, label: 'Perútensoku',  img: '', karl: 'TAMARE OE, QUE SOY KARL CAUSA. AHORA SÍ ME LAS VAS A PAGAR ZUN :muscle: <:reibu:1107876018171162705> :trumpet:' },
];

const qualityCurveInfluence = 0.75; //Influencia de la curva de calidad de instrumento
const qualityCurveMidpoint = 3;     //Punto de rareza en el que la curva de calidad de instrumento forma una línea recta

const countRawMin = 1.5;       //Mínimo base de cantidad de instrumentos
const countRawMax = 2;         //Máximo base de cantidad de instrumentos
const countMinOffsetFac = 0.5; //Factor de desplazamiento del mínimo de cantidad de instrumentos según la rareza
const countMaxOffsetFac = 1.5; //Factor de desplazamiento del máximo de cantidad de instrumentos según la rareza

const flags = new CommandTags().add(
	'MEME',
	'GAME',
);
const command = new CommandManager('karl', flags)
	.setAliases('karlos', 'zupija')
	.setDescription('Comando de gacha musical de Karl Zuñiga')
	.setExecution(async request => {
		const tier = getKarlTier();
		const stars = Array(tier.n).fill(star).join('');
		const pulled = pullInstruments(tier.n);

		const embed = new EmbedBuilder()
			.setColor(tier.hex)
			.setFooter({
				text: `Karl ${tier.label} • ${stars}`,
				iconURL: 'https://i.imgur.com/tV5LHKz.png'
			})
			.addFields({
				name: tier.karl,
				value: pulled.join(' '),
			});

		return request.reply({ embeds: [embed] });
	});

module.exports = command;

function getKarlTier() {
	const weights = tiers.map(t => t.weight);
	const total = weights.reduce((a, b) => a + b);
	
	let r = Math.random() * total;
	for(let i = 0; i < tiers.length; i++) {
		if(r < weights[i])
			return tiers[i];
		else
			r -= weights[i];
	}

	return tiers[tiers.length - 1];
};

/**@param {Number} tier*/
function pullInstruments(tier) {
	const poolSize = instruments.length; //Cantidad de instrumentos en pileta

	//Cantidad total de instrumentos (sin contar drums)
	const count = randRange(
		countRawMin + tier * countMinOffsetFac,
		countRawMax + tier * countMaxOffsetFac,
		true);

	//Curva de probabilidad de instrumentos
	const curve = (/**@type {Number}*/x) => Math.pow(x, Math.pow(2, (qualityCurveMidpoint - tier) * qualityCurveInfluence));
	const pickInstrument = () => instruments[Math.trunc(poolSize * curve(Math.random()))];
	const instr = Array(count).fill``.map(pickInstrument);

	//Probabilidad de drums
	const r = Math.random();
	if(r > 0.95) instr.push(drums.rare);
	else if(r > 0.5) instr.push(drums.common);

	return instr;
}
