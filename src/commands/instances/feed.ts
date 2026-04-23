import { BooruUnknownPostError, type TagType, TagTypes } from '@papitaconpure/booru-client';
import { getUnixTime } from 'date-fns';
import type {
	ButtonInteraction,
	GuildBasedChannel,
	Message,
	SelectMenuComponentOptionData,
} from 'discord.js';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	Colors,
	ContainerBuilder,
	EmbedBuilder,
	MessageFlags,
	ModalBuilder,
	StringSelectMenuBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';
import { tenshiAltColor } from '@/data/globalProps';
import {
	compressId,
	isNotModerator,
	isNSFWChannel,
	randInArray,
	shortenText,
	shortenTextLoose,
} from '@/func';
import { Translator } from '@/i18n';
import FeedConfigModel from '@/models/feeds';
import { getMainBooruClient } from '@/systems/booru/booruclient';
import { addFeedToUpdateStack } from '@/systems/booru/boorufeed';
import {
	formatBooruPostMessage,
	formatTagNameListNew,
	getPostUrlFromComponents,
} from '@/systems/booru/boorusend.js';
import { auditAction, auditError } from '@/systems/others/auditor';
import type { AnyCommandInteraction } from '@/types/commands';
import { getBotEmoji, getBotEmojiResolvable } from '@/utils/emojis';
import { Command, CommandPermissions, CommandTags } from '../commons';

const wizTitle = (translator: Translator) => translator.getText('feedAuthor');

const cancelbutton = (compressedAuthorId: string) =>
	new ButtonBuilder()
		.setCustomId(`feed_cancelWizard_${compressedAuthorId}`)
		.setEmoji(getBotEmojiResolvable('xmarkAccent'))
		.setStyle(ButtonStyle.Secondary);

const finishButton = (translator: Translator, compressedAuthorId: string) =>
	new ButtonBuilder()
		.setCustomId(`feed_finishWizard_${compressedAuthorId}`)
		.setLabel(translator.getText('buttonFinish'))
		.setStyle(ButtonStyle.Secondary);

const safeTags = (_tags = '') => _tags.replace(/\\*\*/g, '\\*').replace(/\\*_/g, '\\_');

const generateFeedOptions = async (
	interaction: ButtonInteraction,
): Promise<SelectMenuComponentOptionData[]> => {
	const feeds = await FeedConfigModel.find({ guildId: interaction.guild?.id });

	if (!feeds.length) return [];

	const feedOptions = feeds
		.map((feed) => {
			const channel = interaction.guild?.channels.cache.get(feed.channelId);

			if (!channel) return null;

			return {
				label: shortenText(feed.searchTags, 99),
				description: `#${channel.name}`,
				value: feed.channelId,
			};
		})
		.filter((feed) => feed != null);

	return feedOptions;
};

function tagsSetupPrompt(
	interaction: Message | AnyCommandInteraction,
	channelId: string,
	translator: Translator,
) {
	const fetchedChannel = interaction.guild?.channels.cache.get(channelId) as GuildBasedChannel;
	const gelEmoji = getBotEmoji('gelbooruAccent');
	const embed = new EmbedBuilder()
		.setColor(Colors.Blurple)
		.setAuthor({
			name: wizTitle(translator),
			iconURL: interaction.client.user.displayAvatarURL(),
		})
		.setFooter({ text: 'Asignar tags' })
		.addFields(
			{
				name: 'Destino',
				value: `**${fetchedChannel.name}** (canal ${isNSFWChannel(fetchedChannel) ? 'NSFW' : 'SFW'})`,
			},
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
			{
				name: 'Cómo buscar',
				value: `[${gelEmoji} howto:search](https://gelbooru.com/index.php?page=wiki&s=view&id=25921)`,
				inline: true,
			},
			{
				name: 'Sobre ratings',
				value: `[${gelEmoji} howto:rate](https://gelbooru.com/index.php?page=wiki&s=view&id=2535)`,
				inline: true,
			},
			{
				name: 'Ayudamemoria',
				value: `[${gelEmoji} howto:cheatsheet](https://gelbooru.com/index.php?page=wiki&s=view&id=26263)`,
				inline: true,
			},
			{
				name: 'Ejemplo de uso',
				value: 'Enviar `touhou rating:general -breast_grab` configurará un Feed de imágenes _SFW_ de Touhou que _no_ tengan la tag "breast_grab"',
			},
		);
	return embed;
}

const perms = new CommandPermissions()
	.requireAnyOf(['ManageGuild', 'ManageChannels'])
	.requireAnyOf('ManageMessages');

const tags = new CommandTags().add('COMMON', 'MOD');

