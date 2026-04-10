import { Colors, ContainerBuilder, MessageFlags } from 'discord.js';
import { CommandTags, Command } from '../commons';
import { fetchExt } from '@/utils/fetchext';

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
		const fetchResult = await fetchExt<CatAASJSONSchema>('https://cataas.com/cat?json=true');

		if(fetchResult.success === false) {
			const container = new ContainerBuilder()
				.setAccentColor(Colors.Red)
				.addTextDisplayComponents(
					textDisplay => textDisplay.setContent([
						'## Error',
						'El mundo de los gatitos no contactó con nosotros esta vez...',
					].join('\n')),
					textDisplay => textDisplay.setContent([
						'```',
						`${fetchResult.error.name ? `${fetchResult.error.name}: ` : ''}${fetchResult.error.message}`,
						'```',
					].join('\n'))
				);

			return request.reply({
				flags: MessageFlags.IsComponentsV2,
				components: [ container ],
			});
		}

		const { url: catUrl } = fetchResult.data;

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
			components: [ container ],
		});
	});

export default command;

interface CatAASJSONSchema {
	id: string;
	tags: string[];
	created_at: string;
	url: string;
	mimetype: string;
}
