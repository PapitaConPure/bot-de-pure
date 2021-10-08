const { MessageEmbed } = require('discord.js'); //Integrar discord.js
const { randRange } = require('../../func');
const fetch = require('node-fetch');

const r = {
	api: 'https://api.giphy.com/v1/gifs/search',
	key: 'Qu29veK701szqoFK6tXgOiybuc1q3PaX',
	off: 0,
	limit: 10
};

const requestEmbed = async () => {
	let err;
	r.off = randRange(0, 30);
	const { data } = await fetch(`${r.api}?api_key=${r.key}&q=coffee&offset=${r.off}&limit=${r.limit}`)
		.then(response => response.json())
		.catch(e => {
			err = `\`\`\`\n${e.message}\n\`\`\``;
			return { data: undefined };
		});

	//Crear y devolver embed
	const selected = data[randRange(0, r.limit)];
	const embed = new MessageEmbed()
		.setColor('#6a4928')
		.setTitle('Café uwu');
	if(err === undefined)
		embed
			.addField('Salsa', `${selected.bitly_url}`)
			.setImage(`https://media.giphy.com/media/${selected.id}/giphy.gif`);
	else
		embed.addField('Se produjo un error al recibir datos de un tercero', err);
	
	return embed;
}

module.exports = {
	name: 'cafe',
	aliases: [
        'café', 'cafecito',
        'coffee', 'cawfee'
    ],
    desc: 'Muestra imágenes de café',
    flags: [
        'common'
    ],

	async execute(message, _) {
		//Acción de comando
		const embed = await requestEmbed();
		await message.channel.send({ embeds: [embed] });
    },

	async interact(interaction, _) {
		//Acción de comando
		const embed = await requestEmbed();
		await interaction.reply({ embeds: [embed] });
	}
};