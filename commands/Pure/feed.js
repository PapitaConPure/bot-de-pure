const { default: axios } = require('axios');
const { MessageEmbed, MessageActionRow, MessageButton, MessageCollector, MessageSelectMenu, Modal, TextInputComponent } = require('discord.js');
const { isNotModerator, shortenText, guildEmoji } = require('../../func.js');
const GuildConfig = require('../../localdata/models/guildconfigs.js');
const { auditError } = require('../../systems/auditor.js');
const { CommandMetaFlagsManager } = require('../Commons/cmdFlags.js');
const globalConfigs = require('../../localdata/config.json');
const { Booru } = require('../../systems/boorufetch.js');
const { CommandManager } = require('../Commons/cmdBuilder.js');
const { addGuildToFeedUpdateStack } = require('../../systems/boorufeed.js');

const wiztitle = 'Asistente de configuración de Feed de imágenes';
const cancelbutton = new MessageButton()
	.setCustomId('feed_cancelWizard')
	.setLabel('Cancelar')
	.setStyle('SECONDARY');
const safeTags = (_tags = '') => _tags.replace(/\\*\*/g,'\\*').replace(/\\*_/g,'\\_');
/**
 * @param {import('discord.js').ButtonInteraction} interaction 
 * @returns {Promise<Array<import('discord.js').MessageSelectOptionData>>}
 */
const generateFeedOptions = async (interaction) => {
	const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
	const feeds = Object.entries(gcfg.feeds).map(([chid, feed]) => {
		const channel = interaction.guild.channels.cache.get(chid);
		if(!channel) {
			delete gcfg.feeds[chid];
			gcfg.markModified('feeds');
			return null;
		}
		return ({
			label: shortenText(feed.tags, 99),
			description: `#${channel.name}`,
			value: chid,
		});
	}).filter(feed => feed);
	gcfg.save();
	return feeds;
}
/**
 * @param {import('discord.js').Message | import('discord.js').ButtonInteraction} interaction
 * @param {Boolean} reply
 * @param {String} backButtonFn
 */
function tagsSetupPrompt(interaction, channelId) {
	const fetchedChannel = interaction.guild.channels.cache.get(channelId);
	const gelEmoji = guildEmoji('gelbooru', globalConfigs.slots.slot3);
	const embed = new MessageEmbed()
		.setColor('BLURPLE')
		.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
		.setFooter({ text: 'Asignar tags' })
		.addFields(
			{ name: 'Destino', value: `**${fetchedChannel.name}** (canal ${fetchedChannel.nsfw ? 'NSFW' : 'SFW'})` },
			{
				name: 'Describe las tags del Feed',
				value: [
					'Entra a [Gelbooru](https://gelbooru.com) y realiza una búsqueda con tags que te den las imágenes deseadas para el Feed, separadas por espacios.',
					'Una vez lo consigas, simplemente copia las tags y presiona "Ingresar tags".',
					'_Es necesario que las tags estén bien escritas_',
				].join('\n'),
			},
			{
				name: '(IMPORTANTE) Control de contenidos',
				value: [
					'🧒 Si quieres resultados SFW, utiliza la meta-tag `rating:general` o `rating:sensitive`',
					'🔞 Si quieres resultados NSFW, añade la tag `rating:explicit` o `rating:questionable`',
					'❔ Si quieres una combinación de ambos, no ingreses ninguna de estas',
				].join('\n'),
			},
			{ name: 'Cómo buscar',    value: `[${gelEmoji} howto:search](https://gelbooru.com/index.php?page=wiki&s=view&id=25921)`,     inline: true },
			{ name: 'Sobre ratings',  value: `[${gelEmoji} howto:rate](https://gelbooru.com/index.php?page=wiki&s=view&id=2535)`,        inline: true },
			{ name: 'Ayudamemoria',   value: `[${gelEmoji} howto:cheatsheet](https://gelbooru.com/index.php?page=wiki&s=view&id=26263)`, inline: true },
			{ name: 'Ejemplo de uso', value: 'Enviar `touhou rating:general -breast_grab` configurará un Feed de imágenes _SFW_ de Touhou que _no_ tengan la tag "breast_grab"' },
		);
	return embed;
};

