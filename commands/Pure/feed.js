//const { fetchFlag } = require('../../func');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
//const { engines, getBaseTags, getSearchTags } = require('../../localdata/booruprops.js');
//const { p_pure } = require('../../localdata/prefixget');
const GuildConfig = require('../../localdata/models/guildconfigs.js');
const booru = require('booru');

/*const desc = `${brief}\n` +
	'Por defecto, las imágenes se buscan con Gelbooru.\n' +
	'Si lo deseas, puedes usar otro `--motor` de esta lista:\n' +
	'```\n' +
	`${engines.map(e => `${e.charAt(0).toUpperCase()}${e.slice(1)}`).join(', ')}\n` +
	'```\n' +
	'**Nota:** #NSFW_NOTE\n' +
	'**Nota 2:** no todos los motores funcionan y con algunos no habrá búsqueda personalizada.';*/

const cancelbutton = new MessageButton()
	.setCustomId('feed_cancelWizard')
	.setLabel('Cancelar')
	.setStyle('SECONDARY');

module.exports = {
	name: 'feed',
	brief: 'Inicializa un Feed en un canal por medio de un Asistente.',
    desc: 'Inicializa un Feed de imágenes en un canal. Simplemente usa el comando y sigue los pasos del Asistente para configurar todo',
    flags: [
        'common',
		'mod',
    ],
	experimental: true,
	
	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} _
	 * @param {Boolean} isSlash
	 */
	async execute(request, _, isSlash = false) {
		//Acción de comando
		const wizard = new MessageEmbed()
			.setAuthor('Asistente de configuración de Feed de imágenes', request.client.user.avatarURL())
			.addField('Bienvenido', 'Si es la primera vez que configuras un Feed de imágenes con Bot de Puré, ¡no te preocupes! Simplemente sigue las instrucciones del Asistente y adapta tu Feed a lo que quieras')
			.setFooter('1/? • Bienvenida');
		const sent = (await Promise.all([
			request.reply({
				embeds: [wizard],
				components: [new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId('feed_startWizard')
						.setLabel('Comenzar')
						.setStyle('PRIMARY'),
					cancelbutton,
				)],
			}),
			isSlash ? request.fetchReply() : null,
		])).filter(cch => cch)[0];
		
		//return await sent.edit({ embeds: [wizard] });
	},

	/**@param {import('discord.js').ButtonInteraction} interaction */
	async ['startWizard'](interaction) {
		interaction.message.embeds[0].fields[0].name = 'Selecciona una Operación';
		interaction.message.embeds[0].fields[0].value = '¿Qué deseas hacer ahora mismo?';
		interaction.message.embeds[0].setFooter('2/? • Acción');
		return await interaction.update({
			embeds: interaction.message.embeds,
			components: [new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId('feed_createNew')
					.setLabel('Crear un nuevo Feed')
					.setStyle('SUCCESS'),
				new MessageButton()
					.setCustomId('feed_editOne')
					.setLabel('Editar un Feed')
					.setStyle('PRIMARY'),
				new MessageButton()
					.setCustomId('feed_deleteOne')
					.setLabel('Eliminar un Feed')
					.setStyle('DANGER'),
				cancelbutton,
			)],
		});
	},

	/**@param {import('discord.js').ButtonInteraction} interaction */
	async ['cancelWizard'](interaction) {
		const cancelEmbed = new MessageEmbed()
			.setAuthor('Asistente de configuración de Feed de imágenes', interaction.client.user.avatarURL())
			.addField('Asistente cancelado', 'Se canceló la configuración de Feed')
			.setFooter('Asistente terminado');
		return await interaction.update({
			embeds: [cancelEmbed],
			components: [],
		});
	},
};