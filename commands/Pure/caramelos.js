const { askCandy } = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'caramelos',
	aliases: [
		'caramelo',
		'candy', 'candies', 'milky'
	],
    desc: 'Otorga caramelos al reaccionar (solo Hourai Doll)',
    flags: [
        'hourai',
    ],
	
	async execute(message, _) {
		askCandy(message.member, message.channel);
    },
	
	async interact(interaction, _) {
		await interaction.reply({ content: 'Procesando...' });
		const message = await interaction.fetchReply();
		askCandy(message.member, message.channel);
		message.delete();
    },
};