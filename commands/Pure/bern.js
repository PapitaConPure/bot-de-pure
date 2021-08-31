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
    options: [

    ],

	async execute(message, args) {
		const lel = [
			message.client.emojis.cache.get('654504689873977347'), //Kogablush
			message.client.emojis.cache.get('722334924845350973'), //Chad
			message.client.emojis.cache.get('697320983106945054'), //Pepe
			message.client.emojis.cache.get('697323104141049867'), //Kokocrong
		];
		const selection = randRange(0, emot.length);
		
		message.channel.send({ content: `**${emot[selection]}** <:bewny:722334924845350973>` }).then(sent => {
			if(selection <= 4) {
				sent.react(lel[0]);
			} else if(selection > 4 && selection <= 7) {
				sent.react(lel[1]);
			} else {
				sent.react(lel[2])
					.then(() => sent.react(lel[3]));
			}
		});
    },

	async interact(interaction) {
		const lel = [
			interaction.client.emojis.cache.get('654504689873977347'), //Kogablush
			interaction.client.emojis.cache.get('722334924845350973'), //Chad
			interaction.client.emojis.cache.get('697320983106945054'), //Pepe
			interaction.client.emojis.cache.get('697323104141049867'), //Kokocrong
		];
		const selection = randRange(0, emot.length);
		await interaction.reply({ content: `**${emot[selection]}** <:bewny:722334924845350973>` })
		const reply = await interaction.fetchReply();

		if(selection <= 4)
			await reply.react(lel[0]);
		else if(selection > 4 && selection <= 7)
			await reply.react(lel[1]);
		else
			await Promise.all([
				reply.react(lel[2]),
				reply.react(lel[3])
			]);
    }
};