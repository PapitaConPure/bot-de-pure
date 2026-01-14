import { Colors, ContainerBuilder, MessageFlags } from 'discord.js';
import { CommandTags, Command } from '../Commons/';
import axios, { AxiosError } from 'axios';

const tags = new CommandTags().add('COMMON');

const command = new Command('gatos', tags)
	.setAliases(
        'gato', 'felino', 'gatito', 'gatitos', 'miau', 'michi', 'michis',
        'cats', 'cat', 'meow', 'kitty', 'kitties',
		'neko', 'nya',
    )
	.setLongDescription('Muestra imágenes de gatitos')
	.setLongDescription(
		'Muestra imágenes de gatitos.',
		'Fuente: https://cataas.com'
	)
	.setExecution(async request => {
		try {
			const kittenData = await axios.get('https://cataas.com/cat?json=true', {
				validateStatus: (status) => status === 200,
			});

			const { url: catUrl } = kittenData.data;

			const container = new ContainerBuilder()
				.setAccentColor(0xffc0cb)
				.addMediaGalleryComponents(mediaGallery =>
					mediaGallery.addItems(mediaGalleryItem =>
						mediaGalleryItem
							.setDescription('🐈')
							.setURL(catUrl)
					)
				)
				.addTextDisplayComponents(
					textDisplay => textDisplay.setContent('## 🥺 Gatitos'),
				);

			return request.reply({
				flags: MessageFlags.IsComponentsV2,
				components: [container],
			});
		} catch(err) {
			if(!(err instanceof AxiosError))
				throw err;

			const container = new ContainerBuilder()
				.setAccentColor(Colors.Red)
				.addTextDisplayComponents(
					textDisplay => textDisplay.setContent([
						'## Error',
						'El mundo de los gatitos no contactó con nosotros esta vez...',
					].join('\n')),
				);

			return request.reply({
				flags: MessageFlags.IsComponentsV2,
				components: [container],
			});
		}
	});

export default command;