const command = new Command('feed', tags)
	.setBriefDescription('Inicializa un Feed en un canal por medio de un Asistente.')
	.setLongDescription(
		'Inicializa un Feed de imágenes en un canal. Simplemente usa el comando y sigue los pasos del Asistente para configurar y personalizar todo',
	)
	.setPermissions(perms)
	.setExecution(async (request) => {
		const translator = await Translator.from(request.userId);
		const wizard = new EmbedBuilder()
			.setColor(Colors.Aqua)
			.setAuthor({
				name: wizTitle(translator),
				iconURL: request.client.user.displayAvatarURL(),
			})
			.setFooter({ text: 'Comenzar' })
			.addFields({
				name: 'Bienvenido',
				value: 'Si es la primera vez que configuras un Feed de imágenes con Bot de Puré, ¡no te preocupes! Simplemente sigue las instrucciones del Asistente y adapta tu Feed a lo que quieras',
			});

		const authorId = compressId(request.userId);
		return request.reply({
			embeds: [wizard],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId('feed_startWizard')
						.setLabel('Comenzar')
						.setStyle(ButtonStyle.Primary),
					cancelbutton(authorId),
				),
			],
		});
	})
	.setButtonResponse(async function startWizard(interaction) {
		const guildQuery = { guildId: interaction.guild.id };
		const [feeds, translator] = await Promise.all([
			FeedConfigModel.find(guildQuery),
			Translator.from(interaction.user.id),
		]);
		const hasFeeds = feeds.length;

		const authorId = compressId(interaction.user.id);
		const wizard = new EmbedBuilder()
			.setColor(Colors.Navy)
			.setAuthor({
				name: wizTitle(translator),
				iconURL: interaction.client.user.displayAvatarURL(),
			})
			.setFooter({ text: 'Seleccionar operación' })
			.addFields({
				name: 'Selecciona una operación',
				value: '¿Qué deseas hacer ahora mismo?',
			});

		return interaction.update({
			embeds: [wizard],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId(`feed_createNew_${authorId}`)
						.setEmoji(getBotEmojiResolvable('plusWhite'))
						.setLabel(translator.getText('buttonCreate'))
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId(`feed_selectDelete_${authorId}`)
						.setEmoji(getBotEmojiResolvable('trashWhite'))
						.setLabel(translator.getText('buttonDelete'))
						.setStyle(ButtonStyle.Danger)
						.setDisabled(!hasFeeds),
					finishButton(translator, authorId),
				),
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId(`feed_selectEdit_${authorId}`)
						.setEmoji(getBotEmojiResolvable('tagWhite'))
						.setLabel(translator.getText('buttonEdit'))
						.setStyle(ButtonStyle.Primary)
						.setDisabled(!hasFeeds),
					new ButtonBuilder()
						.setCustomId(`feed_selectCustomize_${authorId}`)
						.setEmoji(getBotEmojiResolvable('pencilWhite'))
						.setLabel(translator.getText('buttonCustomize'))
						.setStyle(ButtonStyle.Primary)
						.setDisabled(!hasFeeds),
					new ButtonBuilder()
						.setCustomId(`feed_selectView_${authorId}`)
						.setEmoji(getBotEmojiResolvable('eyeWhite'))
						.setLabel(translator.getText('buttonView'))
						.setStyle(ButtonStyle.Primary)
						.setDisabled(!hasFeeds),
				),
			],
		});
	})
	.setButtonResponse(
		async function createNew(interaction, authorId) {
			const channelInput = new TextInputBuilder()
				.setCustomId('channelInput')
				.setLabel('Canal')
				.setPlaceholder(
					`Ej: #${interaction.channel?.name ?? 'un-canal'} / ${interaction.channel?.id ?? '1234567890123456789'}`,
				)
				.setStyle(TextInputStyle.Short)
				.setRequired(true);
			const row = new ActionRowBuilder<TextInputBuilder>().addComponents(channelInput);
			const modal = new ModalBuilder()
				.setCustomId(`feed_createOnChannel_${authorId}`)
				.setTitle('Creación de Feed')
				.addComponents(row);
			return interaction.showModal(modal);
		},
		{ userFilterIndex: 0 },
	)
	.setModalResponse(
		async function createOnChannel(interaction, authorId) {
			const translator = await Translator.from(interaction.user.id);
			let input = interaction.fields.getTextInputValue('channelInput');
			if (input.startsWith('<') && input.endsWith('>')) input = input.slice(1, -1);
			if (input.startsWith('#')) input = input.slice(1);
			if (input.startsWith('!')) input = input.slice(1);

			const channels = interaction.guild.channels.cache;
			const textChannels = channels.filter((c) =>
				[
					ChannelType.GuildText,
					ChannelType.PublicThread,
					ChannelType.PrivateThread,
				].includes(c.type),
			);
			const fetchedChannel = Number.isNaN(+input)
				? textChannels.find((c) => c.name.toLowerCase().includes(input))
				: textChannels.get(input);

			if (!fetchedChannel)
				return interaction.reply({
					content: '⚠️ Canal inválido',
					flags: MessageFlags.Ephemeral,
				});

			const channelQuery = { channelId: fetchedChannel.id };
			const channelHasFeed = await FeedConfigModel.exists(channelQuery);

			if (channelHasFeed)
				return interaction.reply({
					content:
						'⚠️ Ya existe un Feed en el canal solicitado. Prueba editarlo o crear un Feed en otro canal',
					flags: MessageFlags.Ephemeral,
				});

			const wizard = tagsSetupPrompt(interaction, fetchedChannel.id, translator);
			return interaction.update({
				embeds: [wizard],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId(`feed_editTags_${fetchedChannel.id}_${authorId}`)
							.setLabel('Ingresar Tags')
							.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
							.setCustomId(`feed_startWizard_${authorId}`)
							.setEmoji(getBotEmojiResolvable('navBackAccent'))
							.setStyle(ButtonStyle.Secondary),
						cancelbutton(authorId),
					),
				],
			});
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(
		async function editTags(interaction, channelId, authorId) {
			const modal = new ModalBuilder()
				.setCustomId(`feed_setTags_${channelId}_${authorId}`)
				.setTitle('Personalización de Feed')
				.addLabelComponents((label) =>
					label
						.setLabel('Tags')
						.setTextInputComponent((textInput) =>
							textInput
								.setCustomId('tagsInput')
								.setPlaceholder('rating:general touhou animated* -chibi')
								.setStyle(TextInputStyle.Paragraph)
								.setRequired(true)
								.setMaxLength(4000),
						),
				);

			return interaction.showModal(modal);
		},
		{ userFilterIndex: 1 },
	)
	.setModalResponse(
		async function setTags(interaction, channelId, authorId) {
			const translator = await Translator.from(interaction.user.id);
			const fetchedChannel = interaction.guild.channels.cache.get(channelId);
			const input = interaction.fields.getTextInputValue('tagsInput').toLowerCase().trim();

			if (fetchedChannel == null)
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('invalidChannel'),
				});

			const feed = await FeedConfigModel.findOne({ channelId });

			if (!feed) return interaction.deleteReply();

			const sortRegex = /\bsort:[^\s]+/gi;
			feed.searchTags = input
				.split(/\s+/)
				.filter((t) => t.length && sortRegex.test(t))
				.join(' ');
			feed.lastFetchedAt = new Date();

			const firstUpdateDelay = addFeedToUpdateStack(feed);
			await feed.save();

			const concludedEmbed = new EmbedBuilder()
				.setColor(Colors.DarkVividPink)
				.setAuthor({
					name: wizTitle(translator),
					iconURL: interaction.client.user.displayAvatarURL(),
				})
				.setFooter({ text: 'Operación finalizada' })
				.addFields(
					{
						name: 'Feed configurado',
						value: `Se ha configurado un Feed con las tags _"${safeTags(input)}"_ para el canal **${fetchedChannel.name}**`,
					},
					{
						name: 'Control del Feed',
						value: 'Puedes modificar, personalizar o eliminar este Feed en cualquier momento siguiendo el Asistente una vez más',
					},
					{
						name: 'Actualización Programada',
						value: `Este Feed se actualizará por primera vez <t:${getUnixTime(new Date(Date.now() + firstUpdateDelay))}:R>`,
					},
				);
			return interaction.update({
				embeds: [concludedEmbed],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId(`feed_startWizard_${authorId}`)
							.setLabel('Seguir configurando')
							.setStyle(ButtonStyle.Primary),
						finishButton(translator, authorId),
					),
				],
			});
		},
		{ userFilterIndex: 1 },
	)
	.setButtonResponse(
		async function selectEdit(interaction, authorId) {
			const translator = await Translator.from(interaction.user.id);
			const wizard = new EmbedBuilder()
				.setColor(Colors.Greyple)
				.setAuthor({
					name: wizTitle(translator),
					iconURL: interaction.client.user.displayAvatarURL(),
				})
				.setFooter({ text: 'Seleccionar Feed' })
				.addFields({
					name: 'Selección de Feed',
					value: 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras modificar en esta lista y selecciónalo',
				});
			const feeds = await generateFeedOptions(interaction);
			if (!feeds.length)
				return interaction.reply({
					content: '⚠️ No hay Feeds para mostrar',
					flags: MessageFlags.Ephemeral,
				});
			return interaction.update({
				embeds: [wizard],
				components: [
					new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
						new StringSelectMenuBuilder()
							.setCustomId(`feed_selectedEdit_${authorId}`)
							.setPlaceholder('Selecciona un Feed')
							.addOptions(feeds),
					),
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId(`feed_startWizard_${authorId}`)
							.setEmoji(getBotEmojiResolvable('navBackAccent'))
							.setStyle(ButtonStyle.Secondary),
						cancelbutton(authorId),
					),
				],
			});
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(
		async function selectCustomize(interaction, authorId) {
			const translator = await Translator.from(interaction.user.id);
			const wizard = new EmbedBuilder()
				.setColor(Colors.Greyple)
				.setAuthor({
					name: wizTitle(translator),
					iconURL: interaction.client.user.displayAvatarURL(),
				})
				.setFooter({ text: 'Seleccionar Feed' })
				.addFields({
					name: 'Selección de Feed',
					value: 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras personalizar en esta lista y selecciónalo',
				});
			const feeds = await generateFeedOptions(interaction);
			if (!feeds.length)
				return interaction.reply({
					content: '⚠️ No hay Feeds para mostrar',
					flags: MessageFlags.Ephemeral,
				});
			return interaction.update({
				embeds: [wizard],
				components: [
					new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
						new StringSelectMenuBuilder()
							.setCustomId(`feed_selectedCustomize_${authorId}`)
							.setPlaceholder('Selecciona un Feed')
							.addOptions(feeds),
					),
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId(`feed_startWizard_${authorId}`)
							.setEmoji(getBotEmojiResolvable('navBackAccent'))
							.setStyle(ButtonStyle.Secondary),
						cancelbutton(authorId),
					),
				],
			});
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(
		async function selectView(interaction, authorId) {
			const translator = await Translator.from(interaction.user.id);
			const wizard = new EmbedBuilder()
				.setColor(Colors.Greyple)
				.setAuthor({
					name: wizTitle(translator),
					iconURL: interaction.client.user.displayAvatarURL(),
				})
				.setFooter({ text: 'Seleccionar Feed' })
				.addFields({
					name: 'Selección de Feed',
					value: 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras ver en esta lista y selecciónalo',
				});
			const feeds = await generateFeedOptions(interaction);
			if (!feeds.length)
				return interaction.reply({
					content: '⚠️ No hay Feeds para mostrar',
					flags: MessageFlags.Ephemeral,
				});
			return interaction.update({
				embeds: [wizard],
				components: [
					new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
						new StringSelectMenuBuilder()
							.setCustomId(`feed_selectedView_${authorId}`)
							.setPlaceholder('Selecciona un Feed')
							.addOptions(feeds),
					),
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId(`feed_startWizard_${authorId}`)
							.setEmoji(getBotEmojiResolvable('navBackAccent'))
							.setStyle(ButtonStyle.Secondary),
						cancelbutton(authorId),
					),
				],
			});
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(
		async function selectDelete(interaction, authorId) {
			const translator = await Translator.from(interaction.user.id);
			const wizard = new EmbedBuilder()
				.setColor(Colors.Greyple)
				.setAuthor({
					name: wizTitle(translator),
					iconURL: interaction.client.user.displayAvatarURL(),
				})
				.setFooter({ text: 'Seleccionar Feed' })
				.addFields({
					name: 'Selección de Feed',
					value: 'Los Feeds que configuraste anteriormente están categorizados por canal y tags. Encuentra el que quieras eliminar en esta lista y selecciónalo',
				});
			const feeds = await generateFeedOptions(interaction);
			if (!feeds.length)
				return interaction.reply({
					content: '⚠️ No hay Feeds para mostrar',
					flags: MessageFlags.Ephemeral,
				});
			return interaction.update({
				embeds: [wizard],
				components: [
					new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
						new StringSelectMenuBuilder()
							.setCustomId(`feed_selectedDelete_${authorId}`)
							.setPlaceholder('Selecciona un Feed')
							.addOptions(feeds),
					),
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId(`feed_startWizard_${authorId}`)
							.setEmoji(getBotEmojiResolvable('navBackAccent'))
							.setStyle(ButtonStyle.Secondary),
						cancelbutton(authorId),
					),
				],
			});
		},
		{ userFilterIndex: 0 },
	)
	.setSelectMenuResponse(
		async function selectedEdit(interaction, authorId) {
			const translator = await Translator.from(interaction.user.id);
			const channelId = interaction.values[0];
			const wizard = tagsSetupPrompt(interaction, channelId, translator);
			return interaction.update({
				embeds: [wizard],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId(`feed_editTags_${channelId}_${authorId}`)
							.setLabel('Ingresar Tags')
							.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
							.setCustomId(`feed_selectEdit_${authorId}`)
							.setEmoji(getBotEmojiResolvable('navBackAccent'))
							.setStyle(ButtonStyle.Secondary),
						finishButton(translator, authorId),
					),
				],
			});
		},
		{ userFilterIndex: 0 },
	)
	.setSelectMenuResponse(
		async function selectedCustomize(interaction, authorId) {
			if (!interaction.channel) return interaction.deleteReply();

			const translator = await Translator.from(interaction.user.id);

			const fetchedChannel = interaction.guild.channels.cache.get(
				interaction.values[0] || interaction.channel.id,
			);
			if (fetchedChannel == null)
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('invalidChannel'),
				});

			if (!fetchedChannel.isSendable()) return;

			const wizard = new EmbedBuilder()
				.setColor(Colors.Blurple)
				.setAuthor({
					name: wizTitle(translator),
					iconURL: interaction.client.user.displayAvatarURL(),
				})
				.setFooter({ text: 'Seleccionar elemento a personalizar' })
				.addFields(
					{
						name: 'Destino',
						value: `**${fetchedChannel.name}** (canal ${isNSFWChannel(fetchedChannel) ? 'NSFW' : 'SFW'})`,
					},
					{
						name: 'Selecciona un elemento a personalizar',
						value: 'Usa el menú desplegable para decidir qué personalizar',
					},
				);

			return interaction.update({
				embeds: [wizard],
				components: [
					new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
						new StringSelectMenuBuilder()
							.setCustomId(
								`feed_selectItemCustomize_${fetchedChannel.id}_${authorId}`,
							)
							.setPlaceholder('Selecciona un elemento')
							.setOptions([
								{
									label: 'Título',
									description:
										'Asigna o elimina un encabezado para mostrar en cada imagen',
									value: 'title',
								},
								{
									label: 'Tags',
									description:
										'Decide el máximo de tags mostradas por cada imagen',
									value: 'searchTags',
								},
								{
									label: 'Antetítulo',
									description:
										'Asigna o elimina un antetítulo a mostrar en cada imagen',
									value: 'subtitle',
								},
								{
									label: 'Ícono de esquina',
									description:
										'Elige un ícono de esquina personalizado para cada imagen',
									value: 'icon',
								},
								{
									label: 'Pie',
									description:
										'Asigna o elimina un texto a mostrar debajo de cada imagen',
									value: 'footerText',
								},
							]),
					),
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId(`feed_selectCustomize_${authorId}`)
							.setEmoji(getBotEmojiResolvable('navBackAccent'))
							.setStyle(ButtonStyle.Secondary),
						finishButton(translator, authorId),
					),
				],
			});
		},
		{ userFilterIndex: 0 },
	)
	.setSelectMenuResponse(
		async function selectedView(interaction, authorId) {
			const [translator] = await Promise.all([
				Translator.from(interaction.user.id),
				interaction.deferReply({ flags: MessageFlags.Ephemeral }),
			]);

			const feedChannel = interaction.guild.channels.cache.get(
				interaction.values[0] || interaction.channelId,
			);
			if (!feedChannel)
				return interaction.editReply({ content: translator.getText('invalidChannel') });

			const allowNSFW = isNSFWChannel(feedChannel);

			const feed = await FeedConfigModel.findOne({ channelId: feedChannel.id });

			if (!feed)
				return interaction.editReply({ content: translator.getText('invalidChannel') });

			const wizard = new EmbedBuilder()
				.setColor(Colors.Blurple)
				.setAuthor({
					name: wizTitle(translator),
					iconURL: interaction.client.user.displayAvatarURL(),
				})
				.setFooter({ text: 'Visualizando Feed' })
				.addFields(
					{
						name: 'Destino',
						value: `**${feedChannel.name}** (canal ${allowNSFW ? 'NSFW' : 'SFW'})`,
					},
					{ name: 'Tags del Feed', value: `\`\`\`${feed?.searchTags}\`\`\`` },
				);

			await interaction.message
				.edit({
					embeds: [wizard],
					components: [
						new ActionRowBuilder<ButtonBuilder>().addComponents(
							new ButtonBuilder()
								.setCustomId(`feed_selectView_${authorId}`)
								.setEmoji(getBotEmojiResolvable('navBackAccent'))
								.setStyle(ButtonStyle.Secondary),
							finishButton(translator, authorId),
						),
					],
				})
				.catch(console.error);

			const booru = getMainBooruClient();
			const post = randInArray(await booru.search(feed.searchTags, { limit: 42 }));
			if (!post)
				return interaction.editReply({
					content: 'Las tags del feed no dieron ningún resultado',
				});

			const preview = await formatBooruPostMessage(booru, post, {
				...feed,
				allowNSFW,
				disableActions: true,
			});
			return interaction.editReply({
				flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
				components: [
					preview.addTextDisplayComponents((textDisplay) =>
						textDisplay.setContent(
							'-# Esto es una vista previa. Las imágenes NSFW solo pueden previsualizarse en canales NSFW',
						),
					),
				],
			});
		},
		{ userFilterIndex: 0 },
	)
	.setSelectMenuResponse(
		async function selectedDelete(interaction, authorId) {
			const translator = await Translator.from(interaction.user.id);
			const chid = interaction.values[0];
			const feed = await FeedConfigModel.findOne({ channelId: chid });

			if (!feed)
				return interaction.editReply({ content: translator.getText('invalidChannel') });

			const tags = feed.searchTags;
			const wizard = new EmbedBuilder()
				.setColor(Colors.Red)
				.setAuthor({
					name: wizTitle(translator),
					iconURL: interaction.client.user.displayAvatarURL(),
				})
				.setFooter({ text: 'Confirmar' })
				.addFields({
					name: 'Confirmar eliminación de Feed',
					value: `Estás por borrar el Feed _"${safeTags(tags)}"_ ubicado en el canal **<#${chid}>**. ¿Estás seguro?`,
				});

			return interaction.update({
				embeds: [wizard],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId(`feed_deleteOne_${chid}_${authorId}`)
							.setLabel('Borrar')
							.setStyle(ButtonStyle.Danger),
						new ButtonBuilder()
							.setCustomId(`feed_selectDelete_${authorId}`)
							.setEmoji(getBotEmojiResolvable('navBackAccent'))
							.setStyle(ButtonStyle.Secondary),
						cancelbutton(authorId),
					),
				],
			});
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(
		async function deleteOne(interaction, channelId, authorId) {
			const translator = await Translator.from(interaction.user.id);
			const wizard = new EmbedBuilder()
				.setColor(Colors.DarkRed)
				.setAuthor({
					name: wizTitle(translator),
					iconURL: interaction.client.user.displayAvatarURL(),
				})
				.setFooter({ text: 'Operación finalizada' })
				.addFields({
					name: 'Feed eliminado',
					value: 'Se ha eliminado el Feed acordado. Si te arrepientes, tendrás que crearlo otra vez',
				});
			const rows = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(`feed_startWizard_${authorId}`)
					.setLabel('Seguir configurando')
					.setStyle(ButtonStyle.Primary),
				finishButton(translator, authorId),
			);

			const feed = await FeedConfigModel.findOne({ channelId });

			if (!feed)
				return interaction.editReply({ content: translator.getText('invalidChannel') });

			return Promise.all([
				feed.deleteOne(),
				interaction.update({
					embeds: [wizard],
					components: [rows],
				}),
			]);
		},
		{ userFilterIndex: 1 },
	)
	.setSelectMenuResponse(
		async function selectItemCustomize(interaction, channelId, authorId) {
			const translator = await Translator.from(interaction.user.id);
			const customizeTarget = interaction.values[0];
			const fetchedChannel = interaction.guild.channels.cache.get(
				channelId,
			) as GuildBasedChannel;

			const wizard = new EmbedBuilder()
				.setColor(Colors.Green)
				.setAuthor({
					name: wizTitle(translator),
					iconURL: interaction.client.user.displayAvatarURL(),
				})
				.setFooter({ text: 'Personalizar elemento' })
				.addFields({
					name: 'Destino',
					value: `**${fetchedChannel?.name}** (canal ${isNSFWChannel(fetchedChannel) ? 'NSFW' : 'SFW'})`,
				});

			const row = new ActionRowBuilder<ButtonBuilder>();
			switch (customizeTarget) {
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

				case 'searchTags':
					wizard.addFields(
						{
							name: 'Personaliza la cantidad de tags',
							value: 'Clickea "Personalizar" e introduce la cantidad máxima de tags a mostrar (número). Por defecto esto serían unas **20** tags, y puedes especificar hasta un máximo de **50**',
						},
						{
							name: 'Eliminar campo de tags',
							value: 'Si envías "0", el campo de tags se ocultará por completo. No se permiten números negativos',
						},
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

				case 'icon':
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

				case 'footerText':
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
					.setEmoji(getBotEmojiResolvable('navBackAccent'))
					.setStyle(ButtonStyle.Secondary),
				cancelbutton(authorId),
			);

			return interaction.update({
				embeds: [wizard],
				components: [row],
			});
		},
		{ userFilterIndex: 1 },
	)
	.setButtonResponse(
		async function customizeTitle(interaction, channelId, authorId) {
			const modal = new ModalBuilder()
				.setCustomId(`feed_setCustomTitle_${channelId}_${authorId}`)
				.setTitle('Personalización de Feed')
				.addLabelComponents((label) =>
					label
						.setLabel('Título')
						.setTextInputComponent((textInput) =>
							textInput
								.setCustomId('titleInput')
								.setPlaceholder('Ej: GIFs PixelArt')
								.setStyle(TextInputStyle.Short)
								.setRequired(true)
								.setMaxLength(255),
						),
				);

			interaction.showModal(modal);
		},
		{ userFilterIndex: 1 },
	)
	.setButtonResponse(
		async function customizeTags(interaction, channelId, authorId) {
			const modal = new ModalBuilder()
				.setCustomId(`feed_setCustomMaxTags_${channelId}_${authorId}`)
				.setTitle('Personalización de Feed')
				.addLabelComponents((label) =>
					label
						.setLabel('Cantidad de tags a mostrar')
						.setTextInputComponent((textInput) =>
							textInput
								.setCustomId('tagsInput')
								.setPlaceholder('Introduce 0 para no mostrar tags')
								.setStyle(TextInputStyle.Short)
								.setRequired(true)
								.setMinLength(1)
								.setMaxLength(2),
						),
				);

			interaction.showModal(modal);
		},
		{ userFilterIndex: 1 },
	)
	.setButtonResponse(
		async function customizeSubtitle(interaction, channelId, authorId) {
			const modal = new ModalBuilder()
				.setCustomId(`feed_setCustomSubtitle_${channelId}_${authorId}`)
				.setTitle('Personalización de Feed')
				.addLabelComponents((label) =>
					label
						.setLabel('Antetítulo')
						.setTextInputComponent((textInput) =>
							textInput
								.setCustomId('subtitleInput')
								.setPlaceholder('Texto encima del título')
								.setStyle(TextInputStyle.Short)
								.setRequired(true)
								.setMaxLength(255),
						),
				);

			interaction.showModal(modal);
		},
		{ userFilterIndex: 1 },
	)
	.setButtonResponse(
		async function customizeFooter(interaction, channelId, authorId) {
			const modal = new ModalBuilder()
				.setCustomId(`feed_setCustomFooter_${channelId}_${authorId}`)
				.setTitle('Personalización de Feed')
				.addLabelComponents((label) =>
					label
						.setLabel('Pie de imagen')
						.setTextInputComponent((textInput) =>
							textInput
								.setCustomId('footerInput')
								.setPlaceholder('Ej: ¡Es una imagen muy bonita~!')
								.setStyle(TextInputStyle.Short)
								.setRequired(true)
								.setMaxLength(255),
						),
				);

			interaction.showModal(modal);
		},
		{ userFilterIndex: 1 },
	)
	.setButtonResponse(
		async function customizeIcon(interaction, channelId, authorId) {
			const modal = new ModalBuilder()
				.setCustomId(`feed_setCustomIcon_${channelId}_${authorId}`)
				.setTitle('Personalización de Feed')
				.addLabelComponents((label) =>
					label
						.setLabel('Enlace de ícono de esquina')
						.setTextInputComponent((textInput) =>
							textInput
								.setCustomId('iconInput')
								.setPlaceholder('Ejemplo: https://i.imgur.com/LFzqoJX.jpeg')
								.setStyle(TextInputStyle.Paragraph)
								.setRequired(true)
								.setMaxLength(255),
						),
				);

			interaction.showModal(modal);
		},
		{ userFilterIndex: 1 },
	)
	.setModalResponse(
		async function setCustomTitle(interaction, channelId) {
			const [feed, translator] = await Promise.all([
				FeedConfigModel.findOne({ channelId }),
				Translator.from(interaction),
			]);

			if (!feed)
				return interaction.editReply({ content: translator.getText('invalidChannel') });

			const input = interaction.fields.getTextInputValue('titleInput');
			feed.title = input;
			await feed.save();

			return interaction.reply({
				content: '✅ Título actualizado',
				flags: MessageFlags.Ephemeral,
			});
		},
		{ userFilterIndex: 1 },
	)
	.setModalResponse(
		async function setCustomMaxTags(interaction, channelId) {
			const [feed, translator] = await Promise.all([
				FeedConfigModel.findOne({ channelId }),
				Translator.from(interaction),
			]);

			if (!feed)
				return interaction.editReply({ content: translator.getText('invalidChannel') });

			const input = interaction.fields.getTextInputValue('tagsInput');
			const maxTags = parseInt(input, 10);

			if (Number.isNaN(+maxTags) || maxTags < 0 || maxTags > 50)
				return interaction.reply({
					content: '⚠️ Cantidad inválida. Introduce un número entre 0 y 50',
				});

			feed.maxGeneralTags = maxTags;
			await feed.save();

			return interaction.reply({
				content: '✅ Cantidad de tags máxima actualizada',
				flags: MessageFlags.Ephemeral,
			});
		},
		{ userFilterIndex: 1 },
	)
	.setModalResponse(
		async function setCustomSubtitle(interaction, channelId) {
			const [feed, translator] = await Promise.all([
				FeedConfigModel.findOne({ channelId }),
				Translator.from(interaction),
			]);

			if (!feed)
				return interaction.editReply({ content: translator.getText('invalidChannel') });

			const input = interaction.fields.getTextInputValue('subtitleInput');
			feed.subtitle = input;
			await feed.save();

			return interaction.reply({
				content: '✅ Antetítulo actualizado',
				flags: MessageFlags.Ephemeral,
			});
		},
		{ userFilterIndex: 1 },
	)
	.setModalResponse(
		async function setCustomFooter(interaction, channelId) {
			const [feed, translator] = await Promise.all([
				FeedConfigModel.findOne({ channelId }),
				Translator.from(interaction),
			]);

			if (!feed)
				return interaction.editReply({ content: translator.getText('invalidChannel') });

			const input = interaction.fields.getTextInputValue('footerInput');
			feed.footerText = input;
			await feed.save();

			return interaction.reply({
				content: '✅ Pie de imagen actualizado',
				flags: MessageFlags.Ephemeral,
			});
		},
		{ userFilterIndex: 1 },
	)
	.setModalResponse(
		async function setCustomIcon(interaction, channelId) {
			const [feed, translator] = await Promise.all([
				FeedConfigModel.findOne({ channelId }),
				Translator.from(interaction),
				interaction.deferReply({ flags: MessageFlags.Ephemeral }),
			]);

			if (!feed)
				return interaction.editReply({ content: translator.getText('invalidChannel') });

			const input = interaction.fields.getTextInputValue('iconInput');

			try {
				//Crear embed de prueba para asegurarse de que el enlace sea una imagen válida
				const testEmbed = new EmbedBuilder()
					.setColor(Colors.White)
					.setAuthor({ name: 'Verificando enlace...', iconURL: input });

				const sent = await interaction.channel?.send({ embeds: [testEmbed] });

				setTimeout(() => {
					if (sent?.deletable) sent.delete().catch(console.error);
				}, 1500);

				if (sent?.embeds[0].author?.iconURL) {
					feed.icon = input;
					await feed.save();
				}

				return interaction.editReply({ content: '✅ Ícono actualizado' });
			} catch (error) {
				auditError(error, { brief: 'Ha ocurrido un error al procesar Feed' });
				return interaction.editReply({
					content:
						'⚠️ Enlace inválido. Asegúrate de proveer un enlace completo y directo a la imagen',
				});
			}
		},
		{ userFilterIndex: 1 },
	)
	.setButtonResponse(
		async function removeCustomTitle(interaction, channelId, authorId) {
			const [feed, translator] = await Promise.all([
				FeedConfigModel.findOne({ channelId }),
				Translator.from(interaction),
			]);

			const fetchedChannel = interaction.guild.channels.cache.get(channelId);

			if (!fetchedChannel)
				return interaction.editReply({ content: translator.getText('invalidChannel') });

			if (!feed)
				return interaction.editReply({ content: translator.getText('invalidChannel') });

			await interaction.deferUpdate();

			delete feed.title;
			await feed.save();

			const concludedEmbed = new EmbedBuilder()
				.setColor(Colors.DarkGreen)
				.setAuthor({
					name: wizTitle(translator),
					iconURL: interaction.client.user.displayAvatarURL(),
				})
				.setFooter({ text: 'Operación finalizada' })
				.addFields({
					name: 'Feed personalizado',
					value: `Se ha eliminado el título personalizado del Feed con las tags _"${safeTags(feed.searchTags)}"_ para el canal **${fetchedChannel.name}**`,
				});

			return interaction.update({
				embeds: [concludedEmbed],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId(`feed_selectCustomize_${authorId}`)
							.setLabel('Seguir personalizando')
							.setStyle(ButtonStyle.Primary),
					),
				],
			});
		},
		{ userFilterIndex: 1 },
	)
	.setButtonResponse(
		async function removeCustomTags(interaction, channelId, authorId) {
			const [feed, translator] = await Promise.all([
				FeedConfigModel.findOne({ channelId }),
				Translator.from(interaction),
			]);

			const fetchedChannel = interaction.guild.channels.cache.get(channelId);

			if (!fetchedChannel)
				return interaction.editReply({ content: translator.getText('invalidChannel') });

			if (!feed)
				return interaction.editReply({ content: translator.getText('invalidChannel') });

			await interaction.deferUpdate();

			delete feed.maxGeneralTags;
			await feed.save();

			const concludedEmbed = new EmbedBuilder()
				.setColor(Colors.DarkGreen)
				.setAuthor({
					name: wizTitle(translator),
					iconURL: interaction.client.user.displayAvatarURL(),
				})
				.setFooter({ text: 'Operación finalizada' })
				.addFields({
					name: 'Feed personalizado',
					value: `Se ha restaurado la cantidad de tags máxima por defecto del Feed con las tags _"${safeTags(feed.searchTags)}"_ para el canal **${fetchedChannel.name}**`,
				});
			return interaction.update({
				embeds: [concludedEmbed],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId(`feed_selectCustomize_${authorId}`)
							.setLabel('Seguir personalizando')
							.setStyle(ButtonStyle.Primary),
					),
				],
			});
		},
		{ userFilterIndex: 1 },
	)
	.setButtonResponse(
		async function removeCustomFooter(interaction, channelId, authorId) {
			const [feed, translator] = await Promise.all([
				FeedConfigModel.findOne({ channelId }),
				Translator.from(interaction),
			]);

			const fetchedChannel = interaction.guild.channels.cache.get(channelId);

			if (!fetchedChannel)
				return interaction.editReply({ content: translator.getText('invalidChannel') });

			if (!feed)
				return interaction.editReply({ content: translator.getText('invalidChannel') });

			await interaction.deferUpdate();

			delete feed.subtitle;
			await feed.save();

			const concludedEmbed = new EmbedBuilder()
				.setColor(Colors.DarkGreen)
				.setAuthor({
					name: wizTitle(translator),
					iconURL: interaction.client.user.displayAvatarURL(),
				})
				.setFooter({ text: 'Operación finalizada' })
				.addFields({
					name: 'Feed personalizado',
					value: `Se ha eliminado el subtítulo personalizado del Feed con las tags _"${safeTags(feed.searchTags)}"_ para el canal **${fetchedChannel.name}**`,
				});
			return interaction.update({
				embeds: [concludedEmbed],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId(`feed_selectCustomize_${authorId}`)
							.setLabel('Seguir personalizando')
							.setStyle(ButtonStyle.Primary),
					),
				],
			});
		},
		{ userFilterIndex: 1 },
	)
	.setButtonResponse(
		async function removeCustomFooter(interaction, channelId, authorId) {
			const [feed, translator] = await Promise.all([
				FeedConfigModel.findOne({ channelId }),
				Translator.from(interaction),
			]);

			const fetchedChannel = interaction.guild.channels.cache.get(channelId);

			if (!fetchedChannel)
				return interaction.editReply({ content: translator.getText('invalidChannel') });

			if (!feed)
				return interaction.editReply({ content: translator.getText('invalidChannel') });

			await interaction.deferUpdate();

			delete feed.footerText;
			await feed.save();

			const concludedEmbed = new EmbedBuilder()
				.setColor(Colors.DarkGreen)
				.setAuthor({
					name: wizTitle(translator),
					iconURL: interaction.client.user.displayAvatarURL(),
				})
				.setFooter({ text: 'Operación finalizada' })
				.addFields({
					name: 'Feed personalizado',
					value: `Se ha eliminado el texto de pie personalizado del Feed con las tags _"${safeTags(feed.searchTags)}"_ para el canal **${fetchedChannel.name}**`,
				});
			return interaction.update({
				embeds: [concludedEmbed],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId(`feed_selectCustomize_${authorId}`)
							.setLabel('Seguir personalizando')
							.setStyle(ButtonStyle.Primary),
					),
				],
			});
		},
		{ userFilterIndex: 1 },
	)
	.setButtonResponse(
		async function removeCustomIcon(interaction, channelId, authorId) {
			const [feed, translator] = await Promise.all([
				FeedConfigModel.findOne({ channelId }),
				Translator.from(interaction),
			]);

			const fetchedChannel = interaction.guild.channels.cache.get(channelId);

			if (!fetchedChannel)
				return interaction.editReply({ content: translator.getText('invalidChannel') });

			if (!feed)
				return interaction.editReply({ content: translator.getText('invalidChannel') });

			await interaction.deferUpdate();

			delete feed.icon;
			await feed.save();

			const concludedEmbed = new EmbedBuilder()
				.setColor(Colors.DarkGreen)
				.setAuthor({
					name: wizTitle(translator),
					iconURL: interaction.client.user.displayAvatarURL(),
				})
				.setFooter({ text: 'Operación finalizada' })
				.addFields({
					name: 'Feed personalizado',
					value: `Se ha eliminado el ícono de esquina personalizado del Feed con las tags _"${safeTags(feed.searchTags)}"_ para el canal **${fetchedChannel.name}**`,
				});
			return interaction.update({
				embeds: [concludedEmbed],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId(`feed_selectCustomize_${authorId}`)
							.setLabel('Seguir personalizando')
							.setStyle(ButtonStyle.Primary),
					),
				],
			});
		},
		{ userFilterIndex: 1 },
	)
	.setButtonResponse(
		async function cancelWizard(interaction) {
			const translator = await Translator.from(interaction.user.id);
			const cancelEmbed = new EmbedBuilder()
				.setAuthor({
					name: wizTitle(translator),
					iconURL: interaction.client.user.displayAvatarURL(),
				})
				.setFooter({ text: translator.getText('cancelledStepFooterName') })
				.addFields({
					name: translator.getText('cancelledStepName'),
					value: translator.getText('feedCancelledStep'),
				});
			return interaction.update({
				embeds: [cancelEmbed],
				components: [],
			});
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(
		async function finishWizard(interaction) {
			const translator = await Translator.from(interaction.user.id);
			const cancelEmbed = new EmbedBuilder()
				.setAuthor({
					name: wizTitle(translator),
					iconURL: interaction.client.user.displayAvatarURL(),
				})
				.setFooter({ text: translator.getText('finishedStepFooterName') })
				.setDescription(translator.getText('feedFinishedStep'));
			return interaction.update({
				embeds: [cancelEmbed],
				components: [],
			});
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(async function showFeedImageUrl(interaction) {
		//Función en desuso. Permanece por compatibilidad
		return this.showFeedImageTags(interaction);
	})
	.setButtonResponse(async function showFeedImageTags(interaction, isNotFeed) {
		const translator = await Translator.from(interaction.user.id);

		const url = getPostUrlFromComponents(interaction.message.components);
		if (!url) return interaction.deleteReply();

		await interaction.deferReply({
			flags: MessageFlags.Ephemeral,
		});

		const booru = getMainBooruClient();
		try {
			const post = await booru.fetchPostByUrl(url);
			if (!post) return interaction.deleteReply();

			const postTags = await booru.fetchPostTags(post);

			const postArtistTags = postTags
				.filter((t) => t.type === TagTypes.ARTIST)
				.map((t) => t.name);
			const postCharacterTags = postTags
				.filter((t) => t.type === TagTypes.CHARACTER)
				.map((t) => t.name);
			const postCopyrightTags = postTags
				.filter((t) => t.type === TagTypes.COPYRIGHT)
				.map((t) => t.name);

			const otherTagTypes: TagType[] = [
				TagTypes.ARTIST,
				TagTypes.CHARACTER,
				TagTypes.COPYRIGHT,
			];
			const postOtherTags = postTags
				.filter((t) => !otherTagTypes.includes(t.type))
				.map((t) => t.name);

			const tagEmoji = getBotEmoji('tagAccent');
			const tagsContent = formatTagNameListNew(postOtherTags, ' ');

			const source = post.source;
			const tagsContainer = new ContainerBuilder().setAccentColor(tenshiAltColor);

			if (postArtistTags.length > 0) {
				const artistTagsContent = formatTagNameListNew(postArtistTags, ' ');
				tagsContainer
					.addTextDisplayComponents((textDisplay) =>
						textDisplay.setContent(
							`### ${getBotEmoji('artistTagAccent')} Artistas\n${shortenText(artistTagsContent, 400, '…')}`,
						),
					)
					.addSeparatorComponents((separator) => separator.setDivider(false));
			}
			if (postCharacterTags.length > 0) {
				const characterTagsContent = formatTagNameListNew(postCharacterTags, ' ');
				tagsContainer
					.addTextDisplayComponents((textDisplay) =>
						textDisplay.setContent(
							`### ${getBotEmoji('characterTagAccent')} Personajes\n${shortenText(characterTagsContent, 400, '…')}`,
						),
					)
					.addSeparatorComponents((separator) => separator.setDivider(false));
			}
			if (postCopyrightTags.length > 0) {
				const copyrightTagsContent = formatTagNameListNew(postCopyrightTags, ' ');
				tagsContainer
					.addTextDisplayComponents((textDisplay) =>
						textDisplay.setContent(
							`### ${getBotEmoji('copyrightTagAccent')} Copyright\n${shortenText(copyrightTagsContent, 400, '…')}`,
						),
					)
					.addSeparatorComponents((separator) => separator.setDivider(false));
			}

			tagsContainer
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(
						`### ${tagEmoji} Tags\n-# ${shortenTextLoose(tagsContent, 1520, 1536, '…')}`,
					),
				)
				.addSeparatorComponents((separator) => separator.setDivider(true))
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(
						`### [${getBotEmoji('gelbooruAccent')} **Post**](${url})\n\`\`\`\n${url}\n\`\`\``,
					),
				);

			if (source) {
				tagsContainer.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(
						`### [${getBotEmoji('urlAccent')} **Fuente**](${source})\n\`\`\`\n${source}\n\`\`\``,
					),
				);
			}

			const compressedUserId = compressId(interaction.user.id);
			tagsContainer.addSeparatorComponents((separator) => separator.setDivider(true));

			if (isNotFeed) {
				tagsContainer.addActionRowComponents((actionRow) =>
					actionRow.addComponents(
						new ButtonBuilder()
							.setCustomId(`yo_goToDashboard_${compressedUserId}`)
							.setLabel(translator.getText('goToUserPreferences'))
							.setStyle(ButtonStyle.Primary),
					),
				);
			} else {
				tagsContainer.addActionRowComponents((actionRow) =>
					actionRow.addComponents(
						new ButtonBuilder()
							.setCustomId(`yo_modifyFollowedTags_${compressedUserId}_ALT`)
							.setEmoji(getBotEmojiResolvable('tagWhite'))
							.setLabel(translator.getText('feedSetTagsButtonView'))
							.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
							.setCustomId('feed_editFollowedTags_ADD')
							.setEmoji(getBotEmojiResolvable('tagPlus'))
							.setLabel(translator.getText('feedSetTagsButtonAdd'))
							.setStyle(ButtonStyle.Success),
						new ButtonBuilder()
							.setCustomId('feed_editFollowedTags_REMOVE')
							.setEmoji(getBotEmojiResolvable('tagMinus'))
							.setLabel(translator.getText('feedSetTagsButtonRemove'))
							.setStyle(ButtonStyle.Danger),
					),
				);
			}

			return interaction.editReply({
				flags: MessageFlags.IsComponentsV2,
				components: [tagsContainer],
			});
		} catch (error) {
			console.error(error);
			auditError(error, { brief: 'Ha ocurrido un error al procesar un Post de Feed' });

			if (error instanceof BooruUnknownPostError)
				return interaction.editReply({
					flags: MessageFlags.IsComponentsV2,
					content: translator.getText('feedPostTagsInaccessible'),
				});

			return interaction.editReply({
				flags: MessageFlags.IsComponentsV2,
				content: translator.getText('feedPostTagsUnknownError'),
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

		let title: string;
		if (operation === 'ADD') {
			tagsInput.setLabel(translator.getText('feedEditTagsInputAdd'));
			title = translator.getText('feedEditTagsTitleAdd');
		} else {
			tagsInput.setLabel(translator.getText('feedEditTagsInputRemove'));
			title = translator.getText('feedEditTagsTitleRemove');
		}

		const row = new ActionRowBuilder<TextInputBuilder>().addComponents(tagsInput);

		const modal = new ModalBuilder()
			.setCustomId(`yo_setFollowedTags_${operation}`)
			.setTitle(title)
			.addComponents(row);

		return interaction.showModal(modal).catch(auditError);
	})
	.setButtonResponse(async function deletePost(interaction, manageableBy, isNotFeed) {
		const translator = await Translator.from(interaction.user.id);

		if (manageableBy !== interaction.user.id && isNotModerator(interaction.member))
			return interaction.reply({
				content: translator.getText('unauthorizedInteraction'),
				flags: MessageFlags.Ephemeral,
			});

		const { message } = interaction;
		const url = getPostUrlFromComponents(message.components);
		if (isNotFeed || !url)
			return Promise.all([
				interaction.reply({
					content: `**${translator.getText('feedDeletePostTitle')}**`,
					flags: MessageFlags.Ephemeral,
				}),
				message.delete().catch(console.error),
			]);

		const booru = getMainBooruClient();

		try {
			const post = await booru.fetchPostByUrl(url);
			if (!post)
				return Promise.all([
					interaction.reply({
						content: `${getBotEmoji('gelbooruColor')} **${translator.getText('feedDeletePostTitle')}** <${url}>`,
						flags: MessageFlags.Ephemeral,
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
						name: `${getBotEmoji('tagAccent')} ${translator.getText('feedDeletePostTagsName')}`,
						value: tags,
					},
					{
						name: `${getBotEmoji('urlAccent')} ${translator.getText('feedDeletePostLinkName')}`,
						value: `[Gelbooru](${url})`,
					},
				);
			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId('feed_startWizard')
					.setLabel('Configurar Feeds...')
					.setStyle(ButtonStyle.Primary),
			);

			return Promise.all([
				interaction.reply({
					embeds: [embed],
					components: [row],
					flags: MessageFlags.Ephemeral,
				}),
				message.delete().catch(console.error),
			]);
		} catch (error) {
			console.error(error);
			auditError(error, { brief: 'Ha ocurrido un error al procesar Feed' });

			if (error instanceof BooruUnknownPostError)
				return interaction.reply({
					content: translator.getText('feedDeletePostTagsInaccessible'),
					flags: MessageFlags.Ephemeral,
				});

			return Promise.all([
				interaction.reply({
					content: translator.getText('feedDeletePostTagsUnknownError'),
					flags: MessageFlags.Ephemeral,
				}),
				message.delete().catch(console.error),
			]);
		}
	})
	.setButtonResponse(async function contribute(interaction) {
		const translator = await Translator.from(interaction.user.id);

		const url = getPostUrlFromComponents(interaction.message.components);
		if (!url) return interaction.deleteReply();

		const booru = getMainBooruClient();
		try {
			const post = await booru.fetchPostByUrl(url);
			if (!post) return interaction.deleteReply();

			const requestTags = post.tags.filter(
				(t) => t === 'tagme' || (t !== 'commentary_request' && t.endsWith('_request')),
			);

			if (!requestTags.length) {
				return interaction.reply({
					content: translator.getText('feedContributeNoPendingRequest'),
					flags: MessageFlags.Ephemeral,
				});
			}

			const embed = new EmbedBuilder()
				.setColor(Colors.Gold)
				.setTitle('Contribuye')
				.setDescription(translator.getText('feedContributeDescription'))
				.addFields({
					name: translator.getText('feedContributeTagsName'),
					value: formatTagNameListNew(requestTags, ' '),
				});

			const danbooruCreatorId = '6498';

			if (`${post.creatorId}` === danbooruCreatorId)
				embed.setFooter({ text: translator.getText('feedContributeDanbooruFooter') });

			return interaction.reply({
				embeds: [embed],
				flags: MessageFlags.Ephemeral,
			});
		} catch (error) {
			console.error(error);
			auditError(error, { brief: 'Ha ocurrido un error al procesar un Post de Feed' });

			if (error instanceof BooruUnknownPostError)
				return interaction.reply({
					content: translator.getText('feedPostTagsInaccessible'),
					flags: MessageFlags.Ephemeral,
				});

			return interaction.reply({
				content: translator.getText('feedPostTagsUnknownError'),
				flags: MessageFlags.Ephemeral,
			});
		}
	})
	.setButtonResponse(async function shock(interaction) {
		//No hace nada. Permanece por botones antiguos que ya fueron posteados
		const { member } = interaction;
		if (isNotModerator(member))
			return interaction.reply({
				content: '❌ No tienes permiso para hacer eso, teehee~',
				flags: MessageFlags.Ephemeral,
			});
		return interaction.reply({ content: 'Shock aplicado.', flags: MessageFlags.Ephemeral });
	})
	.setButtonResponse(async function giveFeedback(interaction, type) {
		const translator = await Translator.from(interaction.user);
		//return interaction.reply({ content: translator.getText('feedFeedbackExpired'), flags: MessageFlags.Ephemeral });

		//type = 'Y' | 'N' | 'F'
		if (type === 'Y' || type === 'N') {
			auditAction(`Boorutato • Feedback • ${interaction.user.username}`, {
				name: 'Calificación',
				value: type === 'Y' ? '✅ Satisfecho' : '❌ Insatisfecho',
			});

			return interaction.reply({
				content: translator.getText('feedFeedbackThanks'),
				flags: MessageFlags.Ephemeral,
			});
		}

		if (type !== 'F')
			return interaction.reply({
				content: translator.getText('unknownInteraction'),
				flags: MessageFlags.Ephemeral,
			});

		const modal = new ModalBuilder()
			.setCustomId('feed_sendFeedback')
			.setTitle(translator.getText('feedFeedbackTitle'))
			.setComponents(
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId('feedback')
						.setLabel(translator.getText('feedFeedbackName'))
						.setMinLength(20)
						.setMaxLength(250)
						.setRequired(true)
						.setStyle(TextInputStyle.Paragraph),
				),
			);

		return interaction.showModal(modal);
	})
	.setModalResponse(async function sendFeedback(interaction) {
		const translator = await Translator.from(interaction.user);
		const feedback = interaction.fields.getTextInputValue('feedback');

		auditAction(`Boorutato • Feedback • ${interaction.user.username}`, {
			name: 'Mensaje',
			value: feedback,
		});

		return interaction.reply({
			content: translator.getText('feedFeedbackThanks'),
			flags: MessageFlags.Ephemeral,
		});
	});

export default command;
