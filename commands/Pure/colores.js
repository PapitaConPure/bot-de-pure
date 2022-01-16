const { hourai } = require('../../localdata/config.json'); //Variables globales
const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');

const colorsList = [
	{ emoteId: '819772377814532116', roleId: '671851233870479375', roleName: 'French Doll',  roleDesc: 'Rojo'     },
	{ emoteId: '819772377624870973', roleId: '671852132328275979', roleName: 'Holland Doll', roleDesc: 'Azul'     },
	{ emoteId: '819772377482526741', roleId: '671851228954755102', roleName: 'Tibetan Doll', roleDesc: 'Verde '   },
	{ emoteId: '819772377440583691', roleId: '671851235267182625', roleName: 'Kyoto Doll',   roleDesc: 'Púrpura'  },
	{ emoteId: '819772377856606228', roleId: '671851236538187790', roleName: 'London Doll',  roleDesc: 'Naranja'  },
	{ emoteId: '819772377894354944', roleId: '671851234541699092', roleName: 'Russian Doll', roleDesc: 'Amarillo' },
	{ emoteId: '819772377642041345', roleId: '671851228308963348', roleName: 'Orléans Doll', roleDesc: 'Celeste'  },
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
		.setPlaceholder('Escoge un color...')
		.addOptions(menuOptions);
})();

const colorsRow = new MessageActionRow().addComponents(roleList);

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
	colorsRow: colorsRow,
	
	/**
	 * @param {import('../Commons/typings').CommandRequest} request 
	 * @param {import('../Commons/typings').CommandOptions} _ 
	 * @param {Boolean} isSlash 
	 */
	async execute(request, _, isSlash = false) {
		return await request.reply({
			content: `Aquí teni los colore po **${(request.user ?? request.author).username}** <:reibu:686220828773318663>`,
			files: [hourai.images.colors],
			components: [colorsRow],
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
		} else return await interaction.reply({ content: ':x: No se encontró el rol. Si lo intentas más tarde, puede que el problema se haya solucionado', ephemeral: true });
	},
};