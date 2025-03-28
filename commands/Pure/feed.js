const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, ButtonBuilder, ButtonStyle, TextInputStyle, Colors, ChannelType, ButtonComponent } = require('discord.js');
const { isNotModerator, shortenText, guildEmoji, decompressId, compressId, isNSFWChannel, randInArray } = require('../../func.js');
const GuildConfig = require('../../localdata/models/guildconfigs.js');
const { auditError, auditAction } = require('../../systems/others/auditor.js');
const { CommandTags } = require('../Commons/cmdTags.js');
const globalConfigs = require('../../localdata/config.json');
const { Booru, TagTypes, BooruUnknownPostError } = require('../../systems/booru/boorufetch.js');
const { CommandManager } = require('../Commons/cmdBuilder.js');
const { addGuildToFeedUpdateStack } = require('../../systems/booru/boorufeed.js');
const { formatBooruPostMessage } = require('../../systems/booru/boorusend.js');
const { Translator } = require('../../internationalization.js');
const { CommandPermissions } = require('../Commons/cmdPerms.js');
const { makeButtonRowBuilder, makeStringSelectMenuRowBuilder, makeTextInputRowBuilder } = require('../../tsCasts.js');

/**@param {Translator} translator*/
const wizTitle = (translator) => translator.getText('feedAuthor');

/**@param {String} compressedAuthorId*/
const cancelbutton = (compressedAuthorId) => new ButtonBuilder()
	.setCustomId(`feed_cancelWizard_${compressedAuthorId}`)
	.setEmoji('1355143793577426962')
	.setStyle(ButtonStyle.Secondary);

/**
 * @param {Translator} translator
 * @param {String} compressedAuthorId
 */
const finishButton = (translator, compressedAuthorId) => new ButtonBuilder()
	.setCustomId(`feed_finishWizard_${compressedAuthorId}`)
	.setLabel(translator.getText('buttonFinish'))
	.setStyle(ButtonStyle.Secondary);

const safeTags = (_tags = '') => _tags.replace(/\\*\*/g,'\\*').replace(/\\*_/g,'\\_');

/**
 * @param {import('discord.js').ButtonInteraction} interaction 
 * @returns {Promise<Array<import('discord.js').SelectMenuComponentOptionData>>}
 */
