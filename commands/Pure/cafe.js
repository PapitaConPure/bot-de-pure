const { MessageEmbed } = require('discord.js');
const { default: axios } = require('axios');
const { rand } = require('../../func');
const { CommandMetaFlagsManager } = require('../Commons/commands');

const r = {
	api: 'https://api.giphy.com/v1/gifs/search',
	key: 'Qu29veK701szqoFK6tXgOiybuc1q3PaX',
	limit: 10,
};

module.exports = {
	name: 'cafe',
	aliases: [
        'café', 'cafecito',
        'coffee', 'cawfee'
    ],
    desc: 'Muestra imágenes de café',
    flags: new CommandMetaFlagsManager().add('COMMON'),
	experimental: true,

	async execute(message, _, isSlash = false) {
		//Acción de comando
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
		const embed = new MessageEmbed();
		
		if(!err)
			embed.addFields({ name: 'Café ☕', value: `${selected.bitly_url}` })
				.setImage(`https://media.giphy.com/media/${selected.id}/giphy.gif`)
				.setColor('#6a4928');
		else
			embed.addFields({ name: 'Error de solicitud a tercero', value: err })
				.setColor('RED');
		
		await message.reply({ embeds: [embed] });
    },
};