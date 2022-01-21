const { hourai } = require('../../localdata/config.json');
const { colorsRow } = require('./colores.js')
const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');

module.exports = {
	name: 'roles',
	aliases: [
		'rol',
		'role',
		'candies',
	],
    desc: 'Otorga caramelos al reaccionar (solo Hourai Doll)',
    flags: [
        'hourai',
		'maintenance'
    ],
	experimental: true,
	
	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} _
	 * @param {Boolean} isSlash
	 */
	async execute(request, _) {
		return await request.reply({
			embeds: [
				new MessageEmbed()
					.setAuthor('Punto de Reparto desplegado', (request.author ?? request.user).avatarURL())
					.setColor('GOLD')
					.addField('¡Se están repartiendo roles!', 'Antiguos relatos cuentan que permiten ver trazos de lujuria grabados en el aire.\nSe están aceptando devoluciones para aplicantes previos, solo vomítenlos con cuidado de dañarlos.')
			],
			components: [new MessageActionRow().addComponents(
				new MessageSelectMenu()
					.setCustomId('roles_onSelect')
					.setPlaceholder('Elige una categoría')
					.setOptions([
						{
							label: 'Colores',
							description: '¡Elige tu bando en Hourai Doll!',
							emoji: '853402616208949279',
							value: 'selectColor',
						},
						{
							label: 'Juegos',
							description: 'Roles mencionados al jugar a algo',
							emoji: '919133024770211880',
							value: 'selectGame',
						},
						{
							label: 'Bebidas',
							description: 'Destaca tus bebidas calientes favoritas',
							emoji: '739512946354421770',
							value: 'selectDrink',
						},
						{
							label: 'Religión',
							description: 'Describe tu naturaleza',
							emoji: '704612794921779290',
							value: 'selectReligion',
						},
						{
							label: 'Caramelos',
							description: 'No apto para menores de edad',
							emoji: '778180421304188939',
							value: 'selectCandy',
						},
					]),
			)],
		});
    },

	async ['onSelect'](interaction) {
		const [ operation ] = interaction.values;
		return await module.exports[operation](interaction);
	},

	async ['selectGame'](interaction) {
		const gameRoles = [
			{ id: '693886880667795577', emote: '🍊', label: '100% OJ' },
			{ id: '763945846705487884', emote: '🌳', label: 'Terraria' },
		];
		return await interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('DARK_PURPLE')
					.addField('¡Caramelos mágicos!', 'Antiguos relatos cuentan que permiten ver trazos de lujuria grabados en el aire.\nSe aceptan devoluciones para aplicantes previos, solo vomítalos con cuidado de dañarlos.')
			],
			components: [
				new MessageActionRow().addComponents(gameRoles.map(gameRole =>
					new MessageButton()
						.setCustomId(`roles_addRole_${gameRole.id}`)
						.setEmoji(gameRole.emote)
						.setLabel(gameRole.label)
						.setStyle('SUCCESS'),
				)),
				new MessageActionRow().addComponents(gameRoles.map(gameRole =>
					new MessageButton()
						.setCustomId(`roles_removeRole_${gameRole.id}`)
						.setEmoji(gameRole.emote)
						.setLabel(gameRole.label)
						.setStyle('DANGER'),
				)),
				new MessageActionRow().addComponents([
					new MessageButton()
						.setCustomId(`roles_removeMany_${gameRoles.map(gameRole => gameRole.id).join('_')}`)
						.setEmoji('704612795072774164')
						.setLabel('Quitarse todos')
						.setStyle('DANGER'),
				]),
			],
			ephemeral: true,
		});
    },
	async ['selectCandy'](interaction) {
		const candyRole = '683084373717024869';
		return await interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('DARK_PURPLE')
					.addField('¡Caramelos mágicos!', 'Antiguos relatos cuentan que permiten ver trazos de lujuria grabados en el aire.\nSe aceptan devoluciones para aplicantes previos, solo vomítalos con cuidado de dañarlos.')
			],
			components: [new MessageActionRow().addComponents([
				new MessageButton()
					.setCustomId(`roles_addRole_${candyRole}`)
					.setEmoji('778180421304188939')
					.setLabel('Recibir')
					.setStyle('SUCCESS'),
				new MessageButton()
					.setCustomId(`roles_removeRole_${candyRole}`)
					.setEmoji('704612795072774164')
					.setLabel('Devolver')
					.setStyle('DANGER'),
			])],
			ephemeral: true,
		});
    },
	
	async ['selectColor'](interaction) {
		return await interaction.reply({
			files: [hourai.images.colors],
			components: [colorsRow],
			ephemeral: true,
		});
    },

	async ['addRole'](interaction, args) {
		const { member } = interaction;
		const [ rid ] = args;
		if(member.roles.cache.has(rid))
			return await interaction.reply({ content: '⚠️ Ya tienes ese rol', ephemeral: true });
		return await Promise.all([
			member.roles.add(rid),
			interaction.reply({ content: '✅ Rol entregado', ephemeral: true }),
		]);
    },

	async ['removeRole'](interaction, args) {
		const { member } = interaction;
		const [ rid ] = args;
		if(!member.roles.cache.has(rid))
			return await interaction.reply({ content: '⚠️ No tienes ese rol', ephemeral: true });
		return await Promise.all([
			member.roles.remove(rid),
			interaction.reply({ content: '✅ Rol quitado', ephemeral: true }),
		]);
    },

	async ['removeMany'](interaction, args) {
		const { member } = interaction;
		await Promise.all(
			args
			.map(rid => member.roles.cache.has(rid) ? member.roles.remove(rid) : undefined)
			.filter(rid => rid)
		);
		interaction.reply({ content: '✅ Roles actualizados', ephemeral: true });
    },
};