const generateFeedOptions = async (interaction) => {
	const gcfg = /**@type {import('../../localdata/models/guildconfigs.js').GuildConfigDocument}*/(await GuildConfig.findOne({ guildId: interaction.guild.id }));
	const feedOptions = Object.entries(gcfg.feeds).map(([chid, feed]) => {
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
	return feedOptions;
}

/**
 * @param {import('discord.js').Message | import('discord.js').ButtonInteraction | import('discord.js').StringSelectMenuInteraction | import('discord.js').ModalSubmitInteraction} interaction
 * @param {String} channelId
 * @param {Translator} translator
 */
function tagsSetupPrompt(interaction, channelId, translator) {
	const fetchedChannel = /**@type {import('discord.js').BaseGuildTextChannel}*/(interaction.guild.channels.cache.get(channelId));
	const gelEmoji = guildEmoji('gelbooru', globalConfigs.slots.slot3);
	const embed = new EmbedBuilder()
		.setColor(Colors.Blurple)
		.setAuthor({ name: wizTitle(translator), iconURL: interaction.client.user.avatarURL() })
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

const perms = new CommandPermissions()
	.requireAnyOf([ 'ManageGuild', 'ManageChannels' ])
	.requireAnyOf('ManageMessages');

const flags = new CommandTags().add('COMMON', 'MOD');

const command = new CommandManager('feed', flags)
	.setBriefDescription('Inicializa un Feed en un canal por medio de un Asistente.')
	.setLongDescription('Inicializa un Feed de imágenes en un canal. Simplemente usa el comando y sigue los pasos del Asistente para configurar y personalizar todo')
	.setPermissions(perms)
	.setExecution(async request => {
		const translator = await Translator.from(request.userId);
		const wizard = new EmbedBuilder()
			.setColor(Colors.Aqua)
			.setAuthor({ name: wizTitle(translator), iconURL: request.client.user.avatarURL() })
			.setFooter({ text: 'Comenzar' })
			.addFields({
				name: 'Bienvenido',
				value: 'Si es la primera vez que configuras un Feed de imágenes con Bot de Puré, ¡no te preocupes! Simplemente sigue las instrucciones del Asistente y adapta tu Feed a lo que quieras',
			});

		const authorId = compressId(request.userId);
		return request.reply({
			embeds: [wizard],
			components: [new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId('feed_startWizard')
					.setLabel('Comenzar')
					.setStyle(ButtonStyle.Primary),
				cancelbutton(authorId),
			)],
		});
	})
	.setButtonResponse(async function startWizard(interaction) {
		const guildQuery = { guildId: interaction.guild.id };
		const promises = await Promise.all([
			GuildConfig.findOne(guildQuery),
			Translator.from(interaction.user.id),
		]);
		const gcfg = promises[0] || new GuildConfig(guildQuery);
		const translator = promises[1];
		const premade = gcfg.feeds && Object.keys(gcfg.feeds).length;

		const authorId = compressId(interaction.user.id);
		const wizard = new EmbedBuilder()
			.setColor(Colors.Navy)
			.setAuthor({ name: wizTitle(translator), iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Seleccionar operación' })
			.addFields({ name: 'Selecciona una operación', value: '¿Qué deseas hacer ahora mismo?' });
		
		return interaction.update({
			embeds: [wizard],
			components: [
				makeButtonRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(`feed_createNew_${authorId}`)
						.setEmoji('1291900911643263008')
						.setLabel(translator.getText('buttonCreate'))
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId(`feed_selectDelete_${authorId}`)
						.setEmoji('1355143793577426962')
						.setLabel(translator.getText('buttonDelete'))
						.setStyle(ButtonStyle.Danger)
						.setDisabled(!premade),
					finishButton(translator, authorId),
				),
				makeButtonRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(`feed_selectEdit_${authorId}`)
						.setEmoji('921788204540100608')
						.setLabel(translator.getText('buttonEdit'))
						.setStyle(ButtonStyle.Primary)
						.setDisabled(!premade),
					new ButtonBuilder()
						.setCustomId(`feed_selectCustomize_${authorId}`)
						.setEmoji('1288444896331698241')
						.setLabel(translator.getText('buttonCustomize'))
						.setStyle(ButtonStyle.Primary)
						.setDisabled(!premade),
					new ButtonBuilder()
						.setCustomId(`feed_selectView_${authorId}`)
						.setEmoji('1087075525245272104')
						.setLabel(translator.getText('buttonView'))
						.setStyle(ButtonStyle.Primary)
						.setDisabled(!premade),
				),
			],
		});
	})
	.setButtonResponse(async function createNew(interaction, authorId) {
		const channelInput = new TextInputBuilder()
			.setCustomId('channelInput')
			.setLabel('Canal')
			.setPlaceholder(`Ej: #${interaction.channel.name} / ${interaction.channel.id}`)
			.setStyle(TextInputStyle.Short)
			.setRequired(true);
		const row = makeTextInputRowBuilder().addComponents(channelInput);
		const modal = new ModalBuilder()
			.setCustomId(`feed_createOnChannel_${authorId}`)
			.setTitle('Creación de Feed')
			.addComponents(row);
		return interaction.showModal(modal);
	}, { userFilterIndex: 0 })
	.setModalResponse(async function createOnChannel(interaction, authorId) {
		const translator = await Translator.from(interaction.user.id);
		let input = interaction.fields.getTextInputValue('channelInput');
		if(input.startsWith('<') && input.endsWith('>'))
			input = input.slice(1, -1);
		if(input.startsWith('#'))
			input = input.slice(1);
		if(input.startsWith('!'))
			input = input.slice(1);
			
		const channels = interaction.guild.channels.cache;
		const textChannels = channels.filter(c => [ ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread ].includes(c.type));
		const fetchedChannel = isNaN(+input)
			? textChannels.find(c => c.name.toLowerCase().includes(input))
			: textChannels.get(input);
			
		if(!fetchedChannel)
			return interaction.reply({ content: '⚠️ Canal inválido', ephemeral: true });

		const guildQuery = { guildId: interaction.guild.id };
		const gcfg = (await GuildConfig.findOne(guildQuery)) || new GuildConfig(guildQuery);

		if(gcfg?.feeds && gcfg.feeds.hasOwnProperty(fetchedChannel.id))
			return interaction.reply({ content: '⚠️ Ya existe un Feed en el canal solicitado. Prueba editarlo o crear un Feed en otro canal', ephemeral: true });

		const wizard = tagsSetupPrompt(interaction, fetchedChannel.id, translator);
		return interaction.update({
			embeds: [wizard],
			components: [makeButtonRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`feed_editTags_${fetchedChannel.id}_${authorId}`)
					.setLabel('Ingresar Tags')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId(`feed_startWizard_${authorId}`)
					.setEmoji('1355128236790644868')
					.setStyle(ButtonStyle.Secondary),
				cancelbutton(authorId),
			)],
		});
	}, { userFilterIndex: 0 })
	.setButtonResponse(async function editTags(interaction, channelId, authorId) {
		const tagsInput = new TextInputBuilder()
			.setCustomId('tagsInput')
			.setPlaceholder('rating:general touhou animated* -chibi')
			.setLabel('Tags')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true)
			.setMaxLength(4000);
		const row = makeTextInputRowBuilder().addComponents(tagsInput);
		const modal = new ModalBuilder()
			.setCustomId(`feed_setTags_${channelId}_${authorId}`)
			.setTitle('Personalización de Feed')
			.addComponents(row);
		return interaction.showModal(modal);
	}, { userFilterIndex: 1 })
	.setModalResponse(async function setTags(interaction, channelId, authorId) {
		const translator = await Translator.from(interaction.user.id);
		const fetchedChannel = interaction.guild.channels.cache.get(channelId);
		const input = interaction.fields.getTextInputValue('tagsInput').toLowerCase().trim();

		const guildQuery = { guildId: interaction.guild.id };
		const gcfg = /**@type {import('../../localdata/models/guildconfigs').GuildConfigDocument}*/((await GuildConfig.findOne(guildQuery)) || new GuildConfig(guildQuery));
		gcfg.feeds ??= {};
		gcfg.feeds[fetchedChannel.id] ??= { tags: null };
		gcfg.feeds[fetchedChannel.id].tags = input;
		gcfg.feeds[fetchedChannel.id].lastFetchedAt = new Date(Date.now());
        const firstUpdateDelay = addGuildToFeedUpdateStack(interaction.guild);
		gcfg.markModified('feeds');
		await gcfg.save();

		const concludedEmbed = new EmbedBuilder()
			.setColor(Colors.DarkVividPink)
			.setAuthor({ name: wizTitle(translator), iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación finalizada' })
			.addFields(
				{ name: 'Feed configurado', value: `Se ha configurado un Feed con las tags _"${safeTags(input)}"_ para el canal **${fetchedChannel.name}**` },
				{ name: 'Control del Feed', value: 'Puedes modificar, personalizar o eliminar este Feed en cualquier momento siguiendo el Asistente una vez más' },
				{ name: 'Actualización Programada', value: `Este Feed se actualizará por primera vez <t:${Math.round((Date.now() + firstUpdateDelay) / 1000)}:R>` },
			);
		return interaction.update({
			embeds: [concludedEmbed],
			components: [
				makeButtonRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(`feed_startWizard_${authorId}`)
						.setLabel('Seguir configurando')
						.setStyle(ButtonStyle.Primary),
					finishButton(translator, authorId),
				)
			],
		});
	}, { userFilterIndex: 1 })
	.setButtonResponse(async function selectEdit(interaction, authorId) {
		const translator = await Translator.from(interaction.user.id);
		const wizard = new EmbedBuilder()
			.setColor(Colors.Greyple)
			.setAuthor({ name: wizTitle(translator), iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Seleccionar Feed' })
			.addFields({ name: 'Selección de Feed', value: 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras modificar en esta lista y selecciónalo' });
		const feeds = await generateFeedOptions(interaction);
		if(!feeds.length) return interaction.reply({ content: '⚠️ No hay Feeds para mostrar', ephemeral: true });
		return interaction.update({
			embeds: [wizard],
			components: [
				makeStringSelectMenuRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId(`feed_selectedEdit_${authorId}`)
						.setPlaceholder('Selecciona un Feed')
						.addOptions(feeds),
				),
				makeButtonRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(`feed_startWizard_${authorId}`)
						.setEmoji('1355128236790644868')
						.setStyle(ButtonStyle.Secondary),
					cancelbutton(authorId),
				),
			],
		});
	}, { userFilterIndex: 0 })
	.setButtonResponse(async function selectCustomize(interaction, authorId) {
		const translator = await Translator.from(interaction.user.id);
		const wizard = new EmbedBuilder()
			.setColor(Colors.Greyple)
			.setAuthor({ name: wizTitle(translator), iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Seleccionar Feed' })
			.addFields({ name: 'Selección de Feed', value: 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras personalizar en esta lista y selecciónalo' });
		const feeds = await generateFeedOptions(interaction);
		if(!feeds.length) return interaction.reply({ content: '⚠️ No hay Feeds para mostrar', ephemeral: true });
		return interaction.update({
			embeds: [wizard],
			components: [
				makeStringSelectMenuRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId(`feed_selectedCustomize_${authorId}`)
						.setPlaceholder('Selecciona un Feed')
						.addOptions(feeds),
				),
				makeButtonRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(`feed_startWizard_${authorId}`)
						.setEmoji('1355128236790644868')
						.setStyle(ButtonStyle.Secondary),
					cancelbutton(authorId),
				),
			],
		});
	}, { userFilterIndex: 0 })
	.setButtonResponse(async function selectView(interaction, authorId) {
		const translator = await Translator.from(interaction.user.id);
		const wizard = new EmbedBuilder()
			.setColor(Colors.Greyple)
			.setAuthor({ name: wizTitle(translator), iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Seleccionar Feed' })
			.addFields({ name: 'Selección de Feed', value: 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras ver en esta lista y selecciónalo' });
		const feeds = await generateFeedOptions(interaction);
		if(!feeds.length) return interaction.reply({ content: '⚠️ No hay Feeds para mostrar', ephemeral: true });
		return interaction.update({
			embeds: [wizard],
			components: [
				makeStringSelectMenuRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId(`feed_selectedView_${authorId}`)
						.setPlaceholder('Selecciona un Feed')
						.addOptions(feeds),
				),
				makeButtonRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(`feed_startWizard_${authorId}`)
						.setEmoji('1355128236790644868')
						.setStyle(ButtonStyle.Secondary),
					cancelbutton(authorId),
				),
			],
		});
	}, { userFilterIndex: 0 })
	.setButtonResponse(async function selectDelete(interaction, authorId) {
		const translator = await Translator.from(interaction.user.id);
		const wizard = new EmbedBuilder()
			.setColor(Colors.Greyple)
			.setAuthor({ name: wizTitle(translator), iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Seleccionar Feed' })
			.addFields({ name: 'Selección de Feed', value: 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras eliminar en esta lista y selecciónalo' });
		const feeds = await generateFeedOptions(interaction);
		if(!feeds.length) return interaction.reply({ content: '⚠️ No hay Feeds para mostrar', ephemeral: true });
		return interaction.update({
			embeds: [wizard],
			components: [
				makeStringSelectMenuRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId(`feed_selectedDelete_${authorId}`)
						.setPlaceholder('Selecciona un Feed')
						.addOptions(feeds),
				),
				makeButtonRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(`feed_startWizard_${authorId}`)
						.setEmoji('1355128236790644868')
						.setStyle(ButtonStyle.Secondary),
					cancelbutton(authorId),
				),
			],
		});
	}, { userFilterIndex: 0 })
	.setSelectMenuResponse(async function selectedEdit(interaction, authorId) {
		const translator = await Translator.from(interaction.user.id);
		const channelId = interaction.values[0];
		const wizard = tagsSetupPrompt(interaction, channelId, translator);
		return interaction.update({
			embeds: [wizard],
			components: [makeButtonRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`feed_editTags_${channelId}_${authorId}`)
					.setLabel('Ingresar Tags')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId(`feed_selectEdit_${authorId}`)
					.setEmoji('1355128236790644868')
					.setStyle(ButtonStyle.Secondary),
				finishButton(translator, authorId),
			)],
		});
	}, { userFilterIndex: 0 })
	.setSelectMenuResponse(async function selectedCustomize(interaction, authorId) {
		const translator = await Translator.from(interaction.user.id);
		const fetchedChannel = /**@type {import('discord.js').BaseGuildTextChannel}*/(interaction.guild.channels.cache.get(interaction.values[0] || interaction.channel.id));
		const wizard = new EmbedBuilder()
			.setColor(Colors.Blurple)
			.setAuthor({ name: wizTitle(translator), iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Seleccionar elemento a personalizar' })
			.addFields(
				{ name: 'Destino', value: `**${fetchedChannel.name}** (canal ${fetchedChannel.nsfw ? 'NSFW' : 'SFW'})` },
				{ name: 'Selecciona un elemento a personalizar', value: 'Usa el menú desplegable para decidir qué personalizar' },
			);
		
		return interaction.update({
			embeds: [wizard],
			components: [
				makeStringSelectMenuRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId(`feed_selectItemCustomize_${fetchedChannel.id}_${authorId}`)
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
								label: 'Antetítulo',
								description: 'Asigna o elimina un antetítulo a mostrar en cada imagen',
								value: 'subtitle',
							},
							{
								label: 'Ícono de esquina',
								description: 'Elige un ícono de esquina personalizado para cada imagen',
								value: 'cornerIcon',
							},
							{
								label: 'Pie',
								description: 'Asigna o elimina un texto a mostrar debajo de cada imagen',
								value: 'footer',
							},
						]),
				),
				makeButtonRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(`feed_selectCustomize_${authorId}`)
						.setEmoji('1355128236790644868')
						.setStyle(ButtonStyle.Secondary),
					finishButton(translator, authorId),
				),
			],
		});
	}, { userFilterIndex: 0 })
	.setSelectMenuResponse(async function selectedView(interaction, authorId) {
		const [ translator ] = await Promise.all([
			Translator.from(interaction.user.id),
			interaction.deferReply({ ephemeral: true }),
		]);

		const feedChannel = interaction.guild.channels.cache.get(interaction.values[0] || interaction.channelId);
		if(!feedChannel) return interaction.editReply({ content: translator.getText('invalidChannel') });

		const allowNSFW = isNSFWChannel(feedChannel);

		const gcfg = await GuildConfig.findOne({ guildId: interaction.guildId });
		if(!gcfg) return interaction.editReply({ content: translator.getText('invalidChannel') });

		const feed = gcfg.feeds[feedChannel.id];
		if(!feed) return interaction.editReply({ content: translator.getText('invalidChannel') });
		
		const wizard = new EmbedBuilder()
			.setColor(Colors.Blurple)
			.setAuthor({ name: wizTitle(translator), iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Visualizando Feed' })
			.addFields(
				{ name: 'Destino', value: `**${feedChannel.name}** (canal ${allowNSFW ? 'NSFW' : 'SFW'})` },
				{ name: 'Tags del Feed', value: `\`\`\`${feed?.tags}\`\`\`` },
			);
		
		await interaction.message.edit({
			embeds: [wizard],
			components: [makeButtonRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`feed_selectView_${authorId}`)
					.setEmoji('1355128236790644868')
					.setStyle(ButtonStyle.Secondary),
				finishButton(translator, authorId),
			)],
		}).catch(console.error);

		const booru = new Booru(globalConfigs.booruCredentials);
		const post = randInArray(await booru.search(feed.tags, { limit: 42 }));
		if(!post) return interaction.editReply({ content: 'Las tags del feed no dieron ningún resultado' });

		const preview = await formatBooruPostMessage(booru, post, { ...feed, allowNSFW });
		preview.components.forEach(row => row.components.forEach(button => button.data.style !== ButtonStyle.Link && button.setDisabled(true)));
		return interaction.editReply({ ...preview, content: '-# Esto es una vista previa. Las imágenes NSFW solo pueden previsualizarse en canales NSFW' });
	}, { userFilterIndex: 0 })
	.setSelectMenuResponse(async function selectedDelete(interaction, authorId) {
		const translator = await Translator.from(interaction.user.id);
		const chid = interaction.values[0];
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		const tags = gcfg.feeds[chid].tags;
		const wizard = new EmbedBuilder()
			.setColor(Colors.Red)
			.setAuthor({ name: wizTitle(translator), iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Confirmar' })
			.addFields({
				name: 'Confirmar eliminación de Feed',
				value: `Estás por borrar el Feed _"${safeTags(tags)}"_ ubicado en el canal **<#${chid}>**. ¿Estás seguro?`,
			});
		return interaction.update({
			embeds: [wizard],
			components: [makeButtonRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`feed_deleteOne_${chid}_${authorId}`)
					.setLabel('Borrar')
					.setStyle(ButtonStyle.Danger),
				new ButtonBuilder()
					.setCustomId(`feed_selectDelete_${authorId}`)
					.setEmoji('1355128236790644868')
					.setStyle(ButtonStyle.Secondary),
				cancelbutton(authorId),
			)],
		});
	}, { userFilterIndex: 0 })
	.setButtonResponse(async function deleteOne(interaction, channelId, authorId) {
		const translator = await Translator.from(interaction.user.id);
		const wizard = new EmbedBuilder()
			.setColor(Colors.DarkRed)
			.setAuthor({ name: wizTitle(translator), iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación finalizada' })
			.addFields({ name: 'Feed eliminado', value: 'Se ha eliminado el Feed acordado. Si te arrepientes, tendrás que crearlo otra vez' });
		const rows = makeButtonRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId(`feed_startWizard_${authorId}`)
				.setLabel('Seguir configurando')
				.setStyle(ButtonStyle.Primary),
			finishButton(translator, authorId),
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
	}, { userFilterIndex: 1 })
	.setSelectMenuResponse(async function selectItemCustomize(interaction, channelId, authorId) {
		const translator = await Translator.from(interaction.user.id);
		const customizeTarget = interaction.values[0];
		const fetchedChannel = /**@type {import('discord.js').BaseGuildTextChannel}*/(interaction.guild.channels.cache.get(channelId));
		console.log(channelId, fetchedChannel);
		
		const wizard = new EmbedBuilder()
			.setColor(Colors.Green)
			.setAuthor({ name: wizTitle(translator), iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Personalizar elemento' })
			.addFields({ name: 'Destino', value: `**${fetchedChannel.name}** (canal ${fetchedChannel.nsfw ? 'NSFW' : 'SFW'})` });
		
		const row = makeButtonRowBuilder();
		switch(customizeTarget) {
			case 'title':
				wizard.addFields({
					name: 'Personaliza el título',
					value: 'Clickea "Personalizar" e introduce el título que quieras que aparezca encima de cada imagen del Feed. Si quieres eliminar el título actual, usa el respectivo botón',
				});
				row.addComponents(
					new ButtonBuilder()
						.setCustomId(`feed_customizeTitle_${channelId}_${authorId}`)
						.setLabel('Personalizar')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId(`feed_removeCustomTitle_${channelId}_${authorId}`)
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
						.setCustomId(`feed_customizeTags_${channelId}_${authorId}`)
						.setLabel('Personalizar')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId(`feed_removeCustomTags_${channelId}_${authorId}`)
						.setLabel('Restaurar cantidad por defecto')
						.setStyle(ButtonStyle.Danger),
				);
				break;

			case 'subtitle':
				wizard.addFields({
					name: 'Personaliza el antetítulo',
					value: 'Clickea "Personalizar" e introduce un texto breve. Si quieres eliminar el antetítulo actual, usa el respectivo botón',
				});
				row.addComponents(
					new ButtonBuilder()
						.setCustomId(`feed_customizeSubtitle_${channelId}_${authorId}`)
						.setLabel('Personalizar')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId(`feed_removeCustomSubtitle_${channelId}_${authorId}`)
						.setLabel('Eliminar antetítulo')
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
						.setCustomId(`feed_customizeIcon_${channelId}_${authorId}`)
						.setLabel('Personalizar')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId(`feed_removeCustomIcon_${channelId}_${authorId}`)
						.setLabel('Restaurar ícono por defecto')
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
						.setCustomId(`feed_customizeFooter_${channelId}_${authorId}`)
						.setLabel('Personalizar')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId(`feed_removeCustomFooter_${channelId}_${authorId}`)
						.setLabel('Eliminar pie')
						.setStyle(ButtonStyle.Danger),
				);
				break;
		}
		row.addComponents(
			new ButtonBuilder()
				.setCustomId(`feed_selectCustomize_${authorId}`)
				.setEmoji('1355128236790644868')
				.setStyle(ButtonStyle.Secondary),
			cancelbutton(authorId),
		);
		return interaction.update({
			embeds: [wizard],
			components: [row],
		});
	}, { userFilterIndex: 1 })
	.setButtonResponse(async function customizeTitle(interaction, channelId, authorId) {
		const titleInput = new TextInputBuilder()
			.setCustomId('titleInput')
			.setLabel('Título')
			.setPlaceholder('Ej: GIFs PixelArt')
			.setStyle(TextInputStyle.Short)
			.setRequired(true)
			.setMaxLength(255);
		const row = makeTextInputRowBuilder().addComponents(titleInput);
		const modal = new ModalBuilder()
			.setCustomId(`feed_setCustomTitle_${channelId}_${authorId}`)
			.setTitle('Personalización de Feed')
			.addComponents(row);

		interaction.showModal(modal);
	}, { userFilterIndex: 1 })
	.setButtonResponse(async function customizeTags(interaction, channelId, authorId) {
		const tagsInput = new TextInputBuilder()
			.setCustomId('tagsInput')
			.setLabel('Cantidad de tags a mostrar')
			.setPlaceholder('Introduce 0 para no mostrar tags')
			.setStyle(TextInputStyle.Short)
			.setRequired(true)
			.setMinLength(1)
			.setMaxLength(2);
		const row = makeTextInputRowBuilder().addComponents(tagsInput);
		const modal = new ModalBuilder()
			.setCustomId(`feed_setCustomMaxTags_${channelId}_${authorId}`)
			.setTitle('Personalización de Feed')
			.addComponents(row);

		interaction.showModal(modal);
	}, { userFilterIndex: 1 })
	.setButtonResponse(async function customizeSubtitle(interaction, channelId, authorId) {
		const footerInput = new TextInputBuilder()
			.setCustomId('subtitleInput')
			.setLabel('Antetítulo')
			.setPlaceholder('Texto encima del título')
			.setStyle(TextInputStyle.Short)
			.setRequired(true)
			.setMaxLength(255);
		const row = makeTextInputRowBuilder().addComponents(footerInput);
		const modal = new ModalBuilder()
			.setCustomId(`feed_setCustomSubtitle_${channelId}_${authorId}`)
			.setTitle('Personalización de Feed')
			.addComponents(row);

		interaction.showModal(modal);
	}, { userFilterIndex: 1 })
	.setButtonResponse(async function customizeFooter(interaction, channelId, authorId) {
		const footerInput = new TextInputBuilder()
			.setCustomId('footerInput')
			.setLabel('Pie de imagen')
			.setPlaceholder('Ej: ¡Es una imagen muy bonita~!')
			.setStyle(TextInputStyle.Short)
			.setRequired(true)
			.setMaxLength(255);
		const row = makeTextInputRowBuilder().addComponents(footerInput);
		const modal = new ModalBuilder()
			.setCustomId(`feed_setCustomFooter_${channelId}_${authorId}`)
			.setTitle('Personalización de Feed')
			.addComponents(row);

		interaction.showModal(modal);
	}, { userFilterIndex: 1 })
	.setButtonResponse(async function customizeIcon(interaction, channelId, authorId) {
		const iconInput = new TextInputBuilder()
			.setCustomId('iconInput')
			.setLabel('Enlace de ícono de esquina')
			.setPlaceholder('Ejemplo: https://i.imgur.com/LFzqoJX.jpeg')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true)
			.setMaxLength(255);
		const row = makeTextInputRowBuilder().addComponents(iconInput);
		const modal = new ModalBuilder()
			.setCustomId(`feed_setCustomIcon_${channelId}_${authorId}`)
			.setTitle('Personalización de Feed')
			.addComponents(row);

		interaction.showModal(modal);
	}, { userFilterIndex: 1 })
	.setModalResponse(async function setCustomTitle(interaction, channelId) {
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		const input = interaction.fields.getTextInputValue('titleInput');
		gcfg.feeds[channelId].title = input;
		gcfg.markModified('feeds');
		gcfg.save();

		return interaction.reply({ content: '✅ Título actualizado', ephemeral: true });

	}, { userFilterIndex: 1 })
	.setModalResponse(async function setCustomMaxTags(interaction, channelId) {
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		const input = interaction.fields.getTextInputValue('tagsInput');
		const maxTags = parseInt(input);

		if(isNaN(maxTags) || maxTags < 0 || maxTags > 50)
			return interaction.reply({ content: '⚠️ Cantidad inválida. Introduce un número entre 0 y 50' });

		gcfg.markModified('feeds');
		gcfg.save();
		gcfg.feeds[channelId].maxTags = maxTags;

		return interaction.reply({ content: '✅ Cantidad de tags máxima actualizada', ephemeral: true });
	}, { userFilterIndex: 1 })
	.setModalResponse(async function setCustomSubtitle(interaction, channelId) {
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		const input = interaction.fields.getTextInputValue('subtitleInput');

		gcfg.feeds[channelId].subtitle = input;
		gcfg.markModified('feeds');
		gcfg.save();

		return interaction.reply({ content: '✅ Antetítulo actualizado', ephemeral: true });
	}, { userFilterIndex: 1 })
	.setModalResponse(async function setCustomFooter(interaction, channelId) {
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		const input = interaction.fields.getTextInputValue('footerInput');

		gcfg.feeds[channelId].footer = input;
		gcfg.markModified('feeds');
		gcfg.save();

		return interaction.reply({ content: '✅ Pie de imagen actualizado', ephemeral: true });
	}, { userFilterIndex: 1 })
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
			setTimeout(() => { if(sent?.deletable) sent.delete().catch(console.error); }, 1500);
			gcfg.markModified('feeds');
			gcfg.save();
			return interaction.editReply({ content: '✅ Ícono actualizado' });
		} catch(error) {
			auditError(error, { brief: 'Ha ocurrido un error al procesar Feed' });
			return interaction.editReply({ content: '⚠️ Enlace inválido. Asegúrate de proveer un enlace completo y directo a la imagen' })
		}
	}, { userFilterIndex: 1 })
	.setButtonResponse(async function removeCustomTitle(interaction, channelId, authorId) {
		const translator = await Translator.from(interaction.user.id);
		const fetchedChannel = interaction.guild.channels.cache.get(channelId);
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		delete gcfg.feeds[channelId].title;
		gcfg.markModified('feeds');
		await gcfg.save();

		const concludedEmbed = new EmbedBuilder()
			.setColor(Colors.DarkGreen)
			.setAuthor({ name: wizTitle(translator), iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación finalizada' })
			.addFields({
				name: 'Feed personalizado',
				value: `Se ha eliminado el título personalizado del Feed con las tags _"${safeTags(gcfg.feeds[channelId].tags)}"_ para el canal **${fetchedChannel.name}**`,
			});
		return interaction.update({
			embeds: [concludedEmbed],
			components: [makeButtonRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`feed_selectCustomize_${authorId}`)
					.setLabel('Seguir personalizando')
					.setStyle(ButtonStyle.Primary),
			)],
		});
	}, { userFilterIndex: 1 })
	.setButtonResponse(async function removeCustomTags(interaction, channelId, authorId) {
		const translator = await Translator.from(interaction.user.id);
		const fetchedChannel = interaction.guild.channels.cache.get(channelId);
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		delete gcfg.feeds[channelId].tags;
		gcfg.markModified('feeds');
		await gcfg.save();

		const concludedEmbed = new EmbedBuilder()
			.setColor(Colors.DarkGreen)
			.setAuthor({ name: wizTitle(translator), iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación finalizada' })
			.addFields({
				name: 'Feed personalizado',
				value: `Se ha restaurado la cantidad de tags máxima por defecto del Feed con las tags _"${safeTags(gcfg.feeds[channelId].tags)}"_ para el canal **${fetchedChannel.name}**`,
			});
		return interaction.update({
			embeds: [concludedEmbed],
			components: [makeButtonRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`feed_selectCustomize_${authorId}`)
					.setLabel('Seguir personalizando')
					.setStyle(ButtonStyle.Primary),
			)],
		});
	}, { userFilterIndex: 1 })
	.setButtonResponse(async function removeCustomFooter(interaction, channelId, authorId) {
		const translator = await Translator.from(interaction.user.id);
		const fetchedChannel = interaction.guild.channels.cache.get(channelId);
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		delete gcfg.feeds[fetchedChannel.id].subtitle;
		gcfg.markModified('feeds');
		await gcfg.save();

		const concludedEmbed = new EmbedBuilder()
			.setColor(Colors.DarkGreen)
			.setAuthor({ name: wizTitle(translator), iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación finalizada' })
			.addFields({
				name: 'Feed personalizado',
				value: `Se ha eliminado el subtítulo personalizado del Feed con las tags _"${safeTags(gcfg.feeds[fetchedChannel.id].tags)}"_ para el canal **${fetchedChannel.name}**`,
			});
		return interaction.update({
			embeds: [concludedEmbed],
			components: [makeButtonRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`feed_selectCustomize_${authorId}`)
					.setLabel('Seguir personalizando')
					.setStyle(ButtonStyle.Primary),
			)],
		});
	}, { userFilterIndex: 1 })
	.setButtonResponse(async function removeCustomFooter(interaction, channelId, authorId) {
		const translator = await Translator.from(interaction.user.id);
		const fetchedChannel = interaction.guild.channels.cache.get(channelId);
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		delete gcfg.feeds[fetchedChannel.id].footer;
		gcfg.markModified('feeds');
		await gcfg.save();

		const concludedEmbed = new EmbedBuilder()
			.setColor(Colors.DarkGreen)
			.setAuthor({ name: wizTitle(translator), iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación finalizada' })
			.addFields({
				name: 'Feed personalizado',
				value: `Se ha eliminado el texto de pie personalizado del Feed con las tags _"${safeTags(gcfg.feeds[fetchedChannel.id].tags)}"_ para el canal **${fetchedChannel.name}**`,
			});
		return interaction.update({
			embeds: [concludedEmbed],
			components: [makeButtonRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`feed_selectCustomize_${authorId}`)
					.setLabel('Seguir personalizando')
					.setStyle(ButtonStyle.Primary),
			)],
		});
	}, { userFilterIndex: 1 })
	.setButtonResponse(async function removeCustomIcon(interaction, channelId, authorId) {
		const translator = await Translator.from(interaction.user.id);
		const fetchedChannel = interaction.guild.channels.cache.get(channelId);
		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		delete gcfg.feeds[fetchedChannel.id].cornerIcon;
		gcfg.markModified('feeds');
		await gcfg.save();

		const concludedEmbed = new EmbedBuilder()
			.setColor(Colors.DarkGreen)
			.setAuthor({ name: wizTitle(translator), iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: 'Operación finalizada' })
			.addFields({
				name: 'Feed personalizado',
				value: `Se ha eliminado el ícono de esquina personalizado del Feed con las tags _"${safeTags(gcfg.feeds[fetchedChannel.id].tags)}"_ para el canal **${fetchedChannel.name}**`,
			});
		return interaction.update({
			embeds: [concludedEmbed],
			components: [makeButtonRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`feed_selectCustomize_${authorId}`)
					.setLabel('Seguir personalizando')
					.setStyle(ButtonStyle.Primary),
			)],
		});
	}, { userFilterIndex: 1 })
	.setButtonResponse(async function cancelWizard(interaction) {
		const translator = await Translator.from(interaction.user.id);
		const cancelEmbed = new EmbedBuilder()
			.setAuthor({ name: wizTitle(translator), iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: translator.getText('cancelledStepFooterName') })
			.addFields({ name: translator.getText('cancelledStepName'), value: translator.getText('feedCancelledStep') });
		return interaction.update({
			embeds: [cancelEmbed],
			components: [],
		});
	}, { userFilterIndex: 0 })
	.setButtonResponse(async function finishWizard(interaction) {
		const translator = await Translator.from(interaction.user.id);
		const cancelEmbed = new EmbedBuilder()
			.setAuthor({ name: wizTitle(translator), iconURL: interaction.client.user.avatarURL() })
			.setFooter({ text: translator.getText('finishedStepFooterName') })
			.setDescription(translator.getText('feedFinishedStep'));
		return interaction.update({
			embeds: [cancelEmbed],
			components: [],
		});
	}, { userFilterIndex: 0 })
	.setButtonResponse(async function showFeedImageUrl(interaction) {
		//Función en desuso. Permanece por compatibilidad
		return this.showFeedImageTags(interaction);
	})
	.setButtonResponse(async function showFeedImageTags(interaction, isNotFeed) {
        const translator = await Translator.from(interaction.user.id);

		const url = (/**@type {ButtonComponent}*/(interaction.message.components[0].components[0])).url;
		const booru = new Booru(globalConfigs.booruCredentials);
		try {
			const post = await booru.fetchPostByUrl(url);
			const postTags = await booru.fetchPostTags(post);

			const postArtistTags   = postTags
				.filter(t => t.type === TagTypes.ARTIST)
				.map(t => t.name);
			const postCharacterTags = postTags
				.filter(t => t.type === TagTypes.CHARACTER)
				.map(t => t.name);
			const postCopyrightTags = postTags
				.filter(t => t.type === TagTypes.COPYRIGHT)
				.map(t => t.name);
		
			const otherTagTypes = /**@type {Array<import('../../systems/booru/boorufetch').TagType>}*/([
				TagTypes.ARTIST,
				TagTypes.CHARACTER,
				TagTypes.COPYRIGHT,
			]);
			const postOtherTags = postTags
				.filter(t => !otherTagTypes.includes(t.type))
				.map(t => t.name);

			/**
			 * @param {Array<String>} tagNames 
			 * @param {String} sep 
			 */
			const formatTagNameList = (tagNames, sep) => tagNames.join(sep)
				.replace(/\\/g,'\\\\')
				.replace(/\*/g,'\\*')
				.replace(/_/g,'\\_')
				.replace(/\|/g,'\\|');

			const tagEmoji = guildEmoji('tagswhite', globalConfigs.slots.slot3);
			const tagsContent = formatTagNameList(postOtherTags, ' ');

			const source = post.source;
			const tagsEmbed = new EmbedBuilder()
				.setColor(Colors.Purple);
				
			const characterEmoji = interaction.client.emojis.cache.get('1355128242993893539');
			const copyrightEmoji = interaction.client.emojis.cache.get('1355128256432443584');
			if(postArtistTags.length > 0) {
				const artistTagsContent = formatTagNameList(postArtistTags, '\n');
				tagsEmbed.addFields({ name: `$<:palette:1355128249658638488> Artistas`, value: shortenText(artistTagsContent, 1020), inline: true })
			}
			if(postCharacterTags.length > 0) {
				const characterTagsContent = formatTagNameList(postCharacterTags, '\n');
				tagsEmbed.addFields({ name: `<:person:1355128242993893539> Personajes`, value: shortenText(characterTagsContent, 1020), inline: true })
			}
			if(postCopyrightTags.length > 0) {
				const copyrightTagsContent = formatTagNameList(postCopyrightTags, '\n');
				tagsEmbed.addFields({ name: `<:landmark:1355128256432443584> Copyright`, value: shortenText(copyrightTagsContent, 1020), inline: true })
			}
			tagsEmbed.addFields(
				{ name: `${tagEmoji} Tags`, value: shortenText(tagsContent, 1020) },
				{
					name: '<:urlwhite:922669195521568818> ' + translator.getText('feedViewUrlsName'),
					value: `[<:gelbooru:919398540172750878> **Post**](${url})${ source ? ` [<:heartwhite:969664712604262400> **Fuente**](${source})` : '' }`,
				},
			)
			const userId = compressId(interaction.user.id);
			const tagsEditRow = makeButtonRowBuilder();

			if(isNotFeed)
				tagsEditRow.addComponents([
					new ButtonBuilder()
						.setCustomId(`yo_goToDashboard_${userId}`)
						.setLabel(translator.getText('goToUserPreferences'))
						.setStyle(ButtonStyle.Primary),
				]);
			else
				tagsEditRow.addComponents([
					new ButtonBuilder()
						.setCustomId(`yo_modifyFollowedTags_${userId}_ALT`)
						.setEmoji('921788204540100608')
						.setLabel(translator.getText('feedSetTagsButtonView'))
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('feed_editFollowedTags_ADD')
						.setEmoji('1086797601925513337')
						.setLabel(translator.getText('feedSetTagsButtonAdd'))
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId('feed_editFollowedTags_REMOVE')
						.setEmoji('1086797599287296140')
						.setLabel(translator.getText('feedSetTagsButtonRemove'))
						.setStyle(ButtonStyle.Danger),
				]);

			return interaction.reply({
				embeds: [tagsEmbed],
				components: [tagsEditRow],
				ephemeral: true,
			});
		} catch(error) {
			console.error(error);
			auditError(error, { brief: 'Ha ocurrido un error al procesar Feed' });
			
			if(error instanceof BooruUnknownPostError)
				return interaction.reply({ content: 'Puede que el Post del que se intentó recuperar las tags se haya eliminado', ephemeral: true });

			return interaction.reply({
				content: 'Ocurrió un problema al contactar con el Booru para recuperar las tags.\nInténtalo de nuevo, si el problema persiste, es probable que el objetivo no esté disponible o que se trate de un bug de mi parte',
				ephemeral: true,
			});
		}
	})
	.setButtonResponse(async function editFollowedTags(interaction, operation) {
        const translator = await Translator.from(interaction.user.id);

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

		const row = makeTextInputRowBuilder().addComponents(tagsInput);

		const modal = new ModalBuilder()
			.setCustomId(`yo_setFollowedTags_${operation}`)
			.setTitle(title)
			.addComponents(row);

		return interaction.showModal(modal).catch(auditError);
	})
	.setButtonResponse(async function deletePost(interaction, manageableBy, isNotFeed) {
		const translator = await Translator.from(interaction.user.id);

		if(manageableBy !== interaction.user.id && isNotModerator(interaction.member))
			return interaction.reply({
				content: translator.getText('unauthorizedInteraction'),
				ephemeral: true,
			});
		
		const { message } = interaction;
		const url = (/**@type {ButtonComponent}*/(message.components[0].components[0])).url;
		if(isNotFeed || !url)
			return Promise.all([
				interaction.reply({
					content: `**${translator.getText('feedDeletePostTitle')}**`,
					ephemeral: true,
				}),
				message.delete().catch(console.error),
			]);
		
		const booru = new Booru(globalConfigs.booruCredentials);

		try {
			const post = await booru.fetchPostByUrl(url);
			if(!post)
				return Promise.all([
					interaction.reply({
						content: `<:gelbooru:919398540172750878> **${translator.getText('feedDeletePostTitle')}** <${url}>`,
						ephemeral: true,
					}),
					message.delete().catch(console.error),
				]);
	
			const tags = shortenText(`\`\`\`\n${post.tags.join(' ')}\n\`\`\``, 1024);
			const embed = new EmbedBuilder()
				.setColor(Colors.DarkRed)
				.setTitle(translator.getText('feedDeletePostTitle'))
				.setDescription(translator.getText('feedDeletePostAdvice'))
				.addFields(
					{
						name: `<:tagswhite:921788204540100608> ${translator.getText('feedDeletePostTagsName')}`,
						value: tags,
					},
					{
						name: `<:urlwhite:922669195521568818> ${translator.getText('feedDeletePostLinkName')}`,
						value: `[Gelbooru](${url})`,
					},
				);
			const row = makeButtonRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId('feed_startWizard')
					.setLabel('Configurar Feeds...')
					.setStyle(ButtonStyle.Primary),
			);
	
			return Promise.all([
				interaction.reply({
					embeds: [embed],
					components: [row],
					ephemeral: true,
				}),
				message.delete().catch(console.error),
			]);
		} catch(error) {
			console.error(error);
			auditError(error, { brief: 'Ha ocurrido un error al procesar Feed' });
			
			if(error instanceof BooruUnknownPostError)
				return interaction.reply({
					content: 'Puede que el Post eliminado de Discord haya sido también eliminado del Booru del que se originó, pues no se pudieron recuperar sus tags',
					ephemeral: true,
				});

			return Promise.all([
				interaction.reply({
					content: 'Post eliminado (no se pudo recuperar la información del Post y/o sus tags)',
					ephemeral: true,
				}),
				message.delete().catch(console.error),
			]);
		}
	})
	.setButtonResponse(async function shock(interaction) {
		//No hace nada. Permanece por botones antiguos que ya fueron posteados
		const { member } = interaction;
		if(isNotModerator(member))
			return interaction.reply({ content: '❌ No tienes permiso para hacer eso, teehee~', ephemeral: true });
		return interaction.reply({ content: 'Shock aplicado.', ephemeral: true });
	})
	.setButtonResponse(async function giveFeedback(interaction, type) {
		const translator = await Translator.from(interaction.user);
		//return interaction.reply({ content: translator.getText('feedFeedbackExpired'), ephemeral: true });

		//type = 'Y' | 'N' | 'F'
		if(type === 'Y' || type === 'N') {
			auditAction(`PuréFeed • Feedback • ${interaction.user.username}`, {
				name: 'Calificación',
				value: type === 'Y' ? '✅ Satisfecho' : '❌ Insatisfecho',
			});

			return interaction.reply({ content: translator.getText('feedFeedbackThanks'), ephemeral: true });
		}

		if(type !== 'F')
			return interaction.reply({ content: translator.getText('unknownInteraction'), ephemeral: true });

		const modal = new ModalBuilder()
			.setCustomId('feed_sendFeedback')
			.setTitle(translator.getText('feedFeedbackTitle'))
			.setComponents(makeTextInputRowBuilder().addComponents(
				new TextInputBuilder()
					.setCustomId('feedback')
					.setLabel(translator.getText('feedFeedbackName'))
					.setMinLength(20)
					.setMaxLength(250)
					.setRequired(true)
					.setStyle(TextInputStyle.Paragraph)
			));

		return interaction.showModal(modal);
	}).setModalResponse(async function sendFeedback(interaction) {
		const translator = await Translator.from(interaction.user);
		const feedback = interaction.fields.getTextInputValue('feedback');

		auditAction(`PuréFeed • Feedback • ${interaction.user.username}`, {
			name: 'Mensaje',
			value: feedback,
		});

		return interaction.reply({ content: translator.getText('feedFeedbackThanks'), ephemeral: true });
	});

module.exports = command;
