const { hourai } = require('../../localdata/config.json'); //Variables globales
const { askColor } = require('../../func'); //Funciones globales

module.exports = {
	name: 'colores',
	aliases: [
		'color', 'roles', 'rol',
		'colours', 'colour', 'colors', 'role',
		'c'
	],
    desc: 'Muestra un tablón de roles de colores básicos para Hourai Doll',
    flags: [
        'hourai'
    ],
	
	async execute({ channel, author, member }, _) {
		const sm = await channel.send({
			content: `Aquí teni los colore po **${author.username}** <:reibu:686220828773318663>`,
			files: [hourai.images.colors]
		});
		askColor(sm, member);
    },

	async interact(interaction) {
		await interaction.reply({
			allowedMentions: { repliedUser: true },
			content: `Aquí teni los colore po **${interaction.member.user.username}** <:reibu:686220828773318663>`,
			files: [hourai.images.colors]
		});
		const sm = await interaction.fetchReply();

		askColor(sm, interaction.member);
	}
};