const flags = new CommandMetaFlagsManager().add(
	'COMMON',
	'MOD',
);
const command = new CommandManager('feed', flags)
	.setBriefDescription('Inicializa un Feed en un canal por medio de un Asistente.')
	.setLongDescription('Inicializa un Feed de imágenes en un canal. Simplemente usa el comando y sigue los pasos del Asistente para configurar y personalizar todo')
	.setExecution(async (request, _args, _isSlash) => {
		const wizard = new MessageEmbed()
			.setColor('AQUA')
			.setAuthor({ name: wiztitle, iconURL: request.client.user.avatarURL() })
			.setFooter({ text: 'Comenzar' })
			.addFields({
				name: 'Bienvenido',
				value: 'Si es la primera vez que configuras un Feed de imágenes con Bot de Puré, ¡no te preocupes! Simplemente sigue las instrucciones del Asistente y adapta tu Feed a lo que quieras',
			});
		return request.reply({
			embeds: [wizard],
			components: [new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId('feed_startWizard')
					.setLabel('Comenzar')
					.setStyle('PRIMARY'),
				cancelbutton,
			)],
		});
	})
	.setButtonResponse(async function startWizard(interaction) {
		const wizard = new MessageEmbed()
			.setColor('NAVY')
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Seleccionar operación' })
			.addFields({ name: 'Selecciona una operación', value: '¿Qué deseas hacer ahora mismo?' });
			
		const guildQuery = { guildId: interaction.guild.id };
		const gcfg = (await GuildConfig.findOne(guildQuery)) || new GuildConfig(guildQuery);
		const premade = gcfg.feeds && Object.keys(gcfg.feeds).length;
		return interaction.update({
			embeds: [wizard],
			components: [
				new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId('feed_createNew')
						.setLabel('Crear un nuevo Feed')
						.setStyle('SUCCESS'),
					new MessageButton()
						.setCustomId('feed_selectDelete')
						.setLabel('Eliminar un Feed')
						.setStyle('DANGER')
						.setDisabled(!premade),
					cancelbutton,
				),
				new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId('feed_selectEdit')
						.setLabel('Editar un Feed')
						.setStyle('PRIMARY')
						.setDisabled(!premade),
					new MessageButton()
						.setCustomId('feed_selectCustomize')
						.setLabel('Personalizar un Feed')
						.setStyle('PRIMARY')
						.setDisabled(!premade),
					new MessageButton()
						.setCustomId('feed_selectView')
						.setLabel('Ver un Feed')
						.setStyle('PRIMARY')
						.setDisabled(!premade),
				),
			],
		});
	})
	.setButtonResponse(async function createNew(interaction) {
		const channelInput = new TextInputComponent()
			.setCustomId('channelInput')
			.setLabel('Canal')
			.setPlaceholder(`Ej: #${interaction.channel.name} / ${interaction.channel.id}`)
			.setStyle('SHORT')
			.setRequired(true);
		const row = new MessageActionRow().addComponents(channelInput);
		const modal = new Modal()
			.setCustomId('feed_createOnChannel')
			.setTitle('Creación de Feed')
			.addComponents(row);
		return interaction.showModal(modal);
	})
	.setModalResponse(async function createOnChannel(interaction) {
		let input = interaction.fields.getTextInputValue('channelInput');
		if(input.startsWith('<') && input.endsWith('>'))
			input = input.slice(1, -1);
		if(input.startsWith('#'))
			input = input.slice(1);
		if(input.startsWith('!'))
			input = input.slice(1);
			
		const channels = interaction.guild.channels.cache;
		const fetchedChannel = isNaN(input)
			? channels.filter(c => c.isText()).find(c => c.name.toLowerCase().indexOf(input) !== -1)
			: channels.filter(c => c.isText()).get(input);
			
		if(!fetchedChannel)
			return interaction.reply({ content: '⚠ Canal inválido', ephemeral: true });

		const wizard = tagsSetupPrompt(interaction, fetchedChannel.id);
		return interaction.update({
			embeds: [wizard],
			components: [new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId(`feed_editTags_${fetchedChannel.id}`)
					.setLabel('Ingresar Tags')
					.setStyle('PRIMARY'),
				new MessageButton()
					.setCustomId('feed_startWizard')
					.setLabel('Volver')
					.setStyle('SECONDARY'),
				cancelbutton,
			)],
		});
	})
	.setButtonResponse(async function editTags(interaction, channelId) {
		const tagsInput = new TextInputComponent()
			.setCustomId('tagsInput')
			.setPlaceholder('rating:general touhou animated* -chibi')
			.setLabel('Tags')
			.setStyle('PARAGRAPH')
			.setRequired(true)
			.setMaxLength(4000);
		const row = new MessageActionRow().addComponents(tagsInput);
		const modal = new Modal()
			.setCustomId(`feed_setTags_${channelId}`)
			.setTitle('Personalización de Feed')
			.addComponents(row);
		return interaction.showModal(modal);
	})
	.setModalResponse(async function setTags(interaction, channelId) {
		const fetchedChannel = interaction.guild.channels.cache.get(channelId);
		const input = interaction.fields.getTextInputValue('tagsInput');

		const guildQuery = { guildId: interaction.guild.id };
		const gcfg = (await GuildConfig.findOne(guildQuery)) || new GuildConfig(guildQuery);
		gcfg.feeds ??= {};
		gcfg.feeds[fetchedChannel.id] ??= { ids: (new Array(16)).fill(0) };
		gcfg.feeds[fetchedChannel.id].tags = input;
        addGuildToFeedUpdateStack(interaction.guild);
		gcfg.markModified('feeds');
		await gcfg.save();

		const concludedEmbed = new MessageEmbed()
			.setColor('DARK_VIVID_PINK')
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación finalizada' })
			.addFields(
				{ name: 'Feed configurado', value: `Se ha configurado un Feed con las tags _"${safeTags(input)}"_ para el canal **${fetchedChannel.name}**` },
				{ name: 'Control del Feed', value: 'Puedes modificar, personalizar o eliminar este Feed en cualquier momento siguiendo el Asistente de `p!feed` una vez más' },
			);
		return interaction.update({
			embeds: [concludedEmbed],
			components: [],
		});
	})
	.setButtonResponse(async function selectEdit(interaction) {
		const wizard = new MessageEmbed()
			.setColor('GREYPLE')
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Seleccionar Feed' })
			.addFields({ name: 'Selección de Feed', value: 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras modificar en esta lista y selecciónalo' });
		const feeds = await generateFeedOptions(interaction);
		if(!feeds.length) return interaction.reply({ content: '⚠ No hay Feeds para mostrar', ephemeral: true });
		return interaction.update({
			embeds: [wizard],
			components: [
				new MessageActionRow().addComponents(
					new MessageSelectMenu()
						.setCustomId('feed_selectedEdit')
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
	})
	.setButtonResponse(async function selectCustomize(interaction) {
		const wizard = new MessageEmbed()
			.setColor('GREYPLE')
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Seleccionar Feed' })
			.addFields({ name: 'Selección de Feed', value: 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras personalizar en esta lista y selecciónalo' });
		const feeds = await generateFeedOptions(interaction);
		if(!feeds.length) return interaction.reply({ content: '⚠ No hay Feeds para mostrar', ephemeral: true });
		return interaction.update({
			embeds: [wizard],
			components: [
				new MessageActionRow().addComponents(
					new MessageSelectMenu()
						.setCustomId('feed_selectedCustomize')
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
	})
	.setButtonResponse(async function selectView(interaction) {
		const wizard = new MessageEmbed()
			.setColor('GREYPLE')
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Seleccionar Feed' })
			.addFields({ name: 'Selección de Feed', value: 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras ver en esta lista y selecciónalo' });
		const feeds = await generateFeedOptions(interaction);
		if(!feeds.length) return interaction.reply({ content: '⚠ No hay Feeds para mostrar', ephemeral: true });
		return interaction.update({
			embeds: [wizard],
			components: [
				new MessageActionRow().addComponents(
					new MessageSelectMenu()
						.setCustomId('feed_selectedView')
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
	})
	.setButtonResponse(async function selectDelete(interaction) {
		const wizard = new MessageEmbed()
			.setColor('GREYPLE')
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Seleccionar Feed' })
			.addFields({ name: 'Selección de Feed', value: 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras eliminar en esta lista y selecciónalo' });
		const feeds = await generateFeedOptions(interaction);
		if(!feeds.length) return interaction.reply({ content: '⚠ No hay Feeds para mostrar', ephemeral: true });
		return interaction.update({
			embeds: [wizard],
			components: [
				new MessageActionRow().addComponents(
					new MessageSelectMenu()
						.setCustomId('feed_selectedDelete')
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
	})
	.setSelectMenuResponse(async function selectedEdit(interaction) {
		const channelId = interaction.values[0];
		const wizard = tagsSetupPrompt(interaction, channelId);
		return interaction.update({
			embeds: [wizard],
			components: [new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId(`feed_editTags_${channelId}`)
					.setLabel('Ingresar Tags')
					.setStyle('PRIMARY'),
				new MessageButton()
					.setCustomId('feed_selectEdit')
					.setLabel('Volver')
					.setStyle('SECONDARY'),
				cancelbutton,
			)],
		});
	})
	.setSelectMenuResponse(async function selectedCustomize(interaction) {
		const fetchedChannel = interaction.guild.channels.cache.get(interaction.values[0] || interaction.channel.id);
		const wizard = new MessageEmbed()
			.setColor('BLURPLE')
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Seleccionar elemento a personalizar' })
			.addFields(
				{ name: 'Destino', value: `**${fetchedChannel.name}** (canal ${fetchedChannel.nsfw ? 'NSFW' : 'SFW'})` },
				{ name: 'Selecciona un elemento a personalizar', value: 'Usa el menú desplegable para decidir qué personalizar' },
			);
		
		return interaction.update({
			embeds: [wizard],
			components: [
				new MessageActionRow().addComponents(
					new MessageSelectMenu()
						.setCustomId(`feed_selectItemCustomize_${fetchedChannel.id}`)
						.setPlaceholder('Selecciona un elemento')
						.setOptions([
							{
								label: 'Título',
								description: 'Asigna o elimina un encabezado para mostrar en cada imagen',
								value: 'title',
							},
							{
								label: 'Tags',
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
						.setCustomId('feed_selectCustomize')
						.setLabel('Volver')
						.setStyle('SECONDARY'),
					cancelbutton,
				),
			],
		});
	})
	.setSelectMenuResponse(async function selectedView(interaction) {
		const fetchedChannel = interaction.guild.channels.cache.get(interaction.values[0] || interaction.channel.id);
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		const feed = gcfg.feeds[fetchedChannel.id];
		const wizard = new MessageEmbed()
			.setColor('BLURPLE')
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Visualizando tags' })
			.addFields(
				{ name: 'Destino', value: `**${fetchedChannel.name}** (canal ${fetchedChannel.nsfw ? 'NSFW' : 'SFW'})` },
				{ name: 'Tags del Feed', value: `\`\`\`${feed?.tags}\`\`\`` },
			);
		
		return interaction.update({
			embeds: [wizard],
			components: [
				new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId('feed_selectView')
						.setLabel('Volver')
						.setStyle('SECONDARY'),
					cancelbutton,
				),
			],
		});
	})
	.setSelectMenuResponse(async function selectedDelete(interaction) {
		const chid = interaction.values[0];
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		const tags = gcfg.feeds[chid].tags;
		const wizard = new MessageEmbed()
			.setColor('RED')
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Confirmar' })
			.addFields({
				name: 'Confirmar eliminación de Feed',
				value: `Estás por borrar el Feed _"${safeTags(tags)}"_ ubicado en el canal **<#${chid}>**. ¿Estás seguro?`,
			});
		return interaction.update({
			embeds: [wizard],
			components: [new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId(`feed_deleteOne_${chid}`)
					.setLabel('Borrar')
					.setStyle('DANGER'),
				new MessageButton()
					.setCustomId('feed_selectDelete')
					.setLabel('Volver')
					.setStyle('SECONDARY'),
				cancelbutton,
			)],
		});
	})
	.setButtonResponse(async function deleteOne(interaction, channelId) {
		const wizard = new MessageEmbed()
			.setColor('DARK_RED')
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación finalizada' })
			.addFields({ name: 'Feed eliminado', value: 'Se ha eliminado el Feed acordado. Si te arrepientes, tendrás que crearlo otra vez' });
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		delete gcfg.feeds[channelId];
		gcfg.markModified('feeds');
		return Promise.all([
			gcfg.save(),
			interaction.update({
				embeds: [wizard],
				components: [],
			}),
		]);
	})
	.setSelectMenuResponse(async function selectItemCustomize(interaction, channelId) {
		const customizeTarget = interaction.values[0];
		const fetchedChannel = interaction.guild.channels.cache.get(channelId);
		console.log(channelId, fetchedChannel);
		
		const wizard = new MessageEmbed()
			.setColor('GREEN')
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Personalizar elemento' })
			.addFields({ name: 'Destino', value: `**${fetchedChannel.name}** (canal ${fetchedChannel.nsfw ? 'NSFW' : 'SFW'})` });
		
		const row = new MessageActionRow();
		switch(customizeTarget) {
			case 'title':
				wizard.addFields({
					name: 'Personaliza el título',
					value: 'Clickea "Personalizar" e introduce el título que quieras que aparezca encima de cada imagen del Feed. Si quieres eliminar el título actual, usa el respectivo botón',
				});
				row.addComponents(
					new MessageButton()
						.setCustomId(`feed_customizeTitle_${channelId}`)
						.setLabel('Personalizar')
						.setStyle('PRIMARY'),
					new MessageButton()
						.setCustomId(`feed_removeCustomTitle_${channelId}`)
						.setLabel('Eliminar título')
						.setStyle('DANGER'),
				);
				break;

			case 'tags':
				wizard.addFields(
					{
						name: 'Personaliza la cantidad de tags',
						value: 'Clickea "Personalizar" e introduce la cantidad máxima de tags a mostrar (número). Por defecto esto serían unas **20** tags, y puedes especificar hasta un máximo de **50**',
					},
					{ name: 'Eliminar campo de tags', value: 'Si envías "0", el campo de tags se ocultará por completo. No se permiten números negativos' },
				);
				row.addComponents(
					new MessageButton()
						.setCustomId(`feed_customizeTags_${channelId}`)
						.setLabel('Personalizar')
						.setStyle('PRIMARY'),
					new MessageButton()
						.setCustomId(`feed_removeCustomTags_${channelId}`)
						.setLabel('Restaurar cantidad por defecto')
						.setStyle('DANGER'),
				);
				break;

			case 'footer':
				wizard.addFields({
					name: 'Personaliza el pie',
					value: 'Clickea "Personalizar" e introduce un texto breve. Si quieres eliminar el pie actual, usa el respectivo botón',
				});
				row.addComponents(
					new MessageButton()
						.setCustomId(`feed_customizeFooter_${channelId}`)
						.setLabel('Personalizar')
						.setStyle('PRIMARY'),
					new MessageButton()
						.setCustomId(`feed_removeCustomFooter_${channelId}`)
						.setLabel('Eliminar pie')
						.setStyle('DANGER'),
				);
				break;

			case 'cornerIcon':
				wizard.addFields({
					name: 'Personaliza el ícono de esquina',
					value: 'Clickea "Personalizar" e introduce un enlace a una imagen. Si quieres eliminar la imagen actual, usa el respectivo botón',
				});
				row.addComponents(
					new MessageButton()
						.setCustomId(`feed_customizeIcon_${channelId}`)
						.setLabel('Personalizar')
						.setStyle('PRIMARY'),
					new MessageButton()
						.setCustomId(`feed_removeCustomIcon_${channelId}`)
						.setLabel('Restaurar ícono por defecto')
						.setStyle('DANGER'),
				);
				break;
		}
		row.addComponents(
			new MessageButton()
				.setCustomId('feed_selectCustomize')
				.setLabel('Volver')
				.setStyle('SECONDARY'),
			cancelbutton,
		);
		return interaction.update({
			embeds: [wizard],
			components: [row],
		});
	})
	.setButtonResponse(async function customizeTitle(interaction, channelId) {
		const titleInput = new TextInputComponent()
			.setCustomId('titleInput')
			.setLabel('Título')
			.setPlaceholder('Ej: GIFs PixelArt')
			.setStyle('SHORT')
			.setRequired(true)
			.setMaxLength(255);
		const row = new MessageActionRow().addComponents(titleInput);
		const modal = new Modal()
			.setCustomId(`feed_setCustomTitle_${channelId}`)
			.setTitle('Personalización de Feed')
			.addComponents(row);

		interaction.showModal(modal);
	})
	.setButtonResponse(async function customizeTags(interaction, channelId) {
		const tagsInput = new TextInputComponent()
			.setCustomId('tagsInput')
			.setLabel('Cantidad de tags a mostrar')
			.setPlaceholder('Introduce 0 para no mostrar tags')
			.setStyle('SHORT')
			.setRequired(true)
			.setMinLength(1)
			.setMaxLength(2);
		const row = new MessageActionRow().addComponents(tagsInput);
		const modal = new Modal()
			.setCustomId(`feed_setCustomMaxTags_${channelId}`)
			.setTitle('Personalización de Feed')
			.addComponents(row);

		interaction.showModal(modal);
	})
	.setButtonResponse(async function customizeFooter(interaction, channelId) {
		const footerInput = new TextInputComponent()
			.setCustomId('footerInput')
			.setLabel('Pie de imagen')
			.setPlaceholder('Ej: ¡Es una imagen muy bonita~!')
			.setStyle('SHORT')
			.setRequired(true)
			.setMaxLength(255);
		const row = new MessageActionRow().addComponents(footerInput);
		const modal = new Modal()
			.setCustomId(`feed_setCustomFooter_${channelId}`)
			.setTitle('Personalización de Feed')
			.addComponents(row);

		interaction.showModal(modal);
	})
	.setButtonResponse(async function customizeIcon(interaction, channelId) {
		const iconInput = new TextInputComponent()
			.setCustomId('iconInput')
			.setLabel('Enlace de ícono de esquina')
			.setPlaceholder('Ejemplo:\nhttps://cdn.discordapp.com/attachments/956023682734624838/1001416736261799937/doremy.png')
			.setStyle('PARAGRAPH')
			.setRequired(true)
			.setMaxLength(255);
		const row = new MessageActionRow().addComponents(iconInput);
		const modal = new Modal()
			.setCustomId(`feed_setCustomIcon_${channelId}`)
			.setTitle('Personalización de Feed')
			.addComponents(row);

		interaction.showModal(modal);
	})
	.setModalResponse(async function setCustomTitle(interaction, channelId) {
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		const input = interaction.fields.getTextInputValue('titleInput');
		gcfg.feeds[channelId].title = input;
		gcfg.markModified('feeds');
		gcfg.save();

		return interaction.reply({ content: '✅ Título actualizado', ephemeral: true });

	})
	.setModalResponse(async function setCustomMaxTags(interaction, channelId) {
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		const input = interaction.fields.getTextInputValue('tagsInput');
		const maxTags = parseInt(input);

		if(isNaN(maxTags) || maxTags < 0 || maxTags > 50)
			return interaction.reply({ content: '⚠ Cantidad inválida. Introduce un número entre 0 y 50' });

		gcfg.markModified('feeds');
		gcfg.save();
		gcfg.feeds[channelId].maxTags = maxTags;

		return interaction.reply({ content: '✅ Cantidad de tags máxima actualizada', ephemeral: true });
	})
	.setModalResponse(async function setCustomFooter(interaction, channelId) {
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		const input = interaction.fields.getTextInputValue('footerInput');

		gcfg.feeds[channelId].footer = input;
		gcfg.markModified('feeds');
		gcfg.save();

		return interaction.reply({ content: '✅ Pie de imagen actualizado', ephemeral: true });
	})
	.setModalResponse(async function setCustomIcon(interaction, channelId) {
		const [ gcfg ] = await Promise.all([
			GuildConfig.findOne({ guildId: interaction.guild.id }),
			interaction.deferReply({ ephemeral: true }),
		]);
		const input = interaction.fields.getTextInputValue('iconInput');
		
		//Crear embed de prueba para asegurarse de que el enlace sea una imagen válida
		const testEmbed = new MessageEmbed()
			.setColor('WHITE')
			.setAuthor({ name: 'Verificando enlace...', iconURL: input });

		try {
			const sent = await interaction.channel.send({ embeds: [testEmbed] });
			console.log(sent.embeds[0].author);
			if(sent.embeds[0].author.iconURL)
				gcfg.feeds[channelId].cornerIcon = input;
			setTimeout(() => { if(sent.deletable) sent.delete().catch(console.error) }, 1500);
			gcfg.markModified('feeds');
			gcfg.save();
			return interaction.editReply({ content: '✅ Ícono actualizado' });
		} catch(error) {
			auditError(error);
			return interaction.editReply({ content: '⚠ Enlace inválido. Asegúrate de proveer un enlace completo y directo a la imagen' })
		}
	})
	.setButtonResponse(async function removeCustomTitle(interaction, channelId) {
		const fetchedChannel = interaction.guild.channels.cache.get(channelId);
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		delete gcfg.feeds[channelId].title;
		gcfg.markModified('feeds');
		await gcfg.save();

		const concludedEmbed = new MessageEmbed()
			.setColor('DARK_GREEN')
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación finalizada' })
			.addFields({
				name: 'Feed personalizado',
				value: `Se ha eliminado el título personalizado del Feed con las tags _"${safeTags(gcfg.feeds[channelId].tags)}"_ para el canal **${fetchedChannel.name}**`,
			});
		return interaction.update({
			embeds: [concludedEmbed],
			components: [new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId('feed_selectCustomize')
					.setLabel('Seguir personalizando')
					.setStyle('PRIMARY'),
			)],
		});
	})
	.setButtonResponse(async function removeCustomTags(interaction, channelId) {
		const fetchedChannel = interaction.guild.channels.cache.get(channelId);
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		delete gcfg.feeds[channelId].tags;
		gcfg.markModified('feeds');
		await gcfg.save();

		const concludedEmbed = new MessageEmbed()
			.setColor('DARK_GREEN')
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación finalizada' })
			.addFields({
				name: 'Feed personalizado',
				value: `Se ha restaurado la cantidad de tags máxima por defecto del Feed con las tags _"${safeTags(gcfg.feeds[channelId].tags)}"_ para el canal **${fetchedChannel.name}**`,
			});
		return interaction.update({
			embeds: [concludedEmbed],
			components: [new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId('feed_selectCustomize')
					.setLabel('Seguir personalizando')
					.setStyle('PRIMARY'),
			)],
		});
	})
	.setButtonResponse(async function removeCustomFooter(interaction, channelId) {
		const fetchedChannel = interaction.guild.channels.cache.get(channelId);
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		delete gcfg.feeds[fetchedChannel.id].footer;
		gcfg.markModified('feeds');
		await gcfg.save();

		const concludedEmbed = new MessageEmbed()
			.setColor('DARK_GREEN')
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación finalizada' })
			.addFields({
				name: 'Feed personalizado',
				value: `Se ha eliminado el texto de pie personalizado del Feed con las tags _"${safeTags(gcfg.feeds[fetchedChannel.id].tags)}"_ para el canal **${fetchedChannel.name}**`,
			});
		return interaction.update({
			embeds: [concludedEmbed],
			components: [new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId('feed_selectCustomize')
					.setLabel('Seguir personalizando')
					.setStyle('PRIMARY'),
			)],
		});
	})
	.setButtonResponse(async function removeCustomIcon(interaction, channelId) {
		const fetchedChannel = interaction.guild.channels.cache.get(channelId);
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		delete gcfg.feeds[fetchedChannel.id].cornerIcon;
		gcfg.markModified('feeds');
		await gcfg.save();

		const concludedEmbed = new MessageEmbed()
			.setColor('DARK_GREEN')
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación finalizada' })
			.addFields({
				name: 'Feed personalizado',
				value: `Se ha eliminado el ícono de esquina personalizado del Feed con las tags _"${safeTags(gcfg.feeds[fetchedChannel.id].tags)}"_ para el canal **${fetchedChannel.name}**`,
			});
		return interaction.update({
			embeds: [concludedEmbed],
			components: [new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId('feed_selectCustomize')
					.setLabel('Seguir personalizando')
					.setStyle('PRIMARY'),
			)],
		});
	})
	.setButtonResponse(async function cancelWizard(interaction) {
		const cancelEmbed = new MessageEmbed()
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación abortada' })
			.addFields({ name: 'Asistente cancelado', value: 'Se canceló la configuración de Feed' });
		return interaction.update({
			embeds: [cancelEmbed],
			components: [],
		});
	})
	.setButtonResponse(async function showFeedImageUrl(interaction) {
		//Función en desuso. Permanece por compatibilidad
		return this.showFeedImageTags(interaction);
	})
	.setButtonResponse(async function showFeedImageTags(interaction) {
		const url = interaction.message.components[0].components[0].url;
		const booru = new Booru(globalConfigs.booruCredentials);
		try {
			const post = await booru.fetchPostByUrl(url);
			const tags = shortenText(post.tags.join(', '), 1800);
			const source = post.source;
			return interaction.reply({
				// content: `<:tagswhite:921788204540100608> **Tags**\n${tags}\n<:gelbooru:919398540172750878> **Post** <${url}>${ source ? `\n<:urlwhite:922669195521568818> **Fuente** <${source}>` : '' }`,
				embeds: [
					new MessageEmbed()
						.addFields(
							{ name: '<:tagswhite:921788204540100608> Tags', value: `\`\`\`${tags}\`\`\`` },
							{
								name: '<:urlwhite:922669195521568818> Enlaces',
								value: `[<:gelbooru:919398540172750878> **Post**](${url})${ source ? ` [<:heartwhite:969664712604262400> **Fuente**](${source})` : '' }`,
							},
						),
				],
				components: [new MessageActionRow().addComponents([
					new MessageButton()
						.setCustomId(`feed_editFollowedTags_ADD`)
						.setLabel('Seguir tags...')
						.setStyle('SUCCESS'),
					new MessageButton()
						.setCustomId(`feed_editFollowedTags_REMOVE`)
						.setLabel('Dejar de seguir tags...')
						.setStyle('DANGER'),
				])],
				ephemeral: true,
			});
		} catch(error) {
			auditError(error);
			return interaction.reply({
				content: 'Ocurrió un problema al contactar con el Booru para recuperar las tags.\nInténtalo de nuevo, si el problema persiste, es probable que el objetivo no esté disponible o que se trate de un bug de mi parte',
				ephemeral: true,
			});
		}
	})
	.setButtonResponse(async function editFollowedTags(interaction, operation) {
		const tagsInput = new TextInputComponent()
			.setCustomId('tagsInput')
			.setMinLength(1)
			.setMaxLength(128)
			.setPlaceholder('Ejemplo: touhou animated 1girl')
			.setStyle('PARAGRAPH');
		let title;

		if(operation === 'ADD') {
			tagsInput.setLabel('Elige qué tags quieres seguir');
			title = 'Seguir tags';
		} else {
			tagsInput.setLabel('Elige qué tags quieres dejar de seguir');
			title = 'Dejar de seguir tags';
		}

		const row = new MessageActionRow().addComponents(tagsInput);

		const modal = new Modal()
			.setCustomId(`feed_setFollowedTags_${operation}`)
			.setTitle(title)
			.addComponents(row);

		return interaction.showModal(modal).catch(auditError);
	})
	.setButtonResponse(async function setFollowedTags(interaction, operation) {
		let content;
		if(operation === 'ADD')
			content = 'Se comenzaron a seguir las tags:';
		else
			content = 'Se dejaron de seguir las tags:';

		return interaction.reply({
			content: `**[DISFUNCIONAL: trabajo en proceso, esto es una vista previa]**\n${content} ${interaction.fields.getTextInputValue('tagsInput')}`,
			ephemeral: true,
		});
	})
	.setButtonResponse(async function deletePost(interaction, manageableBy) {
		if(manageableBy !== interaction.user.id && isNotModerator(interaction.member))
			return interaction.reply({
				content: ':x: No tienes permiso para hacer eso, teehee~',
				ephemeral: true,
			});
		
		const { message } = interaction;
		const url = message.components[0].components[0].url;
		const booru = new Booru(globalConfigs.booruCredentials);
		const post = await booru.fetchPostByUrl(url);
		let tags;
		if(post)
			tags = shortenText(post.tags.join(', '), 1600);
		return Promise.all([
			interaction.reply({
				content: `<:gelbooru:919398540172750878> **Eliminado** <${url}>\n<:tagswhite:921788204540100608> **Tags rescatadas** *Puedes revisarlas y blacklistear algunas con "-"*\n${tags}`,
				ephemeral: true,
			}),
			message.delete().catch(console.error),
		]);
	})
	.setButtonResponse(async function shock(interaction) {
		const { member, guild, channel } = interaction;
		if(isNotModerator(member))
			return interaction.reply({ content: ':x: No tienes permiso para hacer eso, teehee~', ephemeral: true });
		const gcfg = await GuildConfig.findOne({ guildId: guild.id });
		const booru = new Booru(globalConfigs.booruCredentials);
		gcfg.feeds[channel.id].ids = (await booru.search(gcfg.feeds[channel.id].tags, { limit: 32 })).map(r => r.id);
		gcfg.markModified('feeds');
		await gcfg.save();
		return interaction.reply({ content: 'Shock aplicado.', ephemeral: true });
	})

module.exports = command;