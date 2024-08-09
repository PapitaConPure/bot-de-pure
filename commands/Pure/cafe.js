const { EmbedBuilder, Colors, AttachmentBuilder } = require('discord.js');
const { default: axios } = require('axios');
const { CommandTags, CommandManager } = require('../Commons/commands');

const flags = new CommandTags().add('COMMON');
const command = new CommandManager('café', flags)
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

module.exports = command;