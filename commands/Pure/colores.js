const { hourai } = require('../../localdata/config.json'); //Variables globales
const { getColorRoleList } = require('../../func'); //Funciones globales
const { MessageActionRow, MessageButton } = require('discord.js');

const colorsRow = new MessageActionRow().addComponents(getColorRoleList());

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
	
	/**
	 * 
	 * @param {import('../Commons/typings').CommandRequest} request 
	 * @param {import('../Commons/typings').CommandOptions} _ 
	 * @param {Boolean} isSlash 
	 * @returns 
	 */
	async execute(request, _, isSlash = false) {
		return await request.reply({
			content: `Aquí teni los colore po **${(request.user ?? request.author).username}** <:reibu:686220828773318663>`,
			files: [hourai.images.colors],
			components: [
				colorsRow,
				new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId('colores_end')
						.setLabel('Finalizar')
						.setStyle('SECONDARY')
				)
			],
			ephemeral: true,
		});
    },

	/** @param {import('discord.js').SelectMenuInteraction} interaction */
	async ['addColor'](interaction) {
		const { guild, member } = interaction;
        const role = guild.roles.cache.get(interaction.values[0]);
        if(role) {
			const hadroles = member.roles.cache.find(mr => role === mr.id);
			if(hadroles !== undefined) {
				await member.roles.remove(hadroles);
				await member.roles.add(colrol[reacted]);
				return await interaction.reply({ content: 'Colores intercambiados <:monowo:887389799042932746>' });
			} else {
				await member.roles.add(colrol[reacted]);
				return await interaction.reply({ content: 'Colores otorgados <:miyoi:674823039086624808> :thumbsup:' });
			}
		} else return await interaction.reply({ content: ':x: No se encontró el rol. Si lo intentas más tarde, puede que el problema se haya solucionado '});
	},

	/** @param {import('discord.js').ButtonInteraction} interaction */
	async ['end'](interaction) {
		setTimeout(() => interaction.message.deleted ? null : interaction.message.delete(), 1000 * 5);
		return await interaction.update({
			content: 'No más colore po',
			components: [],
		});
	}
};