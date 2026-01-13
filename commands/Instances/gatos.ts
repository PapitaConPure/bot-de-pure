import { EmbedBuilder, Colors } from 'discord.js';
import { auditError } from '../../systems/others/auditor';
import { CommandTags, Command } from '../Commons/';
import axios from 'axios';

const tags = new CommandTags().add('COMMON');

const command = new Command('gatos', tags)
	.setAliases(
        'gato', 'felino', 'gatito', 'gatitos', 'miau', 'michi', 'michis',
        'cats', 'cat', 'meow', 'nya', 'kitty', 'kitties'
    )
	.setLongDescription('Muestra imágenes de gatitos')
	.setLongDescription(
		'Muestra imágenes de gatitos.',
		'Fuente: https://cataas.com'
	)
	.setExecution(async request => {
		const kittenData = (await axios.get('https://cataas.com/cat?json=true').catch(auditError));

		const embed = new EmbedBuilder();

		if(kittenData?.status !== 200) {
			embed.addFields({ name: 'Error', value: 'El mundo de los gatitos no contactó con nosotros esta vez...' })
				.setColor(Colors.Red);
			return request.reply({ embeds: [embed] });
		}
		
		const { url: catUrl } = kittenData.data;
		
		embed.setTitle('Gatitos 🥺')
			.setImage(catUrl)
			.setColor(0xffc0cb);
			
		return request.reply({ embeds: [embed] });
	});

export default command;
