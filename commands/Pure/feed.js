const { default: axios } = require('axios');
const { MessageEmbed, MessageActionRow, MessageButton, MessageCollector, MessageSelectMenu } = require('discord.js');
const { isNotModerator } = require('../../func.js');
const GuildConfig = require('../../localdata/models/guildconfigs.js');

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
			.setColor('AQUA')
			.setAuthor(wiztitle, request.client.user.avatarURL())
			.setFooter('1/? • Comenzar')
			.addField('Bienvenido', 'Si es la primera vez que configuras un Feed de imágenes con Bot de Puré, ¡no te preocupes! Simplemente sigue las instrucciones del Asistente y adapta tu Feed a lo que quieras');
		return await request.reply({
			embeds: [wizard],
			components: [new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId('feed_startWizard')
					.setLabel('Comenzar')
					.setStyle('PRIMARY'),
				cancelbutton,
			)],
		});
	},

	/**@param {import('discord.js').ButtonInteraction} interaction */
	async ['startWizard'](interaction) {
		const unColl = module.exports[interaction.channel.id].memoCollector;
		if(unColl && !unColl.ended) unColl.stop();
		const wizard = new MessageEmbed()
			.setColor('NAVY')
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('2/? • Seleccionar operación')
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
					.setCustomId('feed_customizeOne')
					.setLabel('Personalizar un Feed')
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
	async ['selectFeedCustomize'](interaction) {
		const fetchedChannel = interaction.guild.channels.cache.get(interaction.values[0] || interaction.channel.id);
		module.exports[interaction.channel.id].memoChannel = fetchedChannel;
		const wizard = new MessageEmbed()
			.setColor('BLURPLE')
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('4/5 • Seleccionar elemento a personalizar')
			.addField('Destino', `**${fetchedChannel.name}** (canal ${fetchedChannel.nsfw ? 'NSFW' : 'SFW'})`)
			.addField('Selecciona un elemento a personalizar', 'Usa el menú desplegable para decidir qué personalizar');
		
		return await interaction.update({
			embeds: [wizard],
			components: [
				new MessageActionRow().addComponents(
					new MessageSelectMenu()
						.setCustomId('feed_selectElementCustomize')
						.setPlaceholder('Selecciona un elemento')
						.setOptions([
							{
								label: 'Título',
								description: 'Asigna o elimina un encabezado para mostrar en cada imagen',
								value: 'title',
							},
							{
								label: 'Etiquetas',
								description: 'Decide el máximo de tags mostradas por cada imagen',
								value: 'tags',
							},
							{
								label: 'Pie',
								description: 'Asigna o elimina un texto a mostrar debajo de cada imagen',
								value: 'footer',
							},
							{
								label: 'Ícono de esquina',
								description: 'Elige un ícono de esquina personalizado para cada imagen',
								value: 'cornerIcon',
							},
						]),
				),
				new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId('feed_customizeOne')
						.setLabel('Volver')
						.setStyle('SECONDARY'),
					cancelbutton,
				),
			],
		});
	},

	/**@param {import('discord.js').SelectMenuInteraction} interaction */
	async ['selectElementCustomize'](interaction) {
		const fetchedChannel = module.exports[interaction.channel.id].memoChannel;
		const wizard = new MessageEmbed()
			.setColor('GREEN')
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('5/5 • Personalizar elemento')
			.addField('Destino', `**${fetchedChannel.name}** (canal ${fetchedChannel.nsfw ? 'NSFW' : 'SFW'})`);
		
		const row = new MessageActionRow();
		const customizeTarget = interaction.values[0];
		switch(customizeTarget) {
			case 'title':
				wizard.addField('Personaliza el título', 'Envía un mensaje con el título que quieras que aparezca encima de cada imagen del Feed. Si quieres eliminar el título actual, usa el respectivo botón');
				row.addComponents(
					new MessageButton()
						.setCustomId('feed_removeTitle')
						.setLabel('Eliminar título')
						.setStyle('DANGER'),
				);
				break;

			case 'tags':
				wizard.addField('Personaliza las etiquetas', 'Envía un mensaje con la cantidad máxima de tags a mostrar (número). Por defecto esto serían unas **20** etiquetas, y puedes especificar hasta un máximo de **50**')
					  .addField('Eliminar campo de etiquetas', 'Si envías "0", el campo de etiquetas se ocultará por completo. No se permiten números negativos');
				break;

			case 'footer':
				wizard.addField('Personaliza el pie', 'Envía un mensaje con el texto breve que quieras que aparezca debajo de cada imagen del Feed. Si quieres eliminar el pie actual, usa el respectivo botón');
				row.addComponents(
					new MessageButton()
						.setCustomId('feed_removeFooter')
						.setLabel('Eliminar pie')
						.setStyle('DANGER'),
				);
				break;

			case 'cornerIcon':
				wizard.addField('Personaliza el ícono de esquina', 'Envía un mensaje con el texto breve que quieras que aparezca debajo de cada imagen del Feed. Si quieres eliminar el pie actual, usa el respectivo botón');
				row.addComponents(
					new MessageButton()
						.setCustomId('feed_removeCornerIcon')
						.setLabel('Restaurar ícono por defecto')
						.setStyle('DANGER'),
				);
				break;
		}
		row.addComponents(
			new MessageButton()
				.setCustomId('feed_customizeOne')
				.setLabel('Volver')
				.setStyle('SECONDARY'),
			cancelbutton,
		);
		await interaction.update({
			embeds: [wizard],
			components: [row],
		});

		const filter = (m) => m.author.id === module.exports[interaction.channel.id].memoUser.id;
		module.exports[interaction.channel.id].memoCollector = new MessageCollector(interaction.channel, { filter: filter, time: 1000 * 60 * 4 });
		
		module.exports[interaction.channel.id].memoCollector.on('collect', async collected => {
			const ccontent = collected.content;
			collected.delete();

			const guildQuery = { guildId: interaction.guild.id };
			const gcfg = await GuildConfig.findOne(guildQuery);
			let succeeded = false;
			switch(customizeTarget) {
				case 'tags':
					const num = parseInt(ccontent);
					if(!isNaN(num) && num >= 0 && num <= 50) {
						gcfg.feeds[fetchedChannel.id].maxTags = ccontent;
						succeeded = true;
					}
					break;
				
				case 'cornerIcon':
					const cattach = collected.attachments;
					console.log(cattach.length ? cattach[0] : cattach);
					if(cattach.size && cattach.first().proxyURL.match(/(http:\/\/|https:\/\/)?(www\.)?(([a-zA-Z0-9-]){2,}\.){1,4}([a-zA-Z]){2,6}\/[a-zA-Z-_\/\.0-9#:?=&;,]*\.(png|jpg|jpeg|gif)[a-zA-Z-_\.0-9#:?=&;,]*/)) {
						gcfg.feeds[fetchedChannel.id].cornerIcon = cattach.first().proxyURL;
						succeeded = true;
					} else {
						//Crear embed de prueba para asegurarse de que el enlace sea una imagen válida
						const testEmbed = new MessageEmbed()
							.setColor('WHITE')
							.setAuthor('Verificando enlace...', ccontent);
						await interaction.channel.send({ embeds: [testEmbed] }).then(sent => {
							console.log(sent.embeds[0].author);
							if(sent.embeds[0].author.iconURL) {
								gcfg.feeds[fetchedChannel.id].cornerIcon = ccontent;
								succeeded = true;
							}
							setTimeout(() => { if(!sent.deleted) sent.delete() }, 1500);
						}).catch(error => console.error(error));
					}
					break;

				default:
					gcfg.feeds[fetchedChannel.id][customizeTarget] = ccontent;
					succeeded = true;
					break;
			}

			if(!succeeded) return;
			gcfg.markModified('feeds');
			await gcfg.save();

			const concludedEmbed = new MessageEmbed()
				.setColor('ORANGE')
				.setAuthor(wiztitle, interaction.client.user.avatarURL())
				.setFooter('Operación finalizada')
				.addField('Feed personalizado', `Se ha personalizado un elemento del Feed con las tags _"${safeTags(gcfg.feeds[fetchedChannel.id].tags)}"_ para el canal **${fetchedChannel.name}**`);
			await interaction.message.edit({
				embeds: [concludedEmbed],
				components: [new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId('feed_customizeOne')
						.setLabel('Seguir personalizando')
						.setStyle('PRIMARY'),
				)],
			});

			module.exports[interaction.channel.id].memoCollector.stop();
		});
	},

	/**@param {import('discord.js').ButtonInteraction} interaction */
	async ['removeTitle'](interaction) {
		const unColl = module.exports[interaction.channel.id].memoCollector;
		if(unColl && !unColl.ended) unColl.stop();
		const fetchedChannel = module.exports[interaction.channel.id].memoChannel;

		const guildQuery = { guildId: interaction.guild.id };
		const gcfg = await GuildConfig.findOne(guildQuery);
		delete gcfg.feeds[fetchedChannel.id].title;
		gcfg.markModified('feeds');
		await gcfg.save();

		const concludedEmbed = new MessageEmbed()
			.setColor('DARK_GREEN')
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('Operación finalizada')
			.addField('Feed personalizado', `Se ha eliminado el título personalizado del Feed con las tags _"${safeTags(gcfg.feeds[fetchedChannel.id].tags)}"_ para el canal **${fetchedChannel.name}**`);
		return await interaction.update({
			embeds: [concludedEmbed],
			components: [new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId('feed_customizeOne')
					.setLabel('Seguir personalizando')
					.setStyle('PRIMARY'),
			)],
		});
	},

	/**@param {import('discord.js').ButtonInteraction} interaction */
	async ['removeFooter'](interaction) {
		const unColl = module.exports[interaction.channel.id].memoCollector;
		if(unColl && !unColl.ended) unColl.stop();
		const fetchedChannel = module.exports[interaction.channel.id].memoChannel;

		const guildQuery = { guildId: interaction.guild.id };
		const gcfg = await GuildConfig.findOne(guildQuery);
		delete gcfg.feeds[fetchedChannel.id].footer;
		gcfg.markModified('feeds');
		await gcfg.save();

		const concludedEmbed = new MessageEmbed()
			.setColor('DARK_GREEN')
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('Operación finalizada')
			.addField('Feed personalizado', `Se ha eliminado el texto de pie personalizado del Feed con las tags _"${safeTags(gcfg.feeds[fetchedChannel.id].tags)}"_ para el canal **${fetchedChannel.name}**`);
		return await interaction.update({
			embeds: [concludedEmbed],
			components: [new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId('feed_customizeOne')
					.setLabel('Seguir personalizando')
					.setStyle('PRIMARY'),
			)],
		});
	},

	/**@param {import('discord.js').ButtonInteraction} interaction */
	async ['removeCornerIcon'](interaction) {
		const unColl = module.exports[interaction.channel.id].memoCollector;
		if(unColl && !unColl.ended) unColl.stop();
		const fetchedChannel = module.exports[interaction.channel.id].memoChannel;

		const guildQuery = { guildId: interaction.guild.id };
		const gcfg = await GuildConfig.findOne(guildQuery);
		delete gcfg.feeds[fetchedChannel.id].cornerIcon;
		gcfg.markModified('feeds');
		await gcfg.save();

		const concludedEmbed = new MessageEmbed()
			.setColor('DARK_GREEN')
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('Operación finalizada')
			.addField('Feed personalizado', `Se ha eliminado el ícono de esquina personalizado del Feed con las tags _"${safeTags(gcfg.feeds[fetchedChannel.id].tags)}"_ para el canal **${fetchedChannel.name}**`);
		return await interaction.update({
			embeds: [concludedEmbed],
			components: [new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId('feed_customizeOne')
					.setLabel('Seguir personalizando')
					.setStyle('PRIMARY'),
			)],
		});
	},

	/**@param {import('discord.js').SelectMenuInteraction} interaction */
	async ['selectFeedDelete'](interaction) {
		const chid = interaction.values[0];
		module.exports[interaction.channel.id].memoChannel = interaction.guild.channels.cache.get(chid);
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		const tags = gcfg.feeds[chid].tags;
		const wizard = new MessageEmbed()
			.setColor('RED')
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

	/**
	 * @param {import('discord.js').Message | import('discord.js').ButtonInteraction} interaction
	 * @param {Boolean} reply
	 * @param {String} backButtonFn
	 */
	async setupTagsCollector(interaction, reply, backButtonFn) {
		const fetchedChannel = module.exports[interaction.channel.id].memoChannel;
		const wizard = new MessageEmbed()
			.setColor('BLURPLE')
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('4/4 • Asignar tags')
			.addField('Destino', `**${fetchedChannel.name}** (canal ${fetchedChannel.nsfw ? 'NSFW' : 'SFW'})`)
			.addField('Describe las tags del Feed', 'Entra a [Gelbooru](https://gelbooru.com) y realiza una búsqueda con tags que te den las imágenes deseadas para el Feed, separadas por espacios. Una vez lo consigas, simplemente copia las tags y envíalas como mensaje.\n_Es necesario que las tags estén bien escritas_')
			.addField('Control de contenidos', '**IMPORTANTE:** Si quieres resultados SFW, utiliza la tag meta `rating:safe`; si quieres resultados NSFW, añade la tag `rating:explicit`; si quieres una combinación de ambos, no ingreses ninguna de estas')
			.addField('Ejemplo de uso', 'Enviar `touhou rating:safe -breast_grab` configurará un Feed de imágenes _SFW_ de Touhou que _no_ tengan la tag "breast_grab"');
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

			const guildQuery = { guildId: interaction.guild.id };
			const gcfg = (await GuildConfig.findOne(guildQuery)) || new GuildConfig(guildQuery);
			gcfg.feeds = gcfg.feeds || {};
			gcfg.feeds[fetchedChannel.id] = gcfg.feeds[fetchedChannel.id] || { ids: (new Array(16)).fill('') };
			gcfg.feeds[fetchedChannel.id].tags = ccontent;
			gcfg.markModified('feeds');
			await gcfg.save();

			const concludedEmbed = new MessageEmbed()
				.setColor('DARK_VIVID_PINK')
				.setAuthor(wiztitle, interaction.client.user.avatarURL())
				.setFooter('Operación finalizada')
				.addField('Feed configurado', `Se ha configurado un Feed con las tags _"${safeTags(ccontent)}"_ para el canal **${fetchedChannel.name}**`)
				.addField('Control del Feed', 'Puedes modificar, personalizar o eliminar este Feed en cualquier momento siguiendo el Asistente de `p!feed` una vez más');
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
			.setColor('DARK_RED')
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
			let ccontent = collected.content;
			if(ccontent.startsWith('<#') && ccontent.endsWith('>')) {
				ccontent = ccontent.slice(2, -1);
				if(ccontent.startsWith('!')) ccontent = ccontent.slice(1);
			}
			const channels = interaction.guild.channels.cache;
			const fetchedChannel = isNaN(ccontent)
				? channels.filter(c => c.isText()).find(c => c.name.toLowerCase().indexOf(ccontent) !== -1)
				: channels.filter(c => c.isText()).find(c => c.id === ccontent);
			if(fetchedChannel) {
				collected.delete();
				module.exports[interaction.channel.id].memoChannel = fetchedChannel;
				module.exports.setupTagsCollector(interaction, false, 'feed_createNew');
				module.exports[interaction.channel.id].memoCollector.stop();
			}
		});
		const wizard = new MessageEmbed()
			.setColor('GOLD')
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
			.setColor('GREYPLE')
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('3/4 • Seleccionar Feed')
			.addField('Selección de Feed', 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras modificar en esta lista y selecciónalo');
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		const feeds = Object.entries(gcfg.feeds).map(([chid, feed]) => {
			const channel = interaction.guild.channels.cache.get(chid);
			if(!channel) {
				delete gcfg.feeds[chid];
				gcfg.markModified('feeds');
				return null;
			}
			return {
				label: feed.tags.slice(0, 99),
				description: `#${channel.name}`,
				value: chid,
			};
		}).filter(feed => feed);
		gcfg.save();
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
	async ['customizeOne'](interaction) {
		const unColl = module.exports[interaction.channel.id].memoCollector;
		if(unColl && !unColl.ended) unColl.stop();
		const wizard = new MessageEmbed()
			.setColor('GREYPLE')
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('3/5 • Seleccionar Feed')
			.addField('Selección de Feed', 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras personalizar en esta lista y selecciónalo');
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		const feeds = Object.entries(gcfg.feeds).map(([chid, feed]) => {
			const channel = interaction.guild.channels.cache.get(chid);
			if(!channel) {
				delete gcfg.feeds[chid];
				gcfg.markModified('feeds');
				return null;
			}
			return {
				label: feed.tags.slice(0, 99),
				description: `#${channel.name}`,
				value: chid,
			};
		}).filter(feed => feed);
		gcfg.save();
		return await interaction.update({
			embeds: [wizard],
			components: [
				new MessageActionRow().addComponents(
					new MessageSelectMenu()
						.setCustomId('feed_selectFeedCustomize')
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
			.setColor('GREYPLE')
			.setAuthor(wiztitle, interaction.client.user.avatarURL())
			.setFooter('3/4 • Seleccionar Feed')
			.addField('Selección de Feed', 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras eliminar en esta lista y selecciónalo');
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		const feeds = Object.entries(gcfg.feeds).map(([chid, feed]) => ({
			label: feed.tags.slice(0, 99),
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

	/**@param {import('discord.js').ButtonInteraction} interaction */
	async ['showFeedImageUrl'](interaction) {
		const url = interaction.message.components[0].components[0].url;
		const apiurl = url.replace(
			'page=post&s=view',
			'page=dapi&s=post&q=index&json=1'
		);
		const source = await axios.get(apiurl)
		.then(response => response.data.post[0].source)
		.catch(error => {
			console.error(error);
			return 'Ocurrió un problema al contactar con el Booru para recuperar las tags.\nInténtalo de nuevo, si el problema persiste, es probable que el objetivo no esté disponible o que se trate de un bug de mi parte';
		});
		return await interaction.reply({
			content: `<:gelbooru:919398540172750878> **Post** <${url}>${ source ? `\n<:urlwhite:922669195521568818> **Fuente** <${source}>` : '' }`,
			ephemeral: true,
		});
	},

	/**@param {import('discord.js').ButtonInteraction} interaction */
	async ['showFeedImageTags'](interaction) {
		const url = interaction.message.components[0].components[0].url;
		const apiurl = url.replace(
			'page=post&s=view',
			'page=dapi&s=post&q=index&json=1'
		);
		let tags, source;
		await axios.get(apiurl)
		.then(response => {
			post = response.data.post[0];
			tags = post.tags.slice(0, 1600);
			source = post.source;
		})
		.catch(error => {
			console.error(error);
			return 'Ocurrió un problema al contactar con el Booru para recuperar las tags.\nInténtalo de nuevo, si el problema persiste, es probable que el objetivo no esté disponible o que se trate de un bug de mi parte';
		});
		return await interaction.reply({
			content: `<:tagswhite:921788204540100608> **Tags**\n${tags}\n<:gelbooru:919398540172750878> **Post** <${url}>${ source ? `\n<:urlwhite:922669195521568818> **Fuente** <${source}>` : '' }`,
			ephemeral: true,
		});
	},

	/**@param {import('discord.js').ButtonInteraction} interaction */
	async ['deleteFeedImage'](interaction) {
		if(isNotModerator(interaction.member))
			return await interaction.reply({
				content: ':x: No tienes permiso para hacer eso, teehee~',
				ephemeral: true,
			});
		
		const { message } = interaction;
		const url = message.components[0].components[0].url;
		const apiurl = url.replace(
			'page=post&s=view',
			'page=dapi&s=post&q=index&json=1'
		);
		const tags = await axios.get(apiurl).then(response => response.data.post[0].tags.slice(0, 1800));
		return await Promise.all([
			interaction.reply({
				content: `<:gelbooru:919398540172750878> **Eliminado** <${url}>\n<:tagswhite:921788204540100608> **Tags rescatadas** *Puedes revisarlas y blacklistear algunas con "-"*\n${tags}`,
				ephemeral: true,
			}),
			message.delete().catch(console.error),
		]);
	}
};