import { EmbedBuilder, Colors, AttachmentBuilder } from 'discord.js';
import { CommandTags, Command } from '../Commons/';
import axios from 'axios';

const tags = new CommandTags().add('COMMON');

const command = new Command('café', tags)
	.setAliases('cafe', 'cafecito', 'coffee', 'cawfee')
	.setLongDescription('Muestra imágenes de café. API: https://coffee.alexflipnote.dev')
	.setExecution(async request => {
		const fetched = await axios.get('https://coffee.alexflipnote.dev/random', { responseType: 'arraybuffer' });

		const replyBody = {
			embeds: [ new EmbedBuilder() ],
			files: null,
		};
		
		if(fetched.status === 200) {
			const image = fetched.data;
			replyBody.embeds[0]
				.setColor(0x6a4928)
				.setTitle('Café ☕')
				.setImage('attachment://cawfee.png');
			replyBody.files = [ new AttachmentBuilder(image, { name: 'cawfee.png' }) ];
		} else {
			replyBody.embeds[0]
				.setColor(Colors.Red)
				.setDescription('Error de solicitud a tercero');
		}

		return request.reply(replyBody);
	});

export default command;
