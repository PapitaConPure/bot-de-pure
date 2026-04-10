import { CommandTags, Command } from '../commons';
import { makeWeightedDecision, randRange, WeightedDecision } from '@/func';
import { ContainerBuilder, MessageFlags } from 'discord.js';

//Ordenados de común a raro
const instruments = ([
	'🪕',
	':accordion:',
	'♒',
	':flute:',
	'🎷',
	'🎹',
	'🎸',
	'🎻',
	'🎺'
]) as const;
const drums = ({
	common: '🥁',
	rare: ':long_drum:',
}) as const;

interface Tier {
	n: number;
	hex: number;
	label: string;
	image?: string;
	karl: string;
}

const tiers: WeightedDecision<Tier>[] = ([
	{ weight: 1.000, value: { n: 1, hex: 0xA0A0A0, label: 'Común',        image: 'https://i.imgur.com/ShmLYeU.png', karl: 'Hola, soy Karl. No me hago responsable por esta mamadera <:reibu:1107876018171162705>' } },
	{ weight: 0.700, value: { n: 2, hex: 0x4CAF50, label: 'Raro',         image: 'https://i.imgur.com/5xi2Ub3.png', karl: 'Buenas, soy Karl. Combina estas weás, créeme soy licenciado <:reibu:1107876018171162705> :thumbsup:' } },
	{ weight: 0.300, value: { n: 3, hex: 0x2196F3, label: 'Épico',        image: 'https://i.imgur.com/uMcSxEf.png', karl: 'Aló, soy Karl. ¿Y esa mamasita? Te traes unos MIDIS muy buenos eh <:reibu:1107876018171162705> :thumbsup:' } },
	{ weight: 0.150, value: { n: 4, hex: 0x9C27B0, label: 'Pachamama',    image: 'https://i.imgur.com/uMcSxEf.png', karl: 'Mucho gusto, soy Karl. Te traes unas trompetas muy chad la verdad :muscle: <:reibu:1107876018171162705>' } },
	{ weight: 0.020, value: { n: 5, hex: 0xFF9800, label: 'Machu Picchu', image: 'https://i.imgur.com/7h840q1.png', karl: 'Muy buenas tardes, soy Karl y... QUÉ ES ESO LOCO, TREMENDO MIDI <:reibu:1107876018171162705> :ok_hand:' } },
	{ weight: 0.001, value: { n: 6, hex: 0xE53935, label: 'Perútensoku',  image: 'https://i.imgur.com/qbPwCy9.png', karl: 'TAMARE OE, QUE SOY KARL CAUSA. AHORA SÍ ME LAS VAS A PAGAR ZUN :muscle: <:reibu:1107876018171162705> :trumpet:' } },
]);

const qualityCurveInfluence = 0.75; //Influencia de la curva de calidad de instrumento
const qualityCurveMidpoint = 3;     //Punto de rareza en el que la curva de calidad de instrumento forma una línea recta

const countRawMin = 1.5;       //Mínimo base de cantidad de instrumentos
const countRawMax = 2;         //Máximo base de cantidad de instrumentos
const countMinOffsetFac = 0.5; //Factor de desplazamiento del mínimo de cantidad de instrumentos según la rareza
const countMaxOffsetFac = 1.5; //Factor de desplazamiento del máximo de cantidad de instrumentos según la rareza

const tags = new CommandTags().add(
	'MEME',
	'GAME',
);

const command = new Command('karl', tags)
	.setAliases('karlos', 'zupija', 'karsuniga', 'zuñiga')
	.setDescription('Comando de gacha musical de Karl Zuñiga')
	.setExecution(async request => {
		const tier = makeWeightedDecision(tiers);
		const starsText = Array(tier.n).fill('⭐').join('');
		const pulledInstruments = pullInstruments(tier.n);

		const container = new ContainerBuilder()
			.setAccentColor(tier.hex)
			.addSectionComponents(section =>
				section
					.addTextDisplayComponents(
						textDisplay => textDisplay.setContent([
							`${tier.karl}`,
							`# ${pulledInstruments.join(' ')}`,
							`### -# Karl ${tier.label} — ${starsText}`,
						].join('\n')),
					)
					.setThumbnailAccessory(thumbnail =>
						thumbnail
							.setURL(tier.image || 'https://i.imgur.com/tV5LHKz.png')
							.setDescription('El misericordioso Karl Zuñiga'),
					),
			);

		return request.reply({
			flags: MessageFlags.IsComponentsV2,
			components: [ container ],
		});
	});

export default command;

function pullInstruments(tier: number) {
	const poolSize = instruments.length; //Cantidad de instrumentos en pileta

	//Cantidad total de instrumentos (sin contar drums)
	const count = randRange(
		countRawMin + tier * countMinOffsetFac,
		countRawMax + tier * countMaxOffsetFac,
		true);

	//Curva de probabilidad de instrumentos
	const curveFn = (x: number) => Math.pow(x, Math.pow(2, (qualityCurveMidpoint - tier) * qualityCurveInfluence));
	const pickInstrument = () => instruments[Math.trunc(poolSize * curveFn(Math.random()))];
	const instr: string[] = Array(count).fill``.map(pickInstrument);

	//Probabilidad de drums
	const r = Math.random();
	if(r > 0.95) instr.push(drums.rare);
	else if(r > 0.5) instr.push(drums.common);

	return instr;
}
