const { randRange } = require("../../func");

const emot = [
	'Mi polola', 'Mi reina', 'Mi princesa', 'Mi esposa', 'Mi mujer',
	':wine_glass:', ':wine_glass::wine_glass:', ':wine_glass::wine_glass::wine_glass:',
	'No avancé en el manga de Komachi', 'Mañana lo hago', 'Otro día', 'Mañana sin falta', 'Esta semana lo termino', 'Procrastinar'
];

module.exports = {
	name: 'bern',
	aliases: [
        'bewny', 'polola',
		'procrastinar'
    ],
    desc: 'Comando de procrastinación de GoddamnBernkastel',
    flags: [
        'meme'
    ],
	experimental: true,

	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} args
	 * @param {Boolean} isSlash
	 */
	async execute(request, _, isSlash = false) {
		const lel = [
			'654504689873977347',
			'722334924845350973',
			'722334924845350973',
			'697323104141049867',
		].map(eid => request.client.emojis.cache.get(eid));
		const selection = randRange(0, emot.length);

		const sentqueue = (await Promise.all([
			request.reply({ content: `**${emot[selection]}** <:bewny:722334924845350973>` }),
			isSlash ? request.fetchReply() : null,
		])).filter(sq => sq);
		const sent = sentqueue.pop();
		if(selection <= 4)
			await sent.react(lel[0]);
		else if(selection > 4 && selection <= 7)
			await sent.react(lel[1]);
		else
			await Promise.all([
				sent.react(lel[2]),
				sent.react(lel[3]),
			]);
		return sent;
    },
};