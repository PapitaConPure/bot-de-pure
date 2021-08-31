const Discord = require('discord.js'); //Integrar discord.js
const fetch = require('node-fetch');

const tmpfunc = async function(tmpch) {
	const { file } = await fetch('https://aws.random.cat/meow').then(response => response.json());
	//Crear y usar embed
	const Embed = new Discord.MessageEmbed()
		.setColor('#ffc0cb')
		.setTitle('Gatitos uwu')
		.addField('Salsa', file)
		.setImage(file);
	tmpch.send({ embeds: [Embed] });
}

module.exports = {
	name: 'gatos',
	aliases: [
        'gato', 'felino', 'gatito', 'gatitos', 'miau', 'michi', 'michis',
        'cats', 'cat', 'meow', 'nya', 'kitty', 'kitties'
    ],
    desc: 'Muestra imágenes de gatitos uwu',
    flags: [
        'common'
    ],
    options: [

    ],
	
	async execute(message, args) {
		tmpfunc(message.channel);
    },
};