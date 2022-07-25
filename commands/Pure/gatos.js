const { MessageEmbed } = require('discord.js');
const { default: axios } = require('axios');
const { auditError } = require('../../systems/auditor');
const { CommandMetaFlagsManager } = require('../Commons/commands');

module.exports = {
	name: 'gatos',
	aliases: [
        'gato', 'felino', 'gatito', 'gatitos', 'miau', 'michi', 'michis',
        'cats', 'cat', 'meow', 'nya', 'kitty', 'kitties'
    ],
    desc: 'Muestra imágenes de gatitos uwu',
    flags: new CommandMetaFlagsManager().add('COMMON'),
	experimental: true,
	
	async execute(message, _, isSlash = false) {
		//Acción de comando
		let err;
		const { file } = (await axios.get('https://aws.random.cat/meow').catch(auditError))?.data;

		//Crear y usar embed
		const embed = new MessageEmbed();
		
		if(!file)
			embed.addField('Error', 'El mundo de los gatitos no contactó con nosotros esta vez...')
				.setColor('RED');
		else
			embed.addField('Gatitos 🥺', file)
				.setImage(file)
				.setColor('#ffc0cb');
			
		await message.reply({ embeds: [embed] });
    },
};