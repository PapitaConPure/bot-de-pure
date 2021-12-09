//const { fetchFlag } = require('../../func');
const { MessageEmbed, MessageActionRow, MessageButton, MessageCollector, MessageSelectMenu } = require('discord.js');
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
const safeTags = (_tags = '') => _tags.replace(/\\*\*/g,'\\*').replace(/\\*_/g,'\\_');

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
			.setFooter('1/4 • Comenzar')
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
		const unColl = module.exports[interaction.channel.id].memoCollector;
		if(unColl && !unColl.ended) unColl.stop();
		const wizard = new MessageEmbed()
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('2/4 • Seleccionar operación')
			.addField('Selecciona una operación', '¿Qué deseas hacer ahora mismo?');
			
		const guildQuery = { guildId: interaction.guild.id };
		const gcfg = (await GuildConfig.findOne(guildQuery)) || new GuildConfig(guildQuery);
		const premade = gcfg.feeds && Object.keys(gcfg.feeds).length;
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
					.setStyle('PRIMARY')
					.setDisabled(!premade),
				new MessageButton()
					.setCustomId('feed_deleteOne')
					.setLabel('Eliminar un Feed')
					.setStyle('DANGER')
					.setDisabled(!premade),
				cancelbutton,
			)],
		});
	},

	/**@param {import('discord.js').SelectMenuInteraction} interaction */
	async ['selectFeedEdit'](interaction) {
		module.exports[interaction.channel.id].memoChannel = interaction.guild.channels.cache.get(interaction.values[0] || interaction.channel.id);
		return await module.exports.setupTagsCollector(interaction, true, 'feed_editOne');
	},

	/**@param {import('discord.js').SelectMenuInteraction} interaction */
	async ['selectFeedDelete'](interaction) {
		const chid = interaction.values[0];
		module.exports[interaction.channel.id].memoChannel = interaction.guild.channels.cache.get(chid);
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		const tags = gcfg.feeds[chid];
		const wizard = new MessageEmbed()
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('4/4 • Confirmar')
			.addField('Confirmar eliminación de Feed', `Estás por borrar el Feed _"${safeTags(tags)}"_ ubicado en el canal **<#${chid}>**. ¿Estás seguro?`);
		return await interaction.update({
			embeds: [wizard],
			components: [new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId('feed_deleteFeed')
					.setLabel('Borrar')
					.setStyle('DANGER'),
				new MessageButton()
					.setCustomId('feed_deleteOne')
					.setLabel('Volver')
					.setStyle('SECONDARY'),
				cancelbutton,
			)],
		});
	},

	/**@param {import('discord.js').ButtonInteraction} interaction */
	async setupTagsCollector(interaction, reply, backButtonFn) {
		const fetchedChannel = module.exports[interaction.channel.id].memoChannel;
		const wizard = new MessageEmbed()
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('4/4 • Asignar tags')
			.addField('Destino', `**${fetchedChannel.name}** (canal ${fetchedChannel.nsfw ? 'NSFW' : 'SFW'})`)
			.addField('Describe las tags del Feed', 'Entra a [Gelbooru](https://gelbooru.com) y realiza una búsqueda con tags que te den las imágenes deseadas para el Feed, separadas por espacios. Una vez lo consigas, simplemente copia las tags y envíalas como mensaje.\n_Es necesario que las tags estén bien escritas_')
			.addField('Control de contenidos', '**IMPORTANTE:** Si quieres resultados SFW, utiliza la tag meta `rating:safe`; si quieres resultados NSFW, añade la tag `rating:explicit`; si quieres una combinación de ambos, no ingreses ninguna de estas')
			.addField('Ejemplo de uso', 'Enviar `touhou rating:safe -breast_grab` creará un Feed de imágenes _SFW_ de Touhou que _no_ tengan la tag "breast_grab"');
		const responseUpdate = {
			embeds: [wizard],
			components: [new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId(backButtonFn)
					.setLabel('Volver')
					.setStyle('SECONDARY'),
				cancelbutton,
			)],
		};
		if(reply) await interaction.update(responseUpdate);
		else await interaction.message.edit(responseUpdate);
		const filter = (m) => m.author.id === module.exports[interaction.channel.id].memoUser.id;
		module.exports[interaction.channel.id].memoCollector = new MessageCollector(interaction.channel, { filter: filter, time: 1000 * 60 * 4 });
		module.exports[interaction.channel.id].memoCollector.on('collect', async collected => {
			const ccontent = collected.content;
			collected.delete();

			const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
			gcfg.feeds[fetchedChannel.id] = ccontent;
			gcfg.markModified('feeds');
			await gcfg.save();

			const concludedEmbed = new MessageEmbed()
				.setAuthor(wiztitle, interaction.client.user.avatarURL())
				.setFooter('Operación finalizada')
				.addField('Feed configurado', `Se ha configurado un Feed con las tags _"${safeTags(ccontent)}"_ para el canal **${fetchedChannel.name}**`)
				.addField('Control del Feed', 'Puedes modificar o eliminar este Feed en cualquier momento siguiendo el Asistente de `p!feed` una vez más');
			await interaction.message.edit({
				embeds: [concludedEmbed],
				components: [],
			});

			module.exports[interaction.channel.id].memoCollector.stop();
		});
	},

	/**@param {import('discord.js').ButtonInteraction} interaction */
	async ['deleteFeed'](interaction) {
		const wizard = new MessageEmbed()
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('Operación finalizada')
			.addField('Feed eliminado', 'Se ha eliminado el Feed acordado. Si te arrepientes, tendrás que crearlo otra vez');
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		delete gcfg.feeds[module.exports[interaction.channel.id].memoChannel.id];
		gcfg.markModified('feeds');
		return await Promise.all([
			gcfg.save(),
			interaction.update({
				embeds: [wizard],
				components: [],
			}),
		]);
	},

	/**@param {import('discord.js').ButtonInteraction} interaction */
	async ['createNew'](interaction) {
		const unColl = module.exports[interaction.channel.id].memoCollector;
		if(unColl && !unColl.ended) unColl.stop();
		const filter = (m) => m.author.id === module.exports[interaction.channel.id].memoUser.id;
		module.exports[interaction.channel.id].memoCollector = new MessageCollector(interaction.channel, { filter: filter, time: 1000 * 60 * 2 });
		module.exports[interaction.channel.id].memoCollector.on('collect', collected => {
			const ccontent = collected.content;
			if(ccontent.startsWith('<#') && ccontent.endsWith('>')) {
				ccontent = ccontent.slice(2, -1);
				if(ccontent.startsWith('!')) ccontent = ccontent.slice(1);
			}
			const channels = interaction.guild.channels.cache;
			const fetchedChannel = isNaN(ccontent)
				? channels.filter(c => c.isText()).find(c => c.name.toLowerCase().indexOf(ccontent) !== -1)
				: channels.filter(c => c.isText()).find(c => c.id !== -1);
			if(fetchedChannel) {
				collected.delete();
				module.exports[interaction.channel.id].memoChannel = fetchedChannel;
				module.exports.setupTagsCollector(interaction, false, 'feed_createNew');
				module.exports[interaction.channel.id].memoCollector.stop();
			}
		});
		const wizard = new MessageEmbed()
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('3/4 • Elegir canal')
			.addField('Selecciona un canal', 'Facilita, por medio de un mensaje, una porción del nombre, la mención o la ID del canal en el que quieres crear un nuevo Feed. Pasarás al siguiente paso automáticamente al decirme un canal válido');
		return await interaction.update({
			embeds: [wizard],
			components: [new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId('feed_startWizard')
					.setLabel('Volver')
					.setStyle('SECONDARY'),
				cancelbutton,
			)],
		});
	},

	/**@param {import('discord.js').ButtonInteraction} interaction */
	async ['editOne'](interaction) {
		const unColl = module.exports[interaction.channel.id].memoCollector;
		if(unColl && !unColl.ended) unColl.stop();
		const wizard = new MessageEmbed()
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('3/4 • Seleccionar Feed')
			.addField('Selección de Feed', 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras modificar en esta lista y selecciónalo');
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		const feeds = Object.entries(gcfg.feeds).map(([chid, tags]) => ({
			label: tags,
			description: `#${interaction.guild.channels.cache.get(chid).name}`,
			value: chid,
		}));
		return await interaction.update({
			embeds: [wizard],
			components: [
				new MessageActionRow().addComponents(
					new MessageSelectMenu()
						.setCustomId('feed_selectFeedEdit')
						.setPlaceholder('Selecciona un Feed')
						.addOptions(feeds),
				),
				new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId('feed_startWizard')
						.setLabel('Volver')
						.setStyle('SECONDARY'),
					cancelbutton,
				),
			],
		});
	},

	/**@param {import('discord.js').ButtonInteraction} interaction */
	async ['deleteOne'](interaction) {
		const wizard = new MessageEmbed()
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('3/4 • Seleccionar Feed')
			.addField('Selección de Feed', 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras eliminar en esta lista y selecciónalo');
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		const feeds = Object.entries(gcfg.feeds).map(([chid, tags]) => ({
			label: tags,
			description: `#${interaction.guild.channels.cache.get(chid).name}`,
			value: chid,
		}));
		return await interaction.update({
			embeds: [wizard],
			components: [
				new MessageActionRow().addComponents(
					new MessageSelectMenu()
						.setCustomId('feed_selectFeedDelete')
						.setPlaceholder('Selecciona un Feed')
						.addOptions(feeds),
				),
				new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId('feed_startWizard')
						.setLabel('Volver')
						.setStyle('SECONDARY'),
					cancelbutton,
				),
			],
		});
	},

	/**@param {import('discord.js').ButtonInteraction} interaction */
	async ['cancelWizard'](interaction) {
		const unColl = module.exports[interaction.channel.id].memoCollector;
		if(unColl && !unColl.ended) unColl.stop();
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