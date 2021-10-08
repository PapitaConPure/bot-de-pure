const { randRange: rr } = require("../../func");

const star = '<:tags:704612794921779290>';

const instruments = [
	':musical_keyboard:',
	':saxophone:',
	':trumpet:',
	':guitar:',
	':banjo:',
	':violin:',
	':accordion:',
	':aquarius:',
];

const drums = {
	common: ':drum:',
	rare: ':long_drum:',
};

const karlRarity = () => {
	const rarity = [];
	const r = Math.random();
	const probs = [ 1, 0.6, 0.25, 0.1, 0.02 ];
	for(let i = 0; i < probs.length; i++)
		if(probs[i] > r) rarity.push(star);
	return rarity;
};

const randomInstruments = () => {
	const inst = Array(rr(2, 6)).fill``.map(() => instruments[rr(0, instruments.length)]);
	const r = Math.random();
	if(r > 0.95) inst.push(drums.rare);
	else if(r > 0.5) inst.push(drums.common);
	return inst;
}

module.exports = {
	name: 'karl',
	aliases: [
        'karlos', 'zupija'
    ],
    desc: 'Comando de gacha musical de Karl Zuñiga',
    flags: [
        'meme'
    ],
	
	async execute({ channel }, _) {
		channel.send({
			content:
				`**Buenas, soy Karl (${karlRarity().join(' ')}). Combina estas weás, créeme soy licenciado** <:reibu:686220828773318663> :thumbsup:\n` +
				`<:arrowr:681963688411922460> ${randomInstruments().join(' ')} <:arrowl:681963688361590897>`
		});
    },
	
	async interact(interaction) {
		interaction.reply({
			content:
				`**Buenas, soy Karl (${karlRarity().join(' ')}). Combina estas weás, créeme soy licenciado** <:reibu:686220828773318663> :thumbsup:\n` +
				`<:arrowr:681963688411922460> ${randomInstruments().join(' ')} <:arrowl:681963688361590897>`
		});
    },
};