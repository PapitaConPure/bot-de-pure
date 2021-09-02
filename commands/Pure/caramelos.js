const { askCandy } = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'caramelos',
	aliases: [
		'caramelo',
		'candy', 'candies', 'milky'
	],
    desc: 'Otorga caramelos al reaccionar al mensaje generado',
    flags: [
        'hourai',
        'outdated'
    ],
	
	async execute(message, args) {
		askCandy(message.member, message.channel);
    },
	
	async interact(interaction) {
		await interaction.reply({ content: 'Procesando...', ephemeral: true });
		const message = await interaction.fetchReply();
		askCandy(message.member, message.channel);
		message.delete();
    },
};