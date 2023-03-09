const { EmbedBuilder, Colors } = require('discord.js');
const { default: axios } = require('axios');
const { rand } = require('../../func');
const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const r = {
	api: 'https://api.giphy.com/v1/gifs/search',
	key: 'Qu29veK701szqoFK6tXgOiybuc1q3PaX',
	limit: 10,
};

const flags = new CommandMetaFlagsManager().add('COMMON');
const command = new CommandManager('café', flags)
	.setAliases('cafe', 'cafecito', 'coffee', 'cawfee')
	.setLongDescription('Muestra imágenes de café')
	.setExecution(async request => {
		let err;
		const offset = rand(30);
		const { data } = await axios.get(`${r.api}?api_key=${r.key}&q=coffee&offset=${offset}&limit=${r.limit}`)
			.then(response => response.data)
			.catch(e => {
				err = `\`\`\`\n${e.message}\n\`\`\``;
				return { data: undefined };
			});
		const selected = data[rand(r.limit)];

		//Crear y devolver embed
		const embed = new EmbedBuilder();
		
		if(!err)
			embed.addFields({ name: 'Café ☕', value: `${selected.bitly_url}` })
				.setImage(`https://media.giphy.com/media/${selected.id}/giphy.gif`)
				.setColor(0x6a4928);
		else
			embed.addFields({ name: 'Error de solicitud a tercero', value: err })
				.setColor(Colors.Red);
		
		await request.reply({ embeds: [embed] });
	});

module.exports = command;