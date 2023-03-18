const { default: axios } = require('axios');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, ButtonBuilder, ButtonStyle, TextInputStyle, Colors, ChannelType } = require('discord.js');
const { isNotModerator, shortenText, guildEmoji, decompressId, compressId } = require('../../func.js');
const GuildConfig = require('../../localdata/models/guildconfigs.js');
const { auditError } = require('../../systems/auditor.js');
const { CommandMetaFlagsManager } = require('../Commons/cmdFlags.js');
const globalConfigs = require('../../localdata/config.json');
const { Booru } = require('../../systems/boorufetch.js');
const { CommandManager } = require('../Commons/cmdBuilder.js');
const { addGuildToFeedUpdateStack, feedTagSuscriptionsCache } = require('../../systems/boorufeed.js');
const UserConfigs = require('../../localdata/models/userconfigs.js');
const { Translator, fetchLocaleFor } = require('../../internationalization.js');

const wiztitle = 'Asistente de configuración de Feed de imágenes';
const cancelbutton = new ButtonBuilder()
	.setCustomId('feed_cancelWizard')
	.setLabel('Cancelar')
	.setStyle(ButtonStyle.Secondary);
const finishButton = new ButtonBuilder()
	.setCustomId('feed_finishWizard')
	.setLabel('Finalizar')
	.setStyle(ButtonStyle.Secondary);
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
	const embed = new EmbedBuilder()
		.setColor(Colors.Blurple)
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
		const wizard = new EmbedBuilder()
			.setColor(Colors.Aqua)
			.setAuthor({ name: wiztitle, iconURL: request.client.user.avatarURL() })
			.setFooter({ text: 'Comenzar' })
			.addFields({
				name: 'Bienvenido',
				value: 'Si es la primera vez que configuras un Feed de imágenes con Bot de Puré, ¡no te preocupes! Simplemente sigue las instrucciones del Asistente y adapta tu Feed a lo que quieras',
			});
		return request.reply({
			embeds: [wizard],
			components: [new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId('feed_startWizard')
					.setLabel('Comenzar')
					.setStyle(ButtonStyle.Primary),
				cancelbutton,
			)],
		});
	})
	.setButtonResponse(async function startWizard(interaction) {
		const wizard = new EmbedBuilder()
			.setColor(Colors.Navy)
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Seleccionar operación' })
			.addFields({ name: 'Selecciona una operación', value: '¿Qué deseas hacer ahora mismo?' });
			
		const guildQuery = { guildId: interaction.guild.id };
		const gcfg = (await GuildConfig.findOne(guildQuery)) || new GuildConfig(guildQuery);
		const premade = gcfg.feeds && Object.keys(gcfg.feeds).length;
		return interaction.update({
			embeds: [wizard],
			components: [
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('feed_createNew')
						.setLabel('Crear un nuevo Feed')
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId('feed_selectDelete')
						.setLabel('Eliminar un Feed')
						.setStyle(ButtonStyle.Danger)
						.setDisabled(!premade),
					finishButton,
				),
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('feed_selectEdit')
						.setLabel('Editar un Feed')
						.setStyle(ButtonStyle.Primary)
						.setDisabled(!premade),
					new ButtonBuilder()
						.setCustomId('feed_selectCustomize')
						.setLabel('Personalizar un Feed')
						.setStyle(ButtonStyle.Primary)
						.setDisabled(!premade),
					new ButtonBuilder()
						.setCustomId('feed_selectView')
						.setLabel('Ver un Feed')
						.setStyle(ButtonStyle.Primary)
						.setDisabled(!premade),
				),
			],
		});
	})
	.setButtonResponse(async function createNew(interaction) {
		const channelInput = new TextInputBuilder()
			.setCustomId('channelInput')
			.setLabel('Canal')
			.setPlaceholder(`Ej: #${interaction.channel.name} / ${interaction.channel.id}`)
			.setStyle(TextInputStyle.Short)
			.setRequired(true);
		const row = new ActionRowBuilder().addComponents(channelInput);
		const modal = new ModalBuilder()
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
		const textChannels = channels.filter(c => c.type === ChannelType.GuildText);
		const fetchedChannel = isNaN(input)
			? textChannels.find(c => c.name.toLowerCase().includes(input))
			: textChannels.get(input);
			
		if(!fetchedChannel)
			return interaction.reply({ content: '⚠ Canal inválido', ephemeral: true });

		const wizard = tagsSetupPrompt(interaction, fetchedChannel.id);
		return interaction.update({
			embeds: [wizard],
			components: [new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`feed_editTags_${fetchedChannel.id}`)
					.setLabel('Ingresar Tags')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('feed_startWizard')
					.setLabel('Volver')
					.setStyle(ButtonStyle.Secondary),
				cancelbutton,
			)],
		});
	})
	.setButtonResponse(async function editTags(interaction, channelId) {
		const tagsInput = new TextInputBuilder()
			.setCustomId('tagsInput')
			.setPlaceholder('rating:general touhou animated* -chibi')
			.setLabel('Tags')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true)
			.setMaxLength(4000);
		const row = new ActionRowBuilder().addComponents(tagsInput);
		const modal = new ModalBuilder()
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

		const concludedEmbed = new EmbedBuilder()
			.setColor(Colors.DarkVividPink)
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación finalizada' })
			.addFields(
				{ name: 'Feed configurado', value: `Se ha configurado un Feed con las tags _"${safeTags(input)}"_ para el canal **${fetchedChannel.name}**` },
				{ name: 'Control del Feed', value: 'Puedes modificar, personalizar o eliminar este Feed en cualquier momento siguiendo el Asistente de `p!feed` una vez más' },
			);
		return interaction.update({
			embeds: [concludedEmbed],
			components: [
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('feed_startWizard')
						.setLabel('Seguir configurando')
						.setStyle(ButtonStyle.Primary),
					finishButton,
				)
			],
		});
	})
	.setButtonResponse(async function selectEdit(interaction) {
		const wizard = new EmbedBuilder()
			.setColor(Colors.Greyple)
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Seleccionar Feed' })
			.addFields({ name: 'Selección de Feed', value: 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras modificar en esta lista y selecciónalo' });
		const feeds = await generateFeedOptions(interaction);
		if(!feeds.length) return interaction.reply({ content: '⚠ No hay Feeds para mostrar', ephemeral: true });
		return interaction.update({
			embeds: [wizard],
			components: [
				new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('feed_selectedEdit')
						.setPlaceholder('Selecciona un Feed')
						.addOptions(feeds),
				),
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('feed_startWizard')
						.setLabel('Volver')
						.setStyle(ButtonStyle.Secondary),
					cancelbutton,
				),
			],
		});
	})
	.setButtonResponse(async function selectCustomize(interaction) {
		const wizard = new EmbedBuilder()
			.setColor(Colors.Greyple)
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Seleccionar Feed' })
			.addFields({ name: 'Selección de Feed', value: 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras personalizar en esta lista y selecciónalo' });
		const feeds = await generateFeedOptions(interaction);
		if(!feeds.length) return interaction.reply({ content: '⚠ No hay Feeds para mostrar', ephemeral: true });
		return interaction.update({
			embeds: [wizard],
			components: [
				new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('feed_selectedCustomize')
						.setPlaceholder('Selecciona un Feed')
						.addOptions(feeds),
				),
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('feed_startWizard')
						.setLabel('Volver')
						.setStyle(ButtonStyle.Secondary),
					cancelbutton,
				),
			],
		});
	})
	.setButtonResponse(async function selectView(interaction) {
		const wizard = new EmbedBuilder()
			.setColor(Colors.Greyple)
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Seleccionar Feed' })
			.addFields({ name: 'Selección de Feed', value: 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras ver en esta lista y selecciónalo' });
		const feeds = await generateFeedOptions(interaction);
		if(!feeds.length) return interaction.reply({ content: '⚠ No hay Feeds para mostrar', ephemeral: true });
		return interaction.update({
			embeds: [wizard],
			components: [
				new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('feed_selectedView')
						.setPlaceholder('Selecciona un Feed')
						.addOptions(feeds),
				),
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('feed_startWizard')
						.setLabel('Volver')
						.setStyle(ButtonStyle.Secondary),
					cancelbutton,
				),
			],
		});
	})
	.setButtonResponse(async function selectDelete(interaction) {
		const wizard = new EmbedBuilder()
			.setColor(Colors.Greyple)
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Seleccionar Feed' })
			.addFields({ name: 'Selección de Feed', value: 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras eliminar en esta lista y selecciónalo' });
		const feeds = await generateFeedOptions(interaction);
		if(!feeds.length) return interaction.reply({ content: '⚠ No hay Feeds para mostrar', ephemeral: true });
		return interaction.update({
			embeds: [wizard],
			components: [
				new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('feed_selectedDelete')
						.setPlaceholder('Selecciona un Feed')
						.addOptions(feeds),
				),
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('feed_startWizard')
						.setLabel('Volver')
						.setStyle(ButtonStyle.Secondary),
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
			components: [new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`feed_editTags_${channelId}`)
					.setLabel('Ingresar Tags')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('feed_selectEdit')
					.setLabel('Volver')
					.setStyle(ButtonStyle.Secondary),
				finishButton,
			)],
		});
	})
	.setSelectMenuResponse(async function selectedCustomize(interaction) {
		const fetchedChannel = interaction.guild.channels.cache.get(interaction.values[0] || interaction.channel.id);
		const wizard = new EmbedBuilder()
			.setColor(Colors.Blurple)
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Seleccionar elemento a personalizar' })
			.addFields(
				{ name: 'Destino', value: `**${fetchedChannel.name}** (canal ${fetchedChannel.nsfw ? 'NSFW' : 'SFW'})` },
				{ name: 'Selecciona un elemento a personalizar', value: 'Usa el menú desplegable para decidir qué personalizar' },
			);
		
		return interaction.update({
			embeds: [wizard],
			components: [
				new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder()
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
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('feed_selectCustomize')
						.setLabel('Volver')
						.setStyle(ButtonStyle.Secondary),
					finishButton,
				),
			],
		});
	})
	.setSelectMenuResponse(async function selectedView(interaction) {
		const fetchedChannel = interaction.guild.channels.cache.get(interaction.values[0] || interaction.channel.id);
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		const feed = gcfg.feeds[fetchedChannel.id];
		const wizard = new EmbedBuilder()
			.setColor(Colors.Blurple)
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Visualizando tags' })
			.addFields(
				{ name: 'Destino', value: `**${fetchedChannel.name}** (canal ${fetchedChannel.nsfw ? 'NSFW' : 'SFW'})` },
				{ name: 'Tags del Feed', value: `\`\`\`${feed?.tags}\`\`\`` },
			);
		
		return interaction.update({
			embeds: [wizard],
			components: [
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('feed_selectView')
						.setLabel('Volver')
						.setStyle(ButtonStyle.Secondary),
					finishButton,
				),
			],
		});
	})
	.setSelectMenuResponse(async function selectedDelete(interaction) {
		const chid = interaction.values[0];
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		const tags = gcfg.feeds[chid].tags;
		const wizard = new EmbedBuilder()
			.setColor(Colors.Red)
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Confirmar' })
			.addFields({
				name: 'Confirmar eliminación de Feed',
				value: `Estás por borrar el Feed _"${safeTags(tags)}"_ ubicado en el canal **<#${chid}>**. ¿Estás seguro?`,
			});
		return interaction.update({
			embeds: [wizard],
			components: [new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`feed_deleteOne_${chid}`)
					.setLabel('Borrar')
					.setStyle(ButtonStyle.Danger),
				new ButtonBuilder()
					.setCustomId('feed_selectDelete')
					.setLabel('Volver')
					.setStyle(ButtonStyle.Secondary),
				cancelbutton,
			)],
		});
	})
	.setButtonResponse(async function deleteOne(interaction, channelId) {
		const wizard = new EmbedBuilder()
			.setColor(Colors.DarkRed)
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación finalizada' })
			.addFields({ name: 'Feed eliminado', value: 'Se ha eliminado el Feed acordado. Si te arrepientes, tendrás que crearlo otra vez' });
		const rows = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('feed_startWizard')
				.setLabel('Seguir configurando')
				.setStyle(ButtonStyle.Primary),
			finishButton,
		);
		
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		delete gcfg.feeds[channelId];
		gcfg.markModified('feeds');
		return Promise.all([
			gcfg.save(),
			interaction.update({
				embeds: [wizard],
				components: [rows],
			}),
		]);
	})
	.setSelectMenuResponse(async function selectItemCustomize(interaction, channelId) {
		const customizeTarget = interaction.values[0];
		const fetchedChannel = interaction.guild.channels.cache.get(channelId);
		console.log(channelId, fetchedChannel);
		
		const wizard = new EmbedBuilder()
			.setColor(Colors.Green)
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Personalizar elemento' })
			.addFields({ name: 'Destino', value: `**${fetchedChannel.name}** (canal ${fetchedChannel.nsfw ? 'NSFW' : 'SFW'})` });
		
		const row = new ActionRowBuilder();
		switch(customizeTarget) {
			case 'title':
				wizard.addFields({
					name: 'Personaliza el título',
					value: 'Clickea "Personalizar" e introduce el título que quieras que aparezca encima de cada imagen del Feed. Si quieres eliminar el título actual, usa el respectivo botón',
				});
				row.addComponents(
					new ButtonBuilder()
						.setCustomId(`feed_customizeTitle_${channelId}`)
						.setLabel('Personalizar')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId(`feed_removeCustomTitle_${channelId}`)
						.setLabel('Eliminar título')
						.setStyle(ButtonStyle.Danger),
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
					new ButtonBuilder()
						.setCustomId(`feed_customizeTags_${channelId}`)
						.setLabel('Personalizar')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId(`feed_removeCustomTags_${channelId}`)
						.setLabel('Restaurar cantidad por defecto')
						.setStyle(ButtonStyle.Danger),
				);
				break;

			case 'footer':
				wizard.addFields({
					name: 'Personaliza el pie',
					value: 'Clickea "Personalizar" e introduce un texto breve. Si quieres eliminar el pie actual, usa el respectivo botón',
				});
				row.addComponents(
					new ButtonBuilder()
						.setCustomId(`feed_customizeFooter_${channelId}`)
						.setLabel('Personalizar')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId(`feed_removeCustomFooter_${channelId}`)
						.setLabel('Eliminar pie')
						.setStyle(ButtonStyle.Danger),
				);
				break;

			case 'cornerIcon':
				wizard.addFields({
					name: 'Personaliza el ícono de esquina',
					value: 'Clickea "Personalizar" e introduce un enlace a una imagen. Si quieres eliminar la imagen actual, usa el respectivo botón',
				});
				row.addComponents(
					new ButtonBuilder()
						.setCustomId(`feed_customizeIcon_${channelId}`)
						.setLabel('Personalizar')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId(`feed_removeCustomIcon_${channelId}`)
						.setLabel('Restaurar ícono por defecto')
						.setStyle(ButtonStyle.Danger),
				);
				break;
		}
		row.addComponents(
			new ButtonBuilder()
				.setCustomId('feed_selectCustomize')
				.setLabel('Volver')
				.setStyle(ButtonStyle.Secondary),
			cancelbutton,
		);
		return interaction.update({
			embeds: [wizard],
			components: [row],
		});
	})
	.setButtonResponse(async function customizeTitle(interaction, channelId) {
		const titleInput = new TextInputBuilder()
			.setCustomId('titleInput')
			.setLabel('Título')
			.setPlaceholder('Ej: GIFs PixelArt')
			.setStyle(TextInputStyle.Short)
			.setRequired(true)
			.setMaxLength(255);
		const row = new ActionRowBuilder().addComponents(titleInput);
		const modal = new ModalBuilder()
			.setCustomId(`feed_setCustomTitle_${channelId}`)
			.setTitle('Personalización de Feed')
			.addComponents(row);

		interaction.showModal(modal);
	})
	.setButtonResponse(async function customizeTags(interaction, channelId) {
		const tagsInput = new TextInputBuilder()
			.setCustomId('tagsInput')
			.setLabel('Cantidad de tags a mostrar')
			.setPlaceholder('Introduce 0 para no mostrar tags')
			.setStyle(TextInputStyle.Short)
			.setRequired(true)
			.setMinLength(1)
			.setMaxLength(2);
		const row = new ActionRowBuilder().addComponents(tagsInput);
		const modal = new ModalBuilder()
			.setCustomId(`feed_setCustomMaxTags_${channelId}`)
			.setTitle('Personalización de Feed')
			.addComponents(row);

		interaction.showModal(modal);
	})
	.setButtonResponse(async function customizeFooter(interaction, channelId) {
		const footerInput = new TextInputBuilder()
			.setCustomId('footerInput')
			.setLabel('Pie de imagen')
			.setPlaceholder('Ej: ¡Es una imagen muy bonita~!')
			.setStyle(TextInputStyle.Short)
			.setRequired(true)
			.setMaxLength(255);
		const row = new ActionRowBuilder().addComponents(footerInput);
		const modal = new ModalBuilder()
			.setCustomId(`feed_setCustomFooter_${channelId}`)
			.setTitle('Personalización de Feed')
			.addComponents(row);

		interaction.showModal(modal);
	})
	.setButtonResponse(async function customizeIcon(interaction, channelId) {
		const iconInput = new TextInputBuilder()
			.setCustomId('iconInput')
			.setLabel('Enlace de ícono de esquina')
			.setPlaceholder('Ejemplo:\nhttps://cdn.discordapp.com/attachments/956023682734624838/1001416736261799937/doremy.png')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true)
			.setMaxLength(255);
		const row = new ActionRowBuilder().addComponents(iconInput);
		const modal = new ModalBuilder()
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
		const testEmbed = new EmbedBuilder()
			.setColor(Colors.White)
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
			auditError(error, { brief: 'Ha ocurrido un error al procesar Feed' });
			return interaction.editReply({ content: '⚠ Enlace inválido. Asegúrate de proveer un enlace completo y directo a la imagen' })
		}
	})
	.setButtonResponse(async function removeCustomTitle(interaction, channelId) {
		const fetchedChannel = interaction.guild.channels.cache.get(channelId);
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		delete gcfg.feeds[channelId].title;
		gcfg.markModified('feeds');
		await gcfg.save();

		const concludedEmbed = new EmbedBuilder()
			.setColor(Colors.DarkGreen)
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación finalizada' })
			.addFields({
				name: 'Feed personalizado',
				value: `Se ha eliminado el título personalizado del Feed con las tags _"${safeTags(gcfg.feeds[channelId].tags)}"_ para el canal **${fetchedChannel.name}**`,
			});
		return interaction.update({
			embeds: [concludedEmbed],
			components: [new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId('feed_selectCustomize')
					.setLabel('Seguir personalizando')
					.setStyle(ButtonStyle.Primary),
			)],
		});
	})
	.setButtonResponse(async function removeCustomTags(interaction, channelId) {
		const fetchedChannel = interaction.guild.channels.cache.get(channelId);
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		delete gcfg.feeds[channelId].tags;
		gcfg.markModified('feeds');
		await gcfg.save();

		const concludedEmbed = new EmbedBuilder()
			.setColor(Colors.DarkGreen)
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación finalizada' })
			.addFields({
				name: 'Feed personalizado',
				value: `Se ha restaurado la cantidad de tags máxima por defecto del Feed con las tags _"${safeTags(gcfg.feeds[channelId].tags)}"_ para el canal **${fetchedChannel.name}**`,
			});
		return interaction.update({
			embeds: [concludedEmbed],
			components: [new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId('feed_selectCustomize')
					.setLabel('Seguir personalizando')
					.setStyle(ButtonStyle.Primary),
			)],
		});
	})
	.setButtonResponse(async function removeCustomFooter(interaction, channelId) {
		const fetchedChannel = interaction.guild.channels.cache.get(channelId);
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		delete gcfg.feeds[fetchedChannel.id].footer;
		gcfg.markModified('feeds');
		await gcfg.save();

		const concludedEmbed = new EmbedBuilder()
			.setColor(Colors.DarkGreen)
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación finalizada' })
			.addFields({
				name: 'Feed personalizado',
				value: `Se ha eliminado el texto de pie personalizado del Feed con las tags _"${safeTags(gcfg.feeds[fetchedChannel.id].tags)}"_ para el canal **${fetchedChannel.name}**`,
			});
		return interaction.update({
			embeds: [concludedEmbed],
			components: [new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId('feed_selectCustomize')
					.setLabel('Seguir personalizando')
					.setStyle(ButtonStyle.Primary),
			)],
		});
	})
	.setButtonResponse(async function removeCustomIcon(interaction, channelId) {
		const fetchedChannel = interaction.guild.channels.cache.get(channelId);
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		delete gcfg.feeds[fetchedChannel.id].cornerIcon;
		gcfg.markModified('feeds');
		await gcfg.save();

		const concludedEmbed = new EmbedBuilder()
			.setColor(Colors.DarkGreen)
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación finalizada' })
			.addFields({
				name: 'Feed personalizado',
				value: `Se ha eliminado el ícono de esquina personalizado del Feed con las tags _"${safeTags(gcfg.feeds[fetchedChannel.id].tags)}"_ para el canal **${fetchedChannel.name}**`,
			});
		return interaction.update({
			embeds: [concludedEmbed],
			components: [new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId('feed_selectCustomize')
					.setLabel('Seguir personalizando')
					.setStyle(ButtonStyle.Primary),
			)],
		});
	})
	.setButtonResponse(async function cancelWizard(interaction) {
		const cancelEmbed = new EmbedBuilder()
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación abortada' })
			.addFields({ name: 'Asistente cancelado', value: 'Se canceló la configuración de Feed' });
		return interaction.update({
			embeds: [cancelEmbed],
			components: [],
		});
	})
	.setButtonResponse(async function finishWizard(interaction) {
		const cancelEmbed = new EmbedBuilder()
			.setAuthor({ name: wiztitle, iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación concluída' })
			.setDescription('Se finalizó la configuración de Feeds');
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
		const locale = await fetchLocaleFor(interaction.user.id);
        const translator = new Translator(locale);

		const url = interaction.message.components[0].components[0].url;
		const booru = new Booru(globalConfigs.booruCredentials);
		try {
			const post = await booru.fetchPostByUrl(url);
			const tags = shortenText(post.tags.join(', '), 1010);
			const source = post.source;
			return interaction.reply({
				// content: `<:tagswhite:921788204540100608> **Tags**\n${tags}\n<:gelbooru:919398540172750878> **Post** <${url}>${ source ? `\n<:urlwhite:922669195521568818> **Fuente** <${source}>` : '' }`,
				embeds: [
					new EmbedBuilder()
						.addFields(
							{ name: '<:tagswhite:921788204540100608> Tags', value: `\`\`\`${tags}\`\`\`` },
							{
								name: '<:urlwhite:922669195521568818> Enlaces',
								value: `[<:gelbooru:919398540172750878> **Post**](${url})${ source ? ` [<:heartwhite:969664712604262400> **Fuente**](${source})` : '' }`,
							},
						),
				],
				components: [new ActionRowBuilder().addComponents([
					new ButtonBuilder()
						.setCustomId(`yo_modifyFollowedTags_${compressId(interaction.user.id)}_ALT`)
						.setLabel(translator.getText('feedSetTagsButtonView'))
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('feed_editFollowedTags_ADD')
						.setLabel(translator.getText('feedSetTagsButtonAdd'))
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId('feed_editFollowedTags_REMOVE')
						.setLabel(translator.getText('feedSetTagsButtonRemove'))
						.setStyle(ButtonStyle.Danger),
				])],
				ephemeral: true,
			});
		} catch(error) {
			auditError(error, { brief: 'Ha ocurrido un error al procesar Feed' });
			return interaction.reply({
				content: 'Ocurrió un problema al contactar con el Booru para recuperar las tags.\nInténtalo de nuevo, si el problema persiste, es probable que el objetivo no esté disponible o que se trate de un bug de mi parte',
				ephemeral: true,
			});
		}
	})
	.setButtonResponse(async function editFollowedTags(interaction, operation) {
		const locale = await fetchLocaleFor(interaction.user.id);
        const translator = new Translator(locale);

		const tagsInput = new TextInputBuilder()
			.setCustomId('tagsInput')
			.setMinLength(1)
			.setMaxLength(160)
			.setPlaceholder('touhou animated 1girl')
			.setStyle(TextInputStyle.Paragraph);
		let title;

		if(operation === 'ADD') {
			tagsInput.setLabel(translator.getText('feedEditTagsInputAdd'));
			title = translator.getText('feedEditTagsTitleAdd');
		} else {
			tagsInput.setLabel(translator.getText('feedEditTagsInputRemove'));
			title = translator.getText('feedEditTagsTitleRemove');
		}

		const row = new ActionRowBuilder().addComponents(tagsInput);

		const modal = new ModalBuilder()
			.setCustomId(`yo_setFollowedTags_${operation}`)
			.setTitle(title)
			.addComponents(row);

		return interaction.showModal(modal).catch(auditError);
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