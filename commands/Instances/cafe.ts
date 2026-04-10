import { EmbedBuilder, Colors, AttachmentBuilder } from 'discord.js';
import { CommandTags, Command } from '../commons';
import { fetchExt } from '../../utils/fetchext';

const tags = new CommandTags().add('COMMON');

const command = new Command('café', tags)
	.setAliases('cafe', 'cafecito', 'coffee', 'cawfee')
	.setLongDescription('Muestra imágenes de café. API: https://coffee.alexflipnote.dev')
	.setExecution(async request => {
		const fetchResult = await fetchExt('https://coffee.alexflipnote.dev/random', { type: 'buffer' });

		if(!fetchResult.success) {
			return request.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(Colors.Orange)
						.setDescription('Problema de conexión a tercero'),
				],
			});
		}

		if(!fetchResult.response.ok) {
			return request.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(Colors.Red)
						.setDescription('Error de solicitud a tercero'),
				],
			});
		}

		const image = fetchResult.data;

		const replyBody = {
			embeds: [
				new EmbedBuilder()
					.setColor(0x6a4928)
					.setTitle('Café ☕')
					.setImage('attachment://cawfee.png'),
			],
			files: [
				new AttachmentBuilder(image, { name: 'cawfee.png' })
			],
		};

		return request.reply(replyBody);
	});

export default command;
