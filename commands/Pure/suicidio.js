module.exports = {
	name: 'suicidio',
	aliases: [
		'suicidar', 'suicidarse',
		'suicide'
	],
	desc: 'Comando para recibir el rol __Hanged Doll__ en Hourai Doll.',
	flags: [
		'hourai',
		'meme'
	],

	async execute(message, args) {
		const hd = '682629889702363143'; //Hanged Doll
		const member = message.member;
		if(!member.roles.cache.some(r => r.id === hd)) {
			member.roles.add(hd);
			message.channel.send({
				reply: { messageReference: message.id },
				content: '<:houraidoll:853402616208949279> Shanghai Shanghai Shanghai Shanghai\nHourai Hourai Hourai Hourai'
			});
		}
	},

	async interact(interaction) {
		const hd = '682629889702363143'; //Hanged Doll
		const member = interaction.member;
		if(!member.roles.cache.some(r => r.id === hd)) {
			member.roles.add(hd);
			interaction.reply({ content: '<:houraidoll:853402616208949279> Shanghai Shanghai Shanghai Shanghai\nHourai Hourai Hourai Hourai' });
		}
	}
};