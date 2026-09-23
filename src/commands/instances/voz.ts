import { addMinutes, getUnixTime, isBefore } from 'date-fns';
import {
	type BaseGuildVoiceChannel,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	LabelBuilder,
	MessageFlags,
	ModalBuilder,
	RadioGroupBuilder,
	SeparatorSpacingSize,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';
import type { AnyCommandInteraction } from 'types/commands';
import { tenshiColor } from '@/data/globalProps';
import { Translator } from '@/i18n';
import { PureVoiceSessionModel } from '@/models/purevoice.js';
import {
	getFrozenSessionAllowedMembers,
	getOrchestrator,
	makePVSessionName,
	PureVoiceSessionMember,
	PureVoiceSessionMemberRoles,
} from '@/systems/others/purevoice.js';
import { getBotEmoji, getBotEmojiResolvable, parseUnicodeEmoji } from '@/utils/emojis';
import { compressId, decompressId } from '@/utils/encoding';
import { millisecondsToDuration } from '@/utils/formatting';
import { parseDuration } from '@/utils/parsing';
import { p_pure } from '@/utils/prefixes';
import { Command, CommandOptions, CommandTags } from '../commons';

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
	});

const tags = new CommandTags().add('COMMON');

const command = new Command(
	{
		es: 'voz',
		en: 'voice',
		ja: 'voice',
	},
	tags,
)
	.setAliases('purévoz', 'purevoz', 'purévoice', 'purevoice', 'vc')
	.setDescription('Permite manipular sesiones de voz del sistema PuréVoice')
	.setOptions(options)
	.setExecution(async (request, args) => {
		const translator = await Translator.fromUser(request);

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

export default command;
