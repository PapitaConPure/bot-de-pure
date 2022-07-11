const { serverid: sid } = require('../../localdata/config.json');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const embed = new MessageEmbed()
	.setColor('DARK_PURPLE')
	.addField('¡Se están repartiendo caramelos mágicos!', 'Antiguos relatos cuentan que permiten ver trazos de lujuria grabados en el aire.\nSe están aceptando devoluciones para aplicantes previos, solo vomítenlos con cuidado de dañarlos.');

const row = new MessageActionRow().addComponents([
	new MessageButton()
		.setCustomId('caramelos_addCandy')
		.setEmoji('778180421304188939')
		.setLabel('Recibir')
		.setStyle('SUCCESS'),
	new MessageButton()
		.setCustomId('caramelos_removeCandy')
		.setEmoji('704612795072774164')
		.setLabel('Devolver')
		.setStyle('DANGER'),
]);

let candyRole = '683084373717024869';

module.exports = {
	name: 'caramelos',
	aliases: [
		'caramelo',
		'candy', 'candies', 'milky'
	],
    desc: 'Otorga caramelos al reaccionar (solo Hourai Doll)',
    flags: [
        'hourai',
		'outdated',
    ],
	experimental: true,
	
	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} _
	 * @param {Boolean} isSlash
	 */
	async execute(request, _) {
		return request.reply({
			embeds: [ embed.setAuthor({ name: 'Punto de Reparto desplegado', iconURL: (request.author ?? request.user).avatarURL() }) ],
			components: [row],
		});
    },

	async ['addCandy'](interaction) {
		const { member } = interaction;
		if(member.roles.cache.has(candyRole))
			return interaction.reply({ content: 'Oe tranqui po, que ya tení tus caramelos <:kageuwu:850196617495707678>', ephemeral: true });
		return Promise.all([
			member.roles.add(candyRole),
			interaction.reply({ content: 'Caramelos entregados <:miyoi:674823039086624808>:pinching_hand: :candy:', ephemeral: true }),
		]);
    },

	async ['removeCandy'](interaction) {
		const { member } = interaction;
		if(!member.roles.cache.has(candyRole))
			return interaction.reply({ content: 'No tenei caramelos encima, si querei plata trabaja po\' <:lechita:931409943448420433>', ephemeral: true });
		return Promise.all([
			member.roles.remove(candyRole),
			interaction.reply({ content: 'Caramelos devueltos <:miyoi:674823039086624808>:pray:', ephemeral: true }),
		]);
    },
};