const hd = '682629889702363143'; //Hanged Doll

module.exports = {
	name: 'suicidio',
	aliases: [
		'suicidar', 'suicidarse',
		'suicide'
	],
	brief: 'Te otorga el rol "Hanged Doll" (solo Hourai Doll)',
	desc: 'Te otorga el rol __Hanged Doll__ en Hourai Doll.',
	flags: [
		'hourai',
		'meme'
	],

	async execute({ id, channel, member }, _) {
		if(!member.roles.cache.some(r => r.id === hd)) {
			member.roles.add(hd);
			channel.send({
				reply: { messageReference: id },
				content: '<:houraidoll:853402616208949279> Shanghai Shanghai Shanghai Shanghai\nHourai Hourai Hourai Hourai'
			});
		}
	},

	async interact(interaction) {
		if(!interaction.member.roles.cache.some(r => r.id === hd)) {
			interaction.member.roles.add(hd);
			interaction.reply({ content: '<:houraidoll:853402616208949279> Shanghai Shanghai Shanghai Shanghai\nHourai Hourai Hourai Hourai' });
		}
	}
};