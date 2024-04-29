const { EmbedBuilder, Colors } = require('discord.js');
const { default: axios } = require('axios');
const { auditError } = require('../../systems/auditor');
const { CommandTags, CommandManager } = require('../Commons/commands');

const flags = new CommandTags().add('COMMON');
const command = new CommandManager('gatos', flags)
	.setAliases(
        'gato', 'felino', 'gatito', 'gatitos', 'miau', 'michi', 'michis',
        'cats', 'cat', 'meow', 'nya', 'kitty', 'kitties'
    )
	.setLongDescription('Muestra imágenes de gatitos. API: https://cataas.com')
	.setExecution(async request => {
		const kittenData = (await axios.get('https://cataas.com/cat').catch(auditError));

		const embed = new EmbedBuilder();

		if(kittenData?.status !== 200) {
			embed.addFields({ name: 'Error', value: 'El mundo de los gatitos no contactó con nosotros esta vez...' })
				.setColor(Colors.Red);
			return request.reply({ embeds: [embed] });
		}
		
		const { _id } = kittenData.data;
		const catUrl = `https://cataas.com/cat/${_id}`;
		
		embed.setTitle('Gatitos 🥺')
			.setImage(catUrl)
			.setColor(0xffc0cb);
			
		return request.reply({ embeds: [embed] });
	});

module.exports = command;