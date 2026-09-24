import { BooruUnknownPostError, type TagType, TagTypes } from '@papitaconpure/booru-client';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Colors,
	ContainerBuilder,
	EmbedBuilder,
	MessageFlags,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';
import { tenshiAltColor } from '@/data/globalProps';
import { Translator } from '@/i18n';
import { getMainBooruClient } from '@/systems/booru/booruclient';
import { formatTagNameList, getPostUrlFromComponents } from '@/systems/booru/boorusend.js';
import { auditError } from '@/systems/others/auditor';
import { isNotModerator } from '@/utils/discord';
import { getBotEmoji, getBotEmojiResolvable } from '@/utils/emojis';
import { compressId } from '@/utils/encoding';
import { shortenText, shortenTextLoose } from '@/utils/misc';
import { Command, CommandPermissions, CommandTags } from '../commons';

const perms = new CommandPermissions()
	.requireAnyOf(['ManageGuild', 'ManageChannels'])
	.requireAnyOf('ManageMessages');

//TODO: how should I implement a way to have button responses without a Command
const tags = new CommandTags().add('COMMON', 'MOD', 'OUTDATED');

const command = new Command('feed', tags)
	.setBriefDescription('Inicializa un Feed en un canal por medio de un Asistente.')
	.setLongDescription(
		'Inicializa un Feed de imágenes en un canal. Simplemente usa el comando y sigue los pasos del Asistente para configurar y personalizar todo',
	)
	.setPermissions(perms)
	.setExecution(async (request) => {
		return request.reply({ content: '🍃' });
	})
	.setButtonResponse(async function showFeedImageTags(interaction, isNotFeed) {
		const translator = await Translator.fromUser(interaction.user.id);

		const url = getPostUrlFromComponents(interaction.message.components);
		if (!url) return interaction.deleteReply();

		await interaction.deferReply({
			flags: MessageFlags.Ephemeral,
		});

		const booru = getMainBooruClient();
		if (!booru)
			return interaction.editReply({
				content: translator.getText('missingBooruCredentials'),
			});

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
			const tagsContent = formatTagNameList(postOtherTags, ' ');

			const source = post.source;
			const tagsContainer = new ContainerBuilder().setAccentColor(tenshiAltColor);

			if (postArtistTags.length > 0) {
				const artistTagsContent = formatTagNameList(postArtistTags, ' ');
				tagsContainer
					.addTextDisplayComponents((textDisplay) =>
						textDisplay.setContent(
							`### ${getBotEmoji('artistTagAccent')} Artistas\n${shortenText(artistTagsContent, 400, '…')}`,
						),
					)
					.addSeparatorComponents((separator) => separator.setDivider(false));
			}
			if (postCharacterTags.length > 0) {
				const characterTagsContent = formatTagNameList(postCharacterTags, ' ');
				tagsContainer
					.addTextDisplayComponents((textDisplay) =>
						textDisplay.setContent(
							`### ${getBotEmoji('characterTagAccent')} Personajes\n${shortenText(characterTagsContent, 400, '…')}`,
						),
					)
					.addSeparatorComponents((separator) => separator.setDivider(false));
			}
			if (postCopyrightTags.length > 0) {
				const copyrightTagsContent = formatTagNameList(postCopyrightTags, ' ');
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
		const translator = await Translator.fromUser(interaction.user.id);

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
	.setGlobalButtonResponse(async function deletePost(interaction, manageableBy, isNotFeed) {
		const translator = await Translator.fromUser(interaction.user.id);

		if (
			interaction.inCachedGuild()
			&& manageableBy !== interaction.user.id
			&& isNotModerator(interaction.member)
		)
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
		if (!booru)
			return interaction.editReply({
				content: translator.getText('missingBooruCredentials'),
			});

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
					.setCustomId('feed_goToFeedWizard')
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
		const translator = await Translator.fromUser(interaction.user.id);

		const url = getPostUrlFromComponents(interaction.message.components);
		if (!url) return interaction.deleteReply();

		const booru = getMainBooruClient();
		if (!booru)
			return interaction.editReply({
				content: translator.getText('missingBooruCredentials'),
			});

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
					value: formatTagNameList(requestTags, ' '),
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
	});

export default command;
