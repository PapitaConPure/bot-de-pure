import { addMinutes, getUnixTime, isBefore } from 'date-fns';
import {
	ActionRowBuilder,
	type BaseGuildVoiceChannel,
	ButtonBuilder,
	ButtonStyle,
	type CategoryChannel,
	ChannelType,
	type ColorResolvable,
	Colors,
	ContainerBuilder,
	EmbedBuilder,
	type GuildChannel,
	type GuildMember,
	LabelBuilder,
	MessageFlags,
	ModalBuilder,
	RadioGroupBuilder,
	SeparatorSpacingSize,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';
import type { AnyCommandInteraction, ComplexCommandRequest } from 'types/commands';
import { tenshiColor } from '@/data/globalProps';
import { Translator } from '@/i18n';
import { PureVoiceModel as PureVoice, PureVoiceSessionModel } from '@/models/purevoice.js';
import {
	getFrozenSessionAllowedMembers,
	getOrchestrator,
	makePVSessionName,
	PureVoiceSessionMember,
	PureVoiceSessionMemberRoles,
} from '@/systems/others/purevoice.js';
import { isNotModerator } from '@/utils/discord';
import {
	getBotEmoji,
	getBotEmojiResolvable,
	parseUnicodeEmoji,
} from '@/utils/emojis';
import { compressId, decompressId } from '@/utils/encoding';
import { millisecondsToDuration } from '@/utils/formatting';
import { parseDuration } from '@/utils/parsing';
import { p_pure } from '@/utils/prefixes';
import { Command, CommandOptions, CommandTags } from '../commons';

const cancelbutton = (compressedUserId: string) =>
	new ButtonBuilder()
		.setCustomId(`voz_cancelWizard_${compressedUserId}`)
		.setEmoji(getBotEmojiResolvable('xmarkAccent'))
		.setStyle(ButtonStyle.Secondary);

const warnNotInSession = (interaction: AnyCommandInteraction, translator: Translator) =>
	interaction
		.reply({
			content: translator.getText('voiceSessionJoinExpected', p_pure(interaction).raw),
			flags: MessageFlags.Ephemeral,
		})
		.catch(console.error);

function makeMembersListContainer(
	voiceChannel: BaseGuildVoiceChannel,
	sessionMembers: PureVoiceSessionMember[],
	translator: Translator,
	page: number = 0,
): ContainerBuilder {
	if (Number.isNaN(+page)) page = 0;

	const pageSize = 5;
	const pageCount = Math.ceil(sessionMembers.length / pageSize);
	const finalPage = pageCount - 1;

	if (page > finalPage) page -= pageCount;
	else if (page < 0) page += pageCount;

	const firstItemIndex = page * pageSize;
	const lastItemIndex = firstItemIndex + pageSize - 1;

	const chunk = sessionMembers.slice(firstItemIndex, lastItemIndex + 1);

	const getMemberTypeDisplay = (member: PureVoiceSessionMember) => {
		if (member.isBanned()) return translator.getText('voiceSessionMemberListBanned');

		switch (member.role) {
			case PureVoiceSessionMemberRoles.ADMIN:
				return translator.getText('voiceSessionMemberListAdmin');
			case PureVoiceSessionMemberRoles.MOD:
				return translator.getText('voiceSessionMemberListMod');
			default:
				return translator.getText('voiceSessionMemberListGuest');
		}
	};

	const container = new ContainerBuilder()
		.setAccentColor(tenshiColor)
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(translator.getText('voiceSessionMemberListTitle')),
		)
		.addSeparatorComponents((separator) =>
			separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large),
		);

	for (const sessionMember of chunk) {
		const member = voiceChannel.members.get(sessionMember.id);
		if (!member) continue;

		container
			.addSectionComponents((section) =>
				section
					.addTextDisplayComponents(
						(textDisplay) =>
							textDisplay.setContent(
								`### -# ${getBotEmoji('userAccent')} ${member.displayName} ${getBotEmoji('hashAccent')} \`${member.user.username}\``,
							),
						(textDisplay) =>
							textDisplay.setContent(getMemberTypeDisplay(sessionMember)),
					)
					.setButtonAccessory(
						new ButtonBuilder()
							.setCustomId(`voz_editSessionMember_${compressId(member.id)}_${page}`)
							.setEmoji(getBotEmojiResolvable('pencilWhite'))
							.setStyle(ButtonStyle.Primary),
					),
			)
			.addSeparatorComponents((separator) => separator.setDivider(true));
	}

	const activeMembers = voiceChannel.members.size;
	const totalMembers = sessionMembers.length;
	container
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`voz_sessionMembersNav_${0}_FS`)
					.setEmoji(getBotEmojiResolvable('navFirstAccent'))
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId(`voz_sessionMembersNav_${page - 1}_PV`)
					.setEmoji(getBotEmojiResolvable('navPrevAccent'))
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId('voz_pageCounterDONOTUSE')
					.setLabel(`${page + 1}/${finalPage + 1}`)
					.setDisabled(true)
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId(`voz_sessionMembersNav_${page + 1}_NX`)
					.setEmoji(getBotEmojiResolvable('navNextAccent'))
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId(`voz_sessionMembersNav_${finalPage}_LS`)
					.setEmoji(getBotEmojiResolvable('navLastAccent'))
					.setStyle(ButtonStyle.Secondary),
			),
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`voz_addSessionMember_${page}`)
					.setEmoji(getBotEmojiResolvable('plusWhite'))
					.setLabel(translator.getText('buttonAdd'))
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId(`voz_sessionMembersNav_${page}_RE`)
					.setEmoji(getBotEmojiResolvable('refreshWhite'))
					.setLabel(translator.getText('buttonRefresh'))
					.setStyle(ButtonStyle.Primary),
			),
		)
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(
				`-# ${voiceChannel} • ${translator.getText('voiceSessionMemberListFooter', activeMembers, totalMembers)}`,
			),
		);

	return container;
}

