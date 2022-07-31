const { MessageEmbed } = require('discord.js');
const { default: axios } = require('axios');
const { auditError } = require('../../systems/auditor');
const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const flags = new CommandMetaFlagsManager().add('COMMON');
const command = new CommandManager('gatos', flags)
	.setAliases(
        'gato', 'felino', 'gatito', 'gatitos', 'miau', 'michi', 'michis',
        'cats', 'cat', 'meow', 'nya', 'kitty', 'kitties'
    )
	.setLongDescription('Muestra imágenes de gatitos uwu')
	.setExecution(async request => {
		const { file } = (await axios.get('https://aws.random.cat/meow').catch(auditError))?.data;

		//Crear y usar embed
		const embed = new MessageEmbed();
		
		if(!file)
			embed.addFields({ name: 'Error', value: 'El mundo de los gatitos no contactó con nosotros esta vez...' })
				.setColor('RED');
		else
			embed.addFields({ name: 'Gatitos 🥺', value: file })
				.setImage(file)
				.setColor('#ffc0cb');
			
		return request.reply({ embeds: [embed] });
	});

module.exports = command;