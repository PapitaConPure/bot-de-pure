const { MessageEmbed } = require('discord.js');
const { default: axios } = require('axios');

module.exports = {
	name: 'gatos',
	aliases: [
        'gato', 'felino', 'gatito', 'gatitos', 'miau', 'michi', 'michis',
        'cats', 'cat', 'meow', 'nya', 'kitty', 'kitties'
    ],
    desc: 'Muestra imágenes de gatitos uwu',
    flags: [
        'common',
    ],
	experimental: true,
	
	async execute(message, _, isSlash = false) {
		//Acción de comando
		let err;
		const { file } = await axios.get('https://aws.random.cat/meow')
			.then(response => response.data)
			.catch(e => {
				err = `\`\`\`\n${e.message}\n\`\`\``;
				return { data: undefined };
			});

		//Crear y usar embed
		const embed = new MessageEmbed();
		
		if(!err)
			embed.addField('Gatitos 🥺', file)
				.setImage(file)
				.setColor('#ffc0cb');
		else
			embed.addField('Error', err)
				.setColor('RED');
			
		await message.reply({ embeds: [embed] });
    },
};