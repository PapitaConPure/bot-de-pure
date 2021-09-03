const { randRange: rr } = require("../../func");

const emot = [
	':musical_keyboard:', ':saxophone:', ':trumpet:', ':violin:', ':guitar:',' :banjo:', ':aquarius:'
];

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
				`**Buenas, soy Karl. Combina estas weás, créeme soy licenciado** <:reibu:686220828773318663> :thumbsup:\n` +
				`<:arrowr:681963688411922460> ${Array(rr(2, 6)).fill``.map(() => emot[rr(0, emot.length)]).join(' ')} <:arrowl:681963688361590897>`
		});
    },
	
	async interact({ channel }, _) {
		channel.send({
			content:
				`**Buenas, soy Karl. Combina estas weás, créeme soy licenciado** <:reibu:686220828773318663> :thumbsup:\n` +
				`<:arrowr:681963688411922460> ${Array(rr(2, 6)).fill``.map(() => emot[rr(0, emot.length)]).join(' ')} <:arrowl:681963688361590897>`
		});
    },
};