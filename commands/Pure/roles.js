const { hourai } = require('../../localdata/config.json');
const { colorsRow } = require('./colores.js')
const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');

const getAddRemoveRows = (roles) => [
	new MessageActionRow().addComponents(roles.map(role =>
		new MessageButton()
			.setCustomId(`roles_addRole_${role.id}`)
			.setEmoji(role.emote)
			.setLabel(role.label)
			.setStyle('SUCCESS'),
	)),
	new MessageActionRow().addComponents(roles.map(role =>
		new MessageButton()
			.setCustomId(`roles_removeRole_${role.id}`)
			.setEmoji(role.emote)
			.setLabel(role.label)
			.setStyle('DANGER'),
	)),
	new MessageActionRow().addComponents([
		new MessageButton()
			.setCustomId(`roles_removeMany_${roles.map(role => role.id).join('_')}`)
			.setEmoji('704612795072774164')
			.setLabel('Quitarse todos')
			.setStyle('PRIMARY'),
	]),
];

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
					.addField('¡Se están repartiendo roles!', 'Se ha establecido una campaña de suministro de roles. Usa el menú de abajo y selecciona la categoría que quieras')
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
							description: 'Roles mencionables para jugar juntos',
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
						/*{
							label: 'Caramelos',
							description: 'Cargados de amor siniestro',
							emoji: '778180421304188939',
							value: 'selectCandy',
						},*/
					]),
			)],
		});
    },

	async ['onSelect'](interaction) {
		const [ operation ] = interaction.values;
		return await module.exports[operation](interaction);
	},

	async ['selectColor'](interaction) {
		return await interaction.reply({
			files: [hourai.images.colors],
			components: [colorsRow],
			ephemeral: true,
		});
    },

	async ['selectGame'](interaction) {
		const gameRoles = [
			{ id: '693886880667795577', emote: '🍊', label: '100% OJ' },
			{ id: '763945846705487884', emote: '🌳', label: 'Terraria' },
		];
		return await interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('RED')
					.addField('Roles de Juego', 'Roles mencionables para llamar gente a jugar algunos juegos. Si piensas ser de los que llaman a jugar, intenta no abusar las menciones')
			],
			components: getAddRemoveRows(gameRoles),
			ephemeral: true,
		});
    },
	
	async ['selectDrink'](interaction) {
		const drinkRoles = [
			{ id: '727951667513000007', emote: '🍵', label: 'Té' },
			{ id: '727951545509085204', emote: '☕', label: 'Café' },
			{ id: '727951759263137912', emote: '🧉', label: 'Mate' },
		];
		return await interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('RED')
					.addField('Roles de Bebidas', 'Roles decorativos para dar a conocer qué bebidas calientes disfrutas')
			],
			components: getAddRemoveRows(drinkRoles),
			ephemeral: true,
		});
    },
	
	async ['selectReligion'](interaction) {
		const gameRoles = [
			{ id: '695744222850056212', emote: '😇', label: 'Blessed' },
			{ id: '695743527383990422', emote: '🙃', label: 'Blursed' },
			{ id: '694358587451113564', emote: '💀', label: 'Cursed' },
		];
		return await interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('RED')
					.addField('Roles de Juego', 'Roles mencionables para llamar gente a jugar algunos juegos. Si piensas ser de los que llaman a jugar, intenta no abusar las menciones')
			],
			components: [
				new MessageActionRow().addComponents(gameRoles.map(gameRole =>
					new MessageButton()
						.setCustomId(`roles_addRoleExclusive_${gameRole.id}_${gameRoles.map(gameRole => gameRole.id).join('_')}`)
						.setEmoji(gameRole.emote)
						.setLabel(gameRole.label)
						.setStyle('SUCCESS'),
				)),
				new MessageActionRow().addComponents([
					new MessageButton()
						.setCustomId(`roles_removeMany_${gameRoles.map(gameRole => gameRole.id).join('_')}`)
						.setEmoji('704612795072774164')
						.setLabel('Eliminar Religión')
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

	async ['addRoleExclusive'](interaction, args) {
		const { member } = interaction;
		const newRoleId = args.shift();
		if(member.roles.cache.has(newRoleId))
			return await interaction.reply({ content: '⚠️ Ya tienes ese rol', ephemeral: true })

		await Promise.all(
			args.filter(rid => rid !== newRoleId).map(rid =>
				member.roles.cache.has(rid)
				? member.roles.remove(rid)
				: undefined
			)
		);
		return await Promise.all([
			member.roles.add(newRoleId),
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