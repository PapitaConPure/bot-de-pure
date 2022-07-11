const { MessageEmbed } = require("discord.js");
const { fetchUser, randRange } = require("../../func");
const { CommandOptionsManager } = require("../Commons/cmdOpts");

const lovestats = () => [
	{ text: '🤝 [n]% amistad',    number: randRange(0, 100, false) },
	{ text: '❤️ [n]% cariño', 	  number: randRange(0, 100, false) },
	{ text: '😳 [n]% pasión', 	  number: randRange(0, 100, false) },
	{ text: '☺️ [n]% carisma',     number: randRange(0, 100, false) },
	{ text: '🤗 [n] abrazos', 	  number: randRange(1, 16) },
	{ text: '💋 [n] besitos', 	  number: randRange(0, 10) },
	{ text: ':people_hugging: [n] palmaditas', number: randRange(3, 32) },
].map(stat => stat.text.replace('[n]', stat.number.toLocaleString('en', { maximumFractionDigits: 2 }))).join('\n');

const options = new CommandOptionsManager()
	.addParam('persona', 'USER', 'el usuario a mimar')

module.exports = {
	name: 'mimar',
	aliases: [
		'besar', 'abrazar', 'hug', 'kiss'
	],
	desc: 'Mima al `<usuario>` mencionado y te da un resumen de cómo estuvo el mimo para ambas partes',
	flags: [
		'common'
	],
	options: options,
	callx: '<persona>',
	experimental: true,
	
	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} args
	 * @param {Boolean} isSlash
	 */
	async execute(request, args, isSlash = false) {
		//Acción de comando
		const user2 = isSlash ? args.getUser('persona') : fetchUser(args.join(' '), request);
		if(!user2) return request.reply('⚠️ Debes especificar una persona a mimar');
		const user1 = request.author ?? request.user;
		if(user1.id === user2.id) return request.reply('⚠️ El único mimo que puedes darte a ti mismo es el de vivir una vida de la que no te arrepentirás');

		const embed = new MessageEmbed()
			.setColor('#fa7b62')
			.setTitle(`${user1.username} le ha dado mimos a ${user2.username}`)
			.addField(user1.username, lovestats(), true)
			.addField(user2.username, lovestats(), true)
			.setImage('https://i.imgur.com/HwqSNyy.jpg');
		return request.reply({ embeds: [embed] });
	}
};