const { ButtonBuilder, ButtonStyle } = require('discord.js');
const { randRange } = require('../../func');
const { CommandTags, Command } = require('../Commons/commands');

const phrases = [
	'Ahora sí vení que te saco la cresta',
	'Vení que te dejo la cagá en la cara',
	'Ah mira que bacán. Vení que te rajo',
	'Aweonao recontraculiao ijoelamaraca',
	'Avíspate po\'',
	'Te voy a pegar el meo pape, maraco ctm',
	'Chúpalo gil qliao',
	'Te tiraste',
	'Te rifaste',
	'Cagaste',
];
const tenshiurl = 'https://i.imgur.com/eMyvXiC.png';

const flags = new CommandTags().add('COMMON');
const command = new Command('rakkidei', flags)
	.setAliases('rakki', 'tenshi')
	.setDescription('Comando de trompada de Rakkidei')
	.addWikiRow(
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL('https://twitter.com/rakkidei')
			.setEmoji('1232243415165440040'),
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL('https://www.pixiv.net/users/58442175')
			.setEmoji('1334816111270563880'),
	)
	.setExecution(async function (request) {
		return request.reply({
			content: phrases[randRange(0, phrases.length)],
			files: [tenshiurl],
		});
	});

module.exports = command;
