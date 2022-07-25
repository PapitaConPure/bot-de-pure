const { CommandMetaFlagsManager } = require('../Commons/commands');

const hd = '682629889702363143'; //Hanged Doll

module.exports = {
	name: 'suicidio',
	aliases: [
		'suicidar', 'suicidarse',
		'suicide'
	],
	brief: 'Te otorga el rol "Hanged Doll" (solo Hourai Doll)',
	desc: 'Te otorga el rol __Hanged Doll__ en Hourai Doll.',
	flags: new CommandMetaFlagsManager().add(
		'HOURAI',
		'MEME',
	),
	experimental: true,

	async execute(request, _) {
		const { member } = request;
		if(member.roles.cache.has(hd))
			return request.reply({ content: '\'pérate, cómo weá estai hablando <:junkNo:697321858407727224>' });

		await member.roles.add(hd, 'Por pelotudo');
		return request.reply({ content: '<:houraidoll:853402616208949279> Shanghai Shanghai Shanghai Shanghai\nHourai Hourai Hourai Hourai' });
	},
};