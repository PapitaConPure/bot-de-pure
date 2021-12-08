//const { fetchFlag } = require('../../func');
const { MessageEmbed, MessageActionRow, MessageButton, MessageCollector } = require('discord.js');
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

const wiztitle = 'Asistente de configuración de Feed de imágenes';

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
		module.exports[request.channel.id] = { memoUser: request.author ?? request.user };
		const wizard = new MessageEmbed()
			.setAuthor(wiztitle, request.client.user.avatarURL())
			.setFooter('1/? • Bienvenida')
			.addField('Bienvenido', 'Si es la primera vez que configuras un Feed de imágenes con Bot de Puré, ¡no te preocupes! Simplemente sigue las instrucciones del Asistente y adapta tu Feed a lo que quieras');
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
		const wizard = new MessageEmbed()
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('2/? • Acción')
			.addField('Selecciona una operación', '¿Qué deseas hacer ahora mismo?');
		return await interaction.update({
			embeds: [wizard],
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
	setupChannelCollector(interaction, backButtonFn = 'feed_none') {
		const filter = (m) => m.author.id === module.exports[interaction.channel.id].memoUser.id;
		module.exports[interaction.channel.id].memoCollector = new MessageCollector(interaction.channel, { filter: filter, time: 1000 * 60 * 2 });
		module.exports[interaction.channel.id].memoCollector.on('collect', collected => {
			collected = collected.content;
			console.log(collected)
			if(collected.startsWith('<#') && collected.endsWith('>')) {
				collected = collected.slice(2, -1);
				if(collected.startsWith('!')) collected = collected.slice(1);
			}
			const channels = interaction.guild.channels.cache;
			const fetchedChannel = isNaN(collected)
				? channels.filter(c => c.isText()).find(c => c.name.toLowerCase().indexOf(collected) !== -1)
				: channels.filter(c => c.isText()).find(c => c.id !== -1);
			if(fetchedChannel) {
				module.exports[interaction.channel.id].memoChannel = fetchedChannel;

				const wizard = new MessageEmbed()
					.setAuthor(wiztitle, interaction.client.user.avatarURL())
					.setFooter('4/4 • Asignar tags')
					.addField('Destino', `**${fetchedChannel.name}** (canal ${fetchedChannel.nsfw ? 'NSFW' : 'SFW'})`)
					.addField('Describe las tags del Feed', 'Entra a [Gelbooru](https://gelbooru.com) y realiza una búsqueda con tags que te den las imágenes deseadas para el Feed, separadas por espacios. Una vez lo consigas, simplemente copia las tags y envíalas como mensaje.\n_Es necesario que las tags estén bien escritas_')
					.addField('Control de contenidos', '**IMPORTANTE:** Si quieres resultados SFW, utiliza la tag meta `rating:safe`; si quieres resultados NSFW, añade la tag `rating:explicit`; si quieres una combinación de ambos, no ingreses ninguna')
					.addField('Ejemplo de uso', 'Enviar `touhou rating:safe -breast_grab` creará un Feed de imágenes _SFW_ de Touhou que _no_ tengan la tag "breast_grab"');
				interaction.message.edit({
					embeds: [wizard],
					components: [new MessageActionRow().addComponents(
						new MessageButton()
							.setCustomId(backButtonFn)
							.setLabel('Volver')
							.setStyle('SECONDARY'),
						cancelbutton,
					)],
				});

				module.exports[interaction.channel.id].memoCollector.stop();
			}
		});
	},

	/**@param {import('discord.js').ButtonInteraction} interaction */
	async ['createNew'](interaction) {
		const wizard = new MessageEmbed()
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('3/4 • Elegir canal')
			.addField('Selecciona una canal', 'Facilita, por medio de un mensaje, una porción del nombre, la mención o la ID del canal en el que quieres crear un nuevo Feed. Pasarás al siguiente paso automáticamente al decirme un canal válido');
		module.exports.setupChannelCollector(interaction, 'feed_createNew');
		return await interaction.update({
			embeds: [wizard],
			components: [new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId('feed_restartWizard')
					.setLabel('Volver')
					.setStyle('SECONDARY'),
				cancelbutton,
			)],
		});
	},

	/**@param {import('discord.js').ButtonInteraction} interaction */
	async ['restartWizard'](interaction) {
		module.exports[interaction.channel.id].memoCollector.stop();
		await module.exports['startWizard'](interaction);
	},

	/**@param {import('discord.js').ButtonInteraction} interaction */
	async ['cancelWizard'](interaction) {
		const cancelEmbed = new MessageEmbed()
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('Operación abortada')
			.addField('Asistente cancelado', 'Se canceló la configuración de Feed');
		return await interaction.update({
			embeds: [cancelEmbed],
			components: [],
		});
	},
};