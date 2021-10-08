const { MessageEmbed } = require('discord.js'); //Integrar discord.js
const fetch = require('node-fetch');

module.exports = {
	name: 'gatos',
	aliases: [
        'gato', 'felino', 'gatito', 'gatitos', 'miau', 'michi', 'michis',
        'cats', 'cat', 'meow', 'nya', 'kitty', 'kitties'
    ],
    desc: 'Muestra imágenes de gatitos uwu',
    flags: [
        'common'
    ],
	
	async execute(message, args) {
		let err;
		const { file } = await fetch('https://aws.random.cat/meow')
			.then(response => response.json())
			.catch(e => {
				err = `\`\`\`\n${e.message}\n\`\`\``;
				return { file: undefined };
			});

		//Crear y usar embed
		const Embed = new MessageEmbed()
			.setColor('#ffc0cb')
			.setTitle('Gatitos uwu');
		if(err === undefined)
			Embed
				.addField('Salsa', file)
				.setImage(file);
		else
			Embed.addField('Salsa', err);
			
		await message.channel.send({ embeds: [Embed] });
    },
	
	async interact(interaction, _) {
		let err;
		const { file } = await fetch('https://aws.random.cat/meow')
			.then(response => response.json())
			.catch(e => {
				err = `\`\`\`\n${e.message}\n\`\`\``;
				return { file: undefined };
			});

		//Crear y usar embed
		const Embed = new MessageEmbed()
			.setColor('#ffc0cb')
			.setTitle('Gatitos uwu');
		if(err === undefined)
			Embed
				.addField('Salsa', file)
				.setImage(file);
		else
			Embed.addField('Se produjo un error al recibir datos de un tercero', err);
			
		await interaction.reply({ embeds: [Embed] });
    },
};