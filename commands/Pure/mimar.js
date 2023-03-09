const { EmbedBuilder } = require("discord.js");
const { fetchUser, randRange } = require("../../func");
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const lovestats = () => [
	{ text: '🤝 [n]% amistad',    number: randRange(0, 100, false) },
	{ text: '❤️ [n]% cariño', 	  number: randRange(0, 100, false) },
	{ text: '😳 [n]% pasión', 	  number: randRange(0, 100, false) },
	{ text: '☺️ [n]% carisma',     number: randRange(0, 100, false) },
	{ text: '🤗 [n] abrazos', 	  number: randRange(1, 16) },
	{ text: '💋 [n] besitos', 	  number: randRange(0, 10) },
	{ text: ':people_hugging: [n] palmaditas', number: randRange(3, 32) },
].map(stat => stat.text.replace('[n]', stat.number.toLocaleString('en', { maximumFractionDigits: 2 }))).join('\n');

const flags = new CommandMetaFlagsManager().add('COMMON');
const options = new CommandOptionsManager()
	.addParam('persona', 'USER', 'el usuario a mimar');
const command = new CommandManager('mimar', flags)
	.setAliases('mimos', 'besar', 'abrazar', 'hug', 'kiss')
	.setBriefDescription('Mima al usuario mencionado y te da un resumen de cómo estuvo el mimo para ambas partes')
	.setLongDescription('Mima al `<usuario>` mencionado y te da un resumen de cómo estuvo el mimo para ambas partes')
	.setOptions(options)
	.setExecution(async (request, args, isSlash = false) => {
		//Acción de comando
		const user2 = isSlash ? args.getUser('persona') : fetchUser(args.join(' '), request);
		if(!user2) return request.reply('⚠️ Debes especificar una persona a mimar');
		const user1 = request.author ?? request.user;
		if(user1.id === user2.id) return request.reply('⚠️ El único mimo que puedes darte a ti mismo es el de vivir una vida de la que no te arrepentirás');

		const embed = new EmbedBuilder()
			.setColor(0xfa7b62)
			.setTitle(`${user1.username} le ha dado mimos a ${user2.username}`)
			.addFields(
				{ name: user1.username, value: lovestats(), inline: true },
				{ name: user2.username, value: lovestats(), inline: true },
			)
			.setImage('https://i.imgur.com/HwqSNyy.jpg');
		return request.reply({ embeds: [embed] });
	});


module.exports = command;