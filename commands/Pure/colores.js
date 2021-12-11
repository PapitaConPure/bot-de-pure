const { hourai } = require('../../localdata/config.json'); //Variables globales
const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');

const colorsList = [
	{ emoteId: '819772377814532116', roleName: 'French Doll', roleId: '671851233870479375' },
	{ emoteId: '819772377642041345', roleName: 'Holland Doll', roleId: '671851228308963348' },
	{ emoteId: '819772377624870973', roleName: 'Tibetan Doll', roleId: '671852132328275979' },
	{ emoteId: '819772377894354944', roleName: 'Kyoto Doll', roleId: '671851234541699092' },
	{ emoteId: '819772377856606228', roleName: 'London Doll', roleId: '671851236538187790' },
	{ emoteId: '819772377482526741', roleName: 'Russian Doll', roleId: '671851228954755102' },
	{ emoteId: '819772377440583691', roleName: 'Orléans Doll', roleId: '671851235267182625' },
];
const roleList = (() => {
	const menuOptions = [];
	colorsList.forEach(color => menuOptions.push({
		value: color.roleId,
		label: color.roleName,
		emoji: {
			name: color.roleName.slice(0, 3),
			id: color.emoteId,
		},
	}));
	
	return new MessageSelectMenu()
		.setCustomId('colores_addColor')
		.addOptions(menuOptions);
})();
const colorsRows = [
	new MessageActionRow().addComponents(roleList),
	new MessageActionRow().addComponents(
		new MessageButton()
			.setCustomId('colores_end')
			.setLabel('Finalizar')
			.setStyle('SECONDARY')
	),
];

module.exports = {
	name: 'colores',
	aliases: [
		'color', 'roles', 'rol',
		'colours', 'colour', 'colors', 'role',
		'c'
	],
    desc: 'Muestra un tablón de roles de colores básicos para Hourai Doll',
    flags: [
        'hourai'
    ],
	experimental: true,
	colorsList: colorsList,
	roleList: roleList,
	
	/**
	 * @param {import('../Commons/typings').CommandRequest} request 
	 * @param {import('../Commons/typings').CommandOptions} _ 
	 * @param {Boolean} isSlash 
	 */
	async execute(request, _, isSlash = false) {
		return await request.reply({
			content: `Aquí teni los colore po **${(request.user ?? request.author).username}** <:reibu:686220828773318663>`,
			files: [hourai.images.colors],
			components: colorsRows,
			ephemeral: true,
		});
    },

	/** @param {import('discord.js').SelectMenuInteraction} interaction */
	async ['addColor'](interaction) {
		const { guild, member } = interaction;
        const role = guild.roles.cache.get(interaction.values[0]);
        if(role) {
			const hadroles = member.roles.cache.find(mr => colorsList.some(color => color.roleId === mr.id));
			if(hadroles !== undefined) {
				await member.roles.remove(hadroles);
				await member.roles.add(role);
				return await interaction.reply({ content: 'Colores intercambiados <:monowo:887389799042932746>', ephemeral: true });
			} else {
				await member.roles.add(role);
				return await interaction.reply({ content: 'Colores otorgados <:miyoi:674823039086624808> :thumbsup:', ephemeral: true });
			}
		} else return await interaction.reply({ content: ':x: No se encontró el rol. Si lo intentas más tarde, puede que el problema se haya solucionado '});
	},

	/** @param {import('discord.js').ButtonInteraction} interaction */
	async ['end'](interaction) {
		setTimeout(() => interaction.message.deleted ? null : interaction.message.delete(), 1000 * 5);
		return await interaction.update({
			content: 'No más colore po',
			files: [],
			components: [],
		});
	}
};