const { EmbedBuilder, Colors } = require('discord.js');
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
		const kittenData = (await axios.get('https://aws.random.cat/meow').catch(auditError))?.data;

		const embed = new EmbedBuilder();

		if(!kittenData?.file) {
			embed.addFields({ name: 'Error', value: 'El mundo de los gatitos no contactó con nosotros esta vez...' })
				.setColor(Colors.Red);
			return request.reply({ embeds: [embed] });
		}
		
		const { file } = kittenData;
		
		embed.addFields({ name: 'Gatitos 🥺', value: file })
			.setImage(file)
			.setColor(0xffc0cb);
			
		return request.reply({ embeds: [embed] });
	});

module.exports = command;