const options = new CommandOptions()
	.addParam('nombre', 'TEXT', 'para decidir el nombre de la sesión actual', { optional: true })
	.addFlag('e', ['emote', 'emoji'], 'para determinar el emote de la sesión actual', {
		name: 'emt',
		type: 'EMOTE',
	})
	.addFlag(
		'aw',
		['asistente', 'instalador', 'wizard'],
		'para inicializar el Asistente de Configuración',
	);

const tags = new CommandTags().add('COMMON');

const command = new Command(
	{
		es: 'voz',
		en: 'voice',
		ja: 'voice',
	},
	tags,
)
	.setAliases('purévoz', 'purevoz', 'voice', 'purévoice', 'purevoice', 'vc')
	.setBriefDescription(
		'Para inyectar un Sistema PuréVoice en una categoria por medio de un Asistente',
	)
	.setLongDescription(
		'Para inyectar un Sistema PuréVoice en una categoria. Simplemente usa el comando y sigue los pasos del Asistente para configurar todo',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const translator = await Translator.fromUser(request);

		//TODO: Mover asistente a p!servidor y eliminar esta bandera
		if (args.hasFlag('asistente')) return generateFirstWizard(request, translator);

		const voiceState = request.member.voice;
		const warnNotInSession = () =>
			request
				.reply({
					content: translator.getText(
						'voiceCommandRenameMemberExpected',
						p_pure(request).raw,
					),
					flags: MessageFlags.Ephemeral,
				})
				.catch(console.error);

		const emoteString = args.flagExprIf('emote', (x) => `${x}`, '💠');
		const sessionEmote = parseUnicodeEmoji(emoteString);
		const sessionName = args.getString('nombre', true);

		if (!sessionName)
			return request.reply({
				content: translator.getText('voiceSessionNameExpected', p_pure(request).raw),
				flags: MessageFlags.Ephemeral,
			});

		if (!voiceState?.channelId) return warnNotInSession();

		if (sessionName.length > 24)
			return request.reply({
				content: translator.getText('voiceSessionNameTooLong'),
				flags: MessageFlags.Ephemeral,
			});

		if (!sessionEmote)
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('voiceSessionRenameInvalidEmoji'),
			});

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceState.channelId });
		if (!session) return warnNotInSession();

		const schemaMember = session.members.get(request.member.id);
		if (!schemaMember) return warnNotInSession();

		const sessionMember = new PureVoiceSessionMember(schemaMember);

		if (sessionMember.isGuest())
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('voiceSessionAdminOrModExpected'),
			});

		const { channelId: voiceId, roleId, nameChangedAt: nameChanged } = session;
		const now = new Date(Date.now());
		const renameUnblockDate = addMinutes(nameChanged ?? new Date(0), 20);

		if (isBefore(now, renameUnblockDate))
			return request.reply({
				content: translator.getText(
					'voiceSessionRenameTooSoon',
					getUnixTime(renameUnblockDate),
				),
			});

		session.nameChangedAt = new Date(Date.now());

		const guildChannels = request.guild.channels.cache;
		const guildRoles = request.guild.roles.cache;

		try {
			await Promise.all([
				session.save(),
				guildChannels
					.get(voiceId)
					?.setName(
						`${sessionEmote}【${sessionName}】`,
						translator.getText('voiceSessionReasonRename'),
					),
				guildRoles
					.get(roleId)
					?.setName(
						`${sessionEmote} ${sessionName}`,
						translator.getText('voiceSessionReasonRename'),
					),
			]);

			return request.reply({
				content: translator.getText('voiceSessionRenameSuccess'),
				flags: MessageFlags.Ephemeral,
			});
		} catch {
			return request.reply({
				content: translator.getText('voiceSessionRenameError'),
				flags: MessageFlags.Ephemeral,
			});
		}
	})
	.setButtonResponse(
		async function startWizard(interaction, authorId) {
			const translator = await Translator.fromUser(interaction);
			const { guild } = interaction;

			const wizard = wizEmbed(
				translator,
				interaction.client.user.displayAvatarURL(),
				Colors.Navy,
			).addFields({
				name: translator.getText('voiceInstallationStartFieldName'),
				value: translator.getText('voiceInstallationStartFieldValue'),
			});

			const pv = await PureVoice.findOne({ guildId: guild.id });
			const row = new ActionRowBuilder<ButtonBuilder>();
			const isInstalled =
				pv
				&& guild.channels.cache.get(pv.categoryId)
				&& guild.channels.cache.get(pv.voiceMakerId);
			if (!isInstalled)
				row.addComponents(
					new ButtonBuilder()
						.setCustomId(`voz_selectInstallation_${authorId}`)
						.setLabel(translator.getText('voiceButtonInstall'))
						.setStyle(ButtonStyle.Primary),
				);
			else
				row.addComponents(
					new ButtonBuilder()
						.setCustomId(`voz_promptRelocateSystem_${authorId}`)
						.setLabel(translator.getText('voiceButtonRelocate'))
						.setStyle(ButtonStyle.Primary),
				);

			row.addComponents(
				new ButtonBuilder()
					.setCustomId(`voz_deleteSystem_${authorId}`)
					.setLabel(translator.getText('voiceButtonUninstall'))
					.setStyle(ButtonStyle.Danger)
					.setDisabled(!isInstalled),
				cancelbutton(authorId),
			);

			return interaction.update({
				embeds: [wizard],
				components: [row],
			});
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(
		async function selectInstallation(interaction, authorId) {
			const translator = await Translator.fromUser(interaction);

			const wizard = wizEmbed(
				translator,
				interaction.client.user.displayAvatarURL(),
				Colors.Gold,
			).addFields({
				name: translator.getText('voiceInstallationSelectFieldName'),
				value: translator.getText('voiceInstallationSelectFieldValue'),
			});

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(`voz_promptInstallSystem_${authorId}_new`)
					.setLabel(translator.getText('voiceInstallationSelectButtonCreateNew'))
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId(`voz_promptInstallSystem_${authorId}`)
					.setLabel(translator.getText('voiceInstallationSelectButtonInject'))
					.setStyle(ButtonStyle.Primary),
				cancelbutton(authorId),
			);

			return interaction.update({
				embeds: [wizard],
				components: [row],
			});
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(
		async function promptInstallSystem(interaction, authorId, createNew) {
			const translator = await Translator.fromUser(interaction);

			const modal = new ModalBuilder()
				.setCustomId(`voz_installSystem_${authorId}${createNew ? `_${createNew}` : ''}`)
				.setTitle(translator.getText('voiceRelocateModalTitle', createNew));

			if (createNew) {
				modal.addLabelComponents((label) =>
					label
						.setLabel(translator.getText('voiceCreateCategoryModalCategoryNameLabel'))
						.setTextInputComponent((selectMenu) =>
							selectMenu
								.setCustomId('categoryName')
								.setMinLength(1)
								.setMaxLength(50)
								.setRequired(true)
								.setStyle(TextInputStyle.Short),
						),
				);
			} else {
				modal.addLabelComponents((label) =>
					label
						.setLabel(translator.getText('voiceModalCategoryLabel'))
						.setChannelSelectMenuComponent((selectMenu) =>
							selectMenu
								.setCustomId('category')
								.setChannelTypes(ChannelType.GuildCategory)
								.setRequired(true),
						),
				);
			}

			return interaction.showModal(modal);
		},
		{ userFilterIndex: 0 },
	)
	.setModalResponse(
		async function installSystem(interaction, _, createNew) {
			const [translator] = await Promise.all([
				Translator.fromUser(interaction),
				interaction.deferReply({ flags: MessageFlags.Ephemeral }),
			]);

			let category: CategoryChannel;
			if (createNew) {
				const categoryName = interaction.fields.getTextInputValue('categoryName');
				category = await interaction.guild.channels.create({
					name: categoryName,
					type: ChannelType.GuildCategory,
					reason: translator.getText('voiceReasonCategoryCreate'),
				});
			} else {
				category = interaction.fields
					.getSelectedChannels('category')
					?.first() as CategoryChannel;
			}

			try {
				const voiceMaker = await interaction.guild.channels.create({
					name: '➕',
					type: ChannelType.GuildVoice,
					parent: category.id,
					bitrate: 64 * 1000,
					userLimit: 1,
					reason: translator.getText('voiceSessionReasonChannelCreate'),
				});

				await voiceMaker.lockPermissions().catch(console.error);
				await voiceMaker.permissionOverwrites
					.edit(interaction.guild.roles.everyone, { SendMessages: false })
					.catch(console.error);
				await voiceMaker.permissionOverwrites
					.edit(interaction.guild.members.me as GuildMember, { SendMessages: true })
					.catch(console.error);

				//Guardar nueva categoría PuréVoice
				const guildQuery = { guildId: interaction.guild.id };
				await PureVoice.deleteOne(guildQuery);
				const pv = new PureVoice({
					...guildQuery,
					categoryId: category.id,
					voiceMakerId: voiceMaker.id,
				});

				const wizard = wizEmbed(
					translator,
					interaction.client.user.displayAvatarURL(),
					Colors.Green,
				).addFields({
					name: translator.getText('voiceCategoryInstalledFieldName'),
					value: translator.getText(
						'voiceCategoryInstalledFieldValue',
						p_pure(interaction.guildId).raw,
					),
				});

				await pv.save();

				return Promise.all([
					interaction.message.edit({
						embeds: [wizard],
						components: [],
					}),
					interaction.editReply({
						content: translator.getText('voiceCategoryInstallSuccess'),
					}),
				]);
			} catch (error) {
				console.error(error);
				return interaction.editReply({
					content: translator.getText('voiceCategoryInstallError'),
				});
			}
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(
		async function promptRelocateSystem(interaction, authorId) {
			const translator = await Translator.fromUser(interaction);

			const guildQuery = { guildId: interaction.guildId };
			const pv = await PureVoice.findOne(guildQuery);

			if (!pv) return interaction.deleteReply();

			const modal = new ModalBuilder()
				.setCustomId(`voz_relocateSystem_${authorId}`)
				.setTitle(translator.getText('voiceRelocateModalTitle'))
				.addLabelComponents((label) =>
					label
						.setLabel(translator.getText('voiceModalCategoryLabel'))
						.setChannelSelectMenuComponent((selectMenu) =>
							selectMenu
								.setCustomId('category')
								.setChannelTypes(ChannelType.GuildCategory)
								.setDefaultChannels(pv.categoryId)
								.setRequired(true),
						),
				);

			return interaction.showModal(modal);
		},
		{ userFilterIndex: 0 },
	)
	.setModalResponse(
		async function relocateSystem(interaction) {
			const translator = await Translator.fromUser(interaction);

			const guildQuery = { guildId: interaction.guildId };
			const pv = await PureVoice.findOne(guildQuery);

			if (!pv) return interaction.deleteReply();

			const channelsCache = interaction.guild.channels.cache;
			const category = interaction.fields
				.getSelectedChannels('category')
				?.first() as CategoryChannel;
			const voiceMaker = channelsCache.get(pv.voiceMakerId) as GuildChannel;
			const controlPanel = channelsCache.get(pv.controlPanelId) as GuildChannel;
			const relocateReason = translator.getText(
				'voiceReasonSystemRelocate',
				interaction.user.username,
			);

			await Promise.all([
				voiceMaker
					&& category
					&& voiceMaker
						.setParent(category, { lockPermissions: true, reason: relocateReason })
						.catch(console.error),
				controlPanel
					&& category
					&& controlPanel.delete(relocateReason).catch(console.error),
			]);

			pv.categoryId = category.id;

			await voiceMaker.permissionOverwrites
				.edit(
					interaction.guild.roles.everyone,
					{ SendMessages: false },
					{ reason: relocateReason },
				)
				.catch(console.error);
			await Promise.all([
				voiceMaker.permissionOverwrites
					.edit(
						interaction.guild.members.me as GuildMember,
						{ SendMessages: true },
						{ reason: relocateReason },
					)
					.catch(console.error),
				pv.save(),
			]);

			const wizard = wizEmbed(
				translator,
				interaction.client.user.displayAvatarURL(),
				Colors.Yellow,
			).addFields({
				name: translator.getText('voiceRelocatedFieldName'),
				value: translator.getText('voiceRelocatedFieldValue'),
			});

			return interaction.update({
				embeds: [wizard],
				components: [],
			});
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(
		async function deleteSystem(interaction, authorId) {
			const translator = await Translator.fromUser(interaction);

			const wizard = wizEmbed(
				translator,
				interaction.client.user.displayAvatarURL(),
				Colors.Yellow,
			).addFields({
				name: translator.getText('voiceUninstallFieldName'),
				value: translator.getText('voiceUninstallFieldValue'),
			});

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(`voz_deleteSystemConfirmed_${authorId}`)
					.setLabel(translator.getText('voiceButtonUninstallConfirm'))
					.setStyle(ButtonStyle.Danger),
				new ButtonBuilder()
					.setCustomId(`voz_startWizard_${authorId}`)
					.setEmoji(getBotEmojiResolvable('navBackAccent'))
					.setStyle(ButtonStyle.Secondary),
				cancelbutton(authorId),
			);

			return interaction.update({
				embeds: [wizard],
				components: [row],
			});
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(
		async function deleteSystemConfirmed(interaction) {
			const guildQuery = { guildId: interaction.guildId };
			const [translator, pv] = await Promise.all([
				Translator.fromUser(interaction),
				PureVoice.findOne(guildQuery),
			]);

			if (!pv) return interaction.deleteReply();

			await interaction.deferUpdate();

			try {
				const guildChannels = interaction.guild.channels.cache;
				await Promise.all([
					guildChannels
						.get(pv.voiceMakerId)
						?.delete(
							translator.getText(
								'voiceReasonSystemRemove',
								interaction.user.username,
							),
						)
						.catch(console.error),
					guildChannels
						.get(pv.controlPanelId)
						?.delete(
							translator.getText(
								'voiceReasonSystemRemove',
								interaction.user.username,
							),
						)
						.catch(console.error),
				]);

				await Promise.all([
					PureVoiceSessionModel.deleteMany({ channelId: { $in: pv.sessions } }),
					PureVoice.deleteOne(guildQuery),
				]);

				const deleteEmbed = wizEmbed(
					translator,
					interaction.client.user.displayAvatarURL(),
					Colors.Red,
				).addFields({
					name: translator.getText('voiceUninstalledFieldName'),
					value: translator.getText('voiceUninstalledFieldValue'),
				});

				return interaction.editReply({
					embeds: [deleteEmbed],
					components: [],
				});
			} catch {
				return interaction.editReply({
					content: null,
				});
			}
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(
		async function cancelWizard(interaction) {
			const translator = await Translator.fromUser(interaction);

			const cancelEmbed = wizEmbed(
				translator,
				interaction.client.user.displayAvatarURL(),
				Colors.NotQuiteBlack,
			).addFields({
				name: translator.getText('cancelledStepName'),
				value: translator.getText('voiceCancelledFieldValue'),
			});

			return interaction.update({
				embeds: [cancelEmbed],
				components: [],
			});
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(async function setSessionName(interaction) {
		const { member } = interaction;
		const translator = await Translator.fromUser(member);

		const voiceChannel = member.voice?.channel;
		if (!voiceChannel) return warnNotInSession(interaction, translator);

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if (!session) return warnNotInSession(interaction, translator);

		const modal = new ModalBuilder()
			.setCustomId(`voz_applySessionName`)
			.setTitle(translator.getText('yoVoiceAutonameModalTitle'))
			.addLabelComponents(
				new LabelBuilder().setLabel(translator.getText('name')).setTextInputComponent(
					new TextInputBuilder()
						.setCustomId('inputName')
						.setPlaceholder(translator.getText('yoVoiceAutonameModalNamingPlaceholder'))
						.setMinLength(1)
						.setMaxLength(24)
						.setRequired(true)
						//.setValue(session.name ?? '')
						.setStyle(TextInputStyle.Short),
				),
				new LabelBuilder().setLabel(translator.getText('emoji')).setTextInputComponent(
					new TextInputBuilder()
						.setCustomId('inputEmoji')
						.setPlaceholder(translator.getText('yoVoiceAutonameModalEmojiPlaceholder'))
						.setMinLength(0)
						.setMaxLength(2)
						.setRequired(false)
						//.setValue(session.emoji ?? '')
						.setStyle(TextInputStyle.Short),
				),
			);

		return interaction.showModal(modal);
	})
	.setModalResponse(async function applySessionName(interaction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const { member } = interaction;
		const translator = await Translator.fromUser(member);

		const warnNotInSession = () =>
			interaction
				.editReply({
					content: translator.getText(
						'voiceSessionJoinExpected',
						p_pure(interaction).raw,
					),
				})
				.catch(console.error);

		const voiceChannel = member.voice?.channel;
		if (!voiceChannel?.id) return warnNotInSession();

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if (!session) return warnNotInSession();

		const name = interaction.fields.getTextInputValue('inputName');
		const emoji = interaction.fields.getTextInputValue('inputEmoji');

		if (!emoji) {
			voiceChannel.setName(makePVSessionName(name)).catch(console.error);
			return interaction.editReply({
				content: translator.getText('voiceSessionRenameSuccess'),
			});
		}

		const defEmoji = parseUnicodeEmoji(emoji);
		if (!defEmoji)
			return interaction.editReply({
				content: translator.getText('voiceSessionRenameInvalidEmoji'),
			});

		voiceChannel.setName(makePVSessionName(name, defEmoji)).catch(console.error);
		return interaction.editReply({ content: translator.getText('voiceSessionRenameSuccess') });
	})
	.setButtonResponse(async function editSessionMembers(interaction) {
		const { member } = interaction;
		const translator = await Translator.fromUser(member);

		const voiceChannel = member.voice?.channel;
		if (!voiceChannel?.id) return warnNotInSession(interaction, translator);

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if (!session) return warnNotInSession(interaction, translator);

		const members = PureVoiceSessionMember.fromSession(session);

		return interaction.reply({
			flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
			components: [makeMembersListContainer(voiceChannel, members, translator)],
		});
	})
	.setButtonResponse(async function sessionMembersNav(interaction, page) {
		const { member } = interaction;
		const translator = await Translator.fromUser(member);

		const voiceChannel = member.voice?.channel;
		if (!voiceChannel?.id) return warnNotInSession(interaction, translator);

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if (!session) return warnNotInSession(interaction, translator);

		const members = PureVoiceSessionMember.fromSession(session);

		return interaction.update({
			components: [makeMembersListContainer(voiceChannel, members, translator, +page)],
		});
	})
	.setButtonResponse(
		async function editSessionMember(interaction, compressedSessionMemberId, page) {
			const translator = await Translator.fromUser(interaction);

			const voiceChannel = interaction.member.voice?.channel;
			if (!voiceChannel?.id) return warnNotInSession(interaction, translator);

			const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
			if (!session) return warnNotInSession(interaction, translator);

			const thisSessionMemberId = interaction.member.id;
			const thisSchemaMember = session.members.get(thisSessionMemberId);
			if (!thisSchemaMember)
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('voiceSessionJoinExpected'),
				});

			const thisSessionMember = new PureVoiceSessionMember(thisSchemaMember);
			if (thisSessionMember.isGuest())
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('voiceSessionAdminOrModExpected'),
				});

			const otherSessionMemberId = decompressId(compressedSessionMemberId);
			const otherSchemaMember = session.members.get(otherSessionMemberId);
			if (!otherSchemaMember)
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('invalidMember'),
				});

			const otherSessionMember = new PureVoiceSessionMember(otherSchemaMember);
			if (thisSessionMember.isAdmin() && thisSessionMemberId === otherSessionMemberId) {
				const modal = new ModalBuilder()
					.setCustomId(`voz_transferSessionAdmin_${page}`)
					.setTitle(translator.getText('voiceSessionMemberEditTransferAdminTitle'))
					.addLabelComponents((label) =>
						label
							.setLabel(
								translator.getText(
									'voiceSessionMemberEditTransferAdminMemberLabel',
								),
							)
							.setUserSelectMenuComponent((select) =>
								select
									.setCustomId('inputMember')
									.addDefaultUsers(
										[...session.members.values()]
											.map((m) => new PureVoiceSessionMember(m))
											.filter((m) => !m.isAdmin() && !m.isBanned())
											.map((m) => m.id),
									)
									.setRequired(true),
							),
					)
					.addTextDisplayComponents(
						(textDisplay) =>
							textDisplay.setContent(
								translator.getText('voiceSessionMemberEditTransferAdminMemberDesc'),
							),
						(textDisplay) =>
							textDisplay.setContent(
								translator.getText('voiceSessionMemberEditTransferAdminDisclaimer'),
							),
					);

				return interaction.showModal(modal);
			}

			const otherIsBanned = otherSessionMember.isBanned();
			const otherIsGuest = otherSessionMember.isGuest();
			const otherIsFreezeImmune = otherSessionMember.isAllowedEvenWhenFreezed();

			if (!otherIsGuest && thisSessionMember.isMod())
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('voiceSessionAdminExpected'),
				});

			const modal = new ModalBuilder()
				.setCustomId(`voz_applyEditSessionMember_${compressedSessionMemberId}_${page}`)
				.setTitle(translator.getText('voiceSessionMemberEditTitle'));

			const radioGroup = new RadioGroupBuilder().setCustomId('inputRole');

			radioGroup.addOptions(
				{
					value: 'guest',
					label: translator.getText('voiceSessionMemberEditGuestLabel'),
					description: translator.getText('voiceSessionMemberEditGuestDesc'),
					default: otherIsGuest && !otherIsFreezeImmune && !otherIsBanned,
				},
				{
					value: 'whitelist',
					label: translator.getText('voiceSessionMemberEditWhitelistedLabel'),
					description: translator.getText('voiceSessionMemberEditWhitelistedDesc'),
					default: otherIsGuest && otherIsFreezeImmune,
				},
			);

			if (thisSessionMember.isAdmin()) {
				radioGroup.addOptions({
					value: 'mod',
					label: translator.getText('voiceSessionMemberEditModLabel'),
					description: translator.getText('voiceSessionMemberEditModDesc'),
					default: !otherIsBanned && otherSessionMember.isMod(),
				});
			}

			radioGroup.addOptions({
				value: 'banned',
				label: translator.getText('voiceSessionMemberEditBannedLabel'),
				description: translator.getText('voiceSessionMemberEditBannedDesc'),
				default: otherIsBanned,
			});

			modal
				.addLabelComponents((label) =>
					label
						.setLabel(translator.getText('voiceSessionMemberEditRoleGroupLabel'))
						.setRadioGroupComponent(radioGroup),
				)
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(
						`${translator.getText('voiceSessionMemberEditFooter')}<@${otherSessionMemberId}>`,
					),
				);

			return interaction.showModal(modal);
		},
	)
	.setModalResponse(async function transferSessionAdmin(interaction, page) {
		const { member: thisMember, guildId } = interaction;

		const translator = await Translator.fromUser(interaction);

		const voiceChannel = thisMember.voice?.channel;
		if (!voiceChannel?.id) return warnNotInSession(interaction, translator);

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if (!session) return warnNotInSession(interaction, translator);

		const thisMemberId = thisMember.id;
		const thisSchemaMember = session.members.get(thisMemberId);
		if (!thisSchemaMember)
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('voiceSessionJoinExpected'),
			});

		const thisSessionMember = new PureVoiceSessionMember(thisSchemaMember);
		if (thisSessionMember.isGuest())
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('voiceSessionAdminOrModExpected'),
			});

		const otherMembers = interaction.fields.getSelectedMembers('inputMember');
		const otherMember = otherMembers?.first();
		if (otherMember == null)
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidInput'),
			});

		const otherMemberId = otherMember.id;
		const otherSchemaMember = session.members.get(otherMemberId);
		if (!otherSchemaMember)
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidMember'),
			});

		const otherSessionMember = new PureVoiceSessionMember(otherSchemaMember);

		if (!thisSessionMember.transferAdmin(otherSessionMember))
			return interaction.editReply({
				content: translator.getText('voiceSessionAdminExpected'),
			});

		session.members.set(thisMemberId, thisSessionMember.toJSON());
		session.members.set(otherMemberId, otherSessionMember.toJSON());
		session.markModified('members');

		const sequentiallyUpdatePerms = async () => {
			await getOrchestrator(guildId).checkMemberPermissions(
				thisMember,
				thisSessionMember,
				voiceChannel,
			);
			await getOrchestrator(guildId).checkMemberPermissions(
				otherMember,
				otherSessionMember,
				voiceChannel,
			);
		};

		await Promise.all([session.save(), sequentiallyUpdatePerms()]);

		const members = PureVoiceSessionMember.fromSession(session);

		return interaction.update({
			components: [makeMembersListContainer(voiceChannel, members, translator, +page)],
		});
	})
	.setModalResponse(
		async function applyEditSessionMember(interaction, compressedSessionMemberId, page) {
			const { member: thisMember, guildId } = interaction;

			const translator = await Translator.fromUser(interaction);

			const voiceChannel = interaction.member.voice?.channel;
			if (!voiceChannel?.id) return warnNotInSession(interaction, translator);

			const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
			if (!session) return warnNotInSession(interaction, translator);

			const thisSessionMemberId = interaction.member.id;
			const thisSchemaMember = session.members.get(thisSessionMemberId);
			if (!thisSchemaMember)
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('voiceSessionJoinExpected'),
				});

			const thisSessionMember = new PureVoiceSessionMember(thisSchemaMember);
			if (thisSessionMember.isGuest())
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('voiceSessionAdminOrModExpected'),
				});

			const otherRole = interaction.fields.getRadioGroup('inputRole');

			if (otherRole === 'mod' && !thisSessionMember.isAdmin())
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('voiceSessionAdminExpected'),
				});

			const otherSessionMemberId = decompressId(compressedSessionMemberId);
			const otherSchemaMember = session.members.get(otherSessionMemberId);
			if (!otherSchemaMember)
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('invalidMember'),
				});

			const otherSessionMember = new PureVoiceSessionMember(otherSchemaMember);

			otherSessionMember.setWhitelisted(otherRole === 'whitelist');
			otherSessionMember.setBanned(otherRole === 'banned');

			if (
				(otherRole === 'guest' || otherRole === 'whitelist')
				&& otherSessionMember.isMod()
				&& !thisSessionMember.revokeMod(otherSessionMember)
			)
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('voiceSessionAdminExpected'),
				});

			if (
				otherRole === 'mod'
				&& !otherSessionMember.isMod()
				&& !thisSessionMember.giveMod(otherSessionMember)
			)
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('voiceSessionAdminExpected'),
				});

			session.members.set(thisSessionMemberId, thisSessionMember.toJSON());
			session.members.set(otherSessionMemberId, otherSessionMember.toJSON());
			session.markModified('members');

			await Promise.all([
				session.save(),
				getOrchestrator(guildId).checkMemberPermissions(
					thisMember,
					thisSessionMember,
					voiceChannel,
				),
			]);

			const members = PureVoiceSessionMember.fromSession(session);

			return interaction.update({
				components: [makeMembersListContainer(voiceChannel, members, translator, +page)],
			});
		},
	)
	.setButtonResponse(async function editSessionKillDelay(interaction) {
		const { member } = interaction;
		const translator = await Translator.fromUser(member);

		const voiceChannel = member.voice?.channel;
		if (!voiceChannel) return warnNotInSession(interaction, translator);

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if (!session) return warnNotInSession(interaction, translator);

		const modal = new ModalBuilder()
			.setCustomId(`voz_applySessionKillDelay`)
			.setTitle(translator.getText('yoVoiceKillDelayModalTitle'))
			.addLabelComponents(
				new LabelBuilder()
					.setLabel(translator.getText('yoVoiceKillDelayModalDelayLabel'))
					.setTextInputComponent(
						new TextInputBuilder()
							.setCustomId('inputDelay')
							.setPlaceholder(
								translator.getText('yoVoiceKillDelayModalDelayPlaceholder'),
							)
							.setMaxLength(10)
							.setRequired(true)
							.setValue(
								session.killDelayMs
									? millisecondsToDuration(session.killDelayMs)
									: '',
							)
							.setStyle(TextInputStyle.Short),
					),
			);

		return interaction.showModal(modal);
	})
	.setModalResponse(async function applySessionKillDelay(interaction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const { member } = interaction;
		const translator = await Translator.fromUser(member);

		const warnNotInSession = () =>
			interaction
				.editReply({
					content: translator.getText(
						'voiceSessionJoinExpected',
						p_pure(interaction).raw,
					),
				})
				.catch(console.error);

		const voiceChannel = member.voice?.channel;
		if (!voiceChannel?.id) return warnNotInSession();

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if (!session) return warnNotInSession();

		const delayStr = interaction.fields.getTextInputValue('inputDelay');
		const delayMs = parseDuration(delayStr);

		session.killDelayMs = delayMs;

		await session.save();

		return interaction.editReply({
			content: translator.getText('voiceSessionKillDelaySuccess'),
		});
	})
	.setButtonResponse(async function freezeSession(interaction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const { member } = interaction;
		const translator = await Translator.fromUser(member);

		const warnNotInSession = () =>
			interaction
				.editReply({
					content: translator.getText('voiceSessionJoinExpected'),
				})
				.catch(console.error);

		const voiceState = member.voice;
		if (!voiceState) return warnNotInSession();

		const voiceChannel = voiceState.channel;
		if (!voiceChannel) return warnNotInSession();

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if (!session) return warnNotInSession();

		const sessionMember = new PureVoiceSessionMember(
			session.members.get(member.id) ?? { id: '' },
		);
		if (sessionMember.isGuest())
			return interaction.editReply({
				content: translator.getText('voiceSessionAdminOrModExpected'),
			});

		session.frozen = !session.frozen;

		const allowedMembers = getFrozenSessionAllowedMembers(voiceChannel, session.members);
		const userLimitReason = `Actualizar límite de usuarios de sesión PuréVoice ${session.frozen ? 'congelada' : 'descongelada'}`;
		const everyone = interaction.guild.roles.everyone;

		if (session.frozen) {
			for (const [memberId, member] of allowedMembers) {
				session.members.set(memberId, member.setWhitelisted(true).toJSON());
				await voiceChannel.permissionOverwrites
					.edit(
						memberId,
						{ Connect: true },
						{
							reason: translator.getText(
								'voiceSessionReasonFreeze',
								interaction.user.username,
							),
						},
					)
					.catch(console.error);
			}

			session.markModified('members');

			await Promise.all([
				voiceChannel
					.setUserLimit(allowedMembers.size, userLimitReason)
					.catch(console.error),
				voiceChannel.permissionOverwrites
					.edit(
						everyone,
						{ Connect: false },
						{
							reason: translator.getText(
								'voiceSessionReasonFreeze',
								interaction.user.username,
							),
						},
					)
					.catch(console.error),
				session.save(),
			]);
		} else {
			await Promise.all([
				voiceChannel.setUserLimit(0, userLimitReason).catch(console.error),
				voiceChannel.permissionOverwrites
					.delete(
						everyone,
						translator.getText('voiceSessionReasonUnfreeze', interaction.user.username),
					)
					.catch(console.error),
			]);

			for (const [memberId, member] of allowedMembers) {
				session.members.set(memberId, member.setWhitelisted(true).toJSON());
				await voiceChannel.permissionOverwrites
					.delete(
						memberId,
						translator.getText('voiceSessionReasonUnfreeze', interaction.user.username),
					)
					.catch(console.error);
			}

			session.markModified('members');
			await session.save();
		}

		return interaction.editReply({
			content: translator.getText(
				'voiceSessionFreezeSuccess',
				`${voiceChannel}`,
				session.frozen,
			),
		});
	})
	.setButtonResponse(async function showMeHow(interaction) {
		const commandName = `${p_pure(interaction.guildId).raw}voz`;
		return interaction.reply({
			content: [
				'Ejemplos:',
				`> ${commandName}  Gaming   --emote  🎮`,
				`> ${commandName}  Noche de Acapella   -e  🎤`,
				`> ${commandName}  --emoji  🎧   Música de Fondo`,
				`> ${commandName}  -e  🎉   Aniversario`,
				'Resultados:',
				`> 🎮【Gaming】`,
				`> 🎤【Noche de Acapella】`,
				`> 🎧【Música de Fondo】`,
				`> 🎉【Aniversario】`,
			].join('\n'),
			flags: MessageFlags.Ephemeral,
		});
	});

function wizEmbed(translator: Translator, iconUrl: string, stepColor: ColorResolvable) {
	return new EmbedBuilder().setColor(stepColor).setAuthor({
		name: translator.getText('voiceWizardAuthorName'),
		iconURL: iconUrl,
	});
}

function generateFirstWizard(request: ComplexCommandRequest, translator: Translator) {
	if (isNotModerator(request.member))
		return request.reply({
			flags: MessageFlags.Ephemeral,
			content: translator.getText('insufficientPermissions'),
		});

	const wizard = wizEmbed(
		translator,
		request.client.user.displayAvatarURL(),
		Colors.Aqua,
	).addFields({
		name: translator.getText('welcome'),
		value: translator.getText('voiceWizardWelcome'),
	});

	const uid = compressId(request.userId);
	return request.reply({
		embeds: [wizard],
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(`voz_startWizard_${uid}`)
					.setLabel(translator.getText('buttonStart'))
					.setStyle(ButtonStyle.Primary),
				cancelbutton(uid),
			),
		],
	});
}

export default command;
