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
import { PureVoiceSessionModel } from '@/models/purevoice';
import {
	getFrozenSessionAllowedMembers,
	getOrchestrator,
	makePVSessionName,
	PureVoiceSessionMember,
	PureVoiceSessionMemberRoles,
} from '@/systems/others/purevoice';
import { getBotEmoji, getBotEmojiResolvable, parseUnicodeEmoji } from '@/utils/emojis';
import { compressId, decompressId } from '@/utils/encoding';
import { millisecondsToDuration } from '@/utils/formatting';
import { parseDuration } from '@/utils/parsing';
import { p_pure } from '@/utils/prefixes';
import { SystemResponses } from '../commons/sysResBuilder';

const system = new SystemResponses('voz')
	.setButtonResponse('setSessionName', async (interaction) => {
		const { member } = interaction;
		const translator = await Translator.fromUser(member);

		const voiceChannel = member.voice?.channel;
		if (!voiceChannel) return warnNotInSession(interaction, translator);

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if (!session) return warnNotInSession(interaction, translator);

		const modal = new ModalBuilder()
			.setCustomId(getPurevoiceCustomId('applySessionName'))
			.setTitle(translator.getText('yoVoiceAutonameModalTitle'))
			.addLabelComponents(
				new LabelBuilder()
					.setLabel(translator.getText('name'))
					.setTextInputComponent(
						new TextInputBuilder()
							.setCustomId('inputName')
							.setPlaceholder(
								translator.getText('yoVoiceAutonameModalNamingPlaceholder'),
							)
							.setMinLength(1)
							.setMaxLength(24)
							.setRequired(true)
							.setStyle(TextInputStyle.Short),
					),
				new LabelBuilder()
					.setLabel(translator.getText('emoji'))
					.setTextInputComponent(
						new TextInputBuilder()
							.setCustomId('inputEmoji')
							.setPlaceholder(
								translator.getText('yoVoiceAutonameModalEmojiPlaceholder'),
							)
							.setMinLength(0)
							.setMaxLength(2)
							.setRequired(false)
							.setStyle(TextInputStyle.Short),
					),
			);

		await interaction.showModal(modal);
	})
	.setModalResponse('applySessionName', async (interaction) => {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const { member } = interaction;
		const translator = await Translator.fromUser(member);

		const voiceChannel = member.voice?.channel;
		if (!voiceChannel?.id) return warnNotInSessionWithEditReply(interaction, translator);

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if (!session) return warnNotInSessionWithEditReply(interaction, translator);

		const name = interaction.fields.getTextInputValue('inputName');
		const emoji = interaction.fields.getTextInputValue('inputEmoji');

		if (!emoji) {
			voiceChannel.setName(makePVSessionName(name)).catch(console.error);
			await interaction.editReply({
				content: translator.getText('voiceSessionRenameSuccess'),
			});
			return;
		}

		const defEmoji = parseUnicodeEmoji(emoji);
		if (!defEmoji) {
			await interaction.editReply({
				content: translator.getText('voiceSessionRenameInvalidEmoji'),
			});
			return;
		}

		voiceChannel.setName(makePVSessionName(name, defEmoji)).catch(console.error);
		await interaction.editReply({ content: translator.getText('voiceSessionRenameSuccess') });
	})
	.setButtonResponse('editSessionMembers', async (interaction) => {
		const { member } = interaction;
		const translator = await Translator.fromUser(member);

		const voiceChannel = member.voice?.channel;
		if (!voiceChannel?.id) return warnNotInSession(interaction, translator);

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if (!session) return warnNotInSession(interaction, translator);

		const members = PureVoiceSessionMember.fromSession(session);

		await interaction.reply({
			flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
			components: [makeMembersListContainer(voiceChannel, members, translator)],
		});
	})
	.setButtonResponse('sessionMembersNav', async (interaction, page) => {
		const { member } = interaction;
		const translator = await Translator.fromUser(member);

		const voiceChannel = member.voice?.channel;
		if (!voiceChannel?.id) return warnNotInSession(interaction, translator);

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if (!session) return warnNotInSession(interaction, translator);

		const members = PureVoiceSessionMember.fromSession(session);

		await interaction.update({
			components: [makeMembersListContainer(voiceChannel, members, translator, +page)],
		});
	})
	.setButtonResponse('addSessionMember', async (interaction, page) => {
		const { member } = interaction;
		const translator = await Translator.fromUser(member);

		const voiceChannel = member.voice?.channel;
		if (!voiceChannel?.id) return warnNotInSession(interaction, translator);

		const session = await PureVoiceSessionModel.exists({ channelId: voiceChannel.id });
		if (!session) return warnNotInSession(interaction, translator);

		const modal = new ModalBuilder()
			.setCustomId(getPurevoiceCustomId('addSessionMemberFinish', page))
			.setTitle(translator.getText('voiceSessionMemberAddModalTitle'))
			.addLabelComponents((label) =>
				label
					.setLabel(translator.getText('voiceSessionMemberAddModalMemberLabel'))
					.setUserSelectMenuComponent((select) =>
						select
							.setCustomId('inputMember')
							.setPlaceholder(
								translator.getText('voiceSessionMemberAddModalMemberPlaceholder'),
							),
					),
			);

		await interaction.showModal(modal);
	})
	.setModalResponse('addSessionMemberFinish', async (interaction, page) => {
		const { member } = interaction;
		const translator = await Translator.fromUser(member);

		const voiceChannel = member.voice?.channel;
		if (!voiceChannel?.id) return warnNotInSession(interaction, translator);

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if (!session) return warnNotInSession(interaction, translator);

		const otherMember = interaction.fields.getSelectedMembers('inputMember')?.first();
		if (otherMember == null) {
			await interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidMember'),
			});
			return;
		}

		if (session.members.has(otherMember.id)) {
			await interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('voiceSessionMemberAddAlreadyExists', otherMember.id),
			});
			return;
		}

		await interaction.deferUpdate();

		const newSessionMember = new PureVoiceSessionMember({
			id: otherMember.id,
			role: PureVoiceSessionMemberRoles.GUEST,
			whitelisted: true,
		});

		session.members.set(otherMember.id, newSessionMember.toJSON());

		await session.save();

		const members = PureVoiceSessionMember.fromSession(session);

		await interaction.editReply({
			components: [makeMembersListContainer(voiceChannel, members, translator, +page)],
		});
	})
	.setButtonResponse(
		'editSessionMember',
		async (interaction, compressedSessionMemberId, page) => {
			const { member } = interaction;
			const translator = await Translator.fromUser(interaction);

			const voiceChannel = member.voice?.channel;
			if (!voiceChannel?.id) return warnNotInSession(interaction, translator);

			const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
			if (!session) return warnNotInSession(interaction, translator);

			const thisSessionMemberId = member.id;
			const thisSchemaMember = session.members.get(thisSessionMemberId);
			if (!thisSchemaMember) {
				await interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText(
						'voiceSessionJoinExpected',
						p_pure(interaction).raw,
					),
				});
				return;
			}

			const thisSessionMember = new PureVoiceSessionMember(thisSchemaMember);
			if (thisSessionMember.isGuest()) {
				await interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('voiceSessionAdminOrModExpected'),
				});
				return;
			}

			const otherSessionMemberId = decompressId(compressedSessionMemberId);
			const otherSchemaMember = session.members.get(otherSessionMemberId);
			if (!otherSchemaMember) {
				await interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('invalidMember'),
				});
				return;
			}

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

				await interaction.showModal(modal);
				return;
			}

			const otherIsBanned = otherSessionMember.isBanned();
			const otherIsGuest = otherSessionMember.isGuest();
			const otherIsFreezeImmune = otherSessionMember.isAllowedEvenWhenFreezed();

			if (!otherIsGuest && thisSessionMember.isMod()) {
				await interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('voiceSessionAdminExpected'),
				});
				return;
			}

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

			await interaction.showModal(modal);
		},
	)
	.setModalResponse('transferSessionAdmin', async (interaction, page) => {
		const { member: thisMember, guildId } = interaction;
		const translator = await Translator.fromUser(interaction);

		const voiceChannel = thisMember.voice?.channel;
		if (!voiceChannel?.id) return warnNotInSession(interaction, translator);

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if (!session) return warnNotInSession(interaction, translator);

		const thisMemberId = thisMember.id;
		const thisSchemaMember = session.members.get(thisMemberId);
		if (!thisSchemaMember) {
			await interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText(
					'voiceSessionJoinExpected',
					p_pure(interaction).raw,
					p_pure(interaction).raw,
				),
			});
			return;
		}

		const thisSessionMember = new PureVoiceSessionMember(thisSchemaMember);
		if (thisSessionMember.isGuest()) {
			await interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('voiceSessionAdminOrModExpected'),
			});
			return;
		}

		const otherMembers = interaction.fields.getSelectedMembers('inputMember');
		const otherMember = otherMembers?.first();
		if (otherMember == null) {
			await interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidInput'),
			});
			return;
		}

		const otherMemberId = otherMember.id;
		const otherSchemaMember = session.members.get(otherMemberId);
		if (!otherSchemaMember) {
			await interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidMember'),
			});
			return;
		}

		const otherSessionMember = new PureVoiceSessionMember(otherSchemaMember);

		if (!thisSessionMember.transferAdmin(otherSessionMember)) {
			await interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('voiceSessionAdminExpected'),
			});
			return;
		}

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

		await interaction.update({
			components: [makeMembersListContainer(voiceChannel, members, translator, +page)],
		});
	})
	.setModalResponse(
		'applyEditSessionMember',
		async (interaction, compressedSessionMemberId, page) => {
			const { member: thisMember, guildId } = interaction;

			const translator = await Translator.fromUser(interaction);

			const voiceChannel = interaction.member.voice?.channel;
			if (!voiceChannel?.id) return warnNotInSession(interaction, translator);

			const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
			if (!session) return warnNotInSession(interaction, translator);

			const thisSessionMemberId = interaction.member.id;
			const thisSchemaMember = session.members.get(thisSessionMemberId);
			if (!thisSchemaMember) {
				await interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText(
						'voiceSessionJoinExpected',
						p_pure(interaction).raw,
					),
				});
				return;
			}

			const thisSessionMember = new PureVoiceSessionMember(thisSchemaMember);
			if (thisSessionMember.isGuest()) {
				await interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('voiceSessionAdminOrModExpected'),
				});
				return;
			}

			const otherRole = interaction.fields.getRadioGroup('inputRole');

			if (otherRole === 'mod' && !thisSessionMember.isAdmin()) {
				await interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('voiceSessionAdminExpected'),
				});
				return;
			}

			const otherSessionMemberId = decompressId(compressedSessionMemberId);
			const otherSchemaMember = session.members.get(otherSessionMemberId);
			if (!otherSchemaMember) {
				await interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('invalidMember'),
				});
				return;
			}

			const otherSessionMember = new PureVoiceSessionMember(otherSchemaMember);

			otherSessionMember.setWhitelisted(otherRole === 'whitelist');
			otherSessionMember.setBanned(otherRole === 'banned');

			if (
				(otherRole === 'guest' || otherRole === 'whitelist')
				&& otherSessionMember.isMod()
				&& !thisSessionMember.revokeMod(otherSessionMember)
			) {
				await interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('voiceSessionAdminExpected'),
				});
				return;
			}

			if (
				otherRole === 'mod'
				&& !otherSessionMember.isMod()
				&& !thisSessionMember.giveMod(otherSessionMember)
			) {
				await interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('voiceSessionAdminExpected'),
				});
				return;
			}

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

			await interaction.update({
				components: [makeMembersListContainer(voiceChannel, members, translator, +page)],
			});
		},
	)
	.setButtonResponse('editSessionKillDelay', async (interaction) => {
		const { member } = interaction;
		const translator = await Translator.fromUser(member);

		const voiceChannel = member.voice?.channel;
		if (!voiceChannel) return warnNotInSession(interaction, translator);

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if (!session) return warnNotInSession(interaction, translator);

		const modal = new ModalBuilder()
			.setCustomId(getPurevoiceCustomId('applySessionKillDelay'))
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

		await interaction.showModal(modal);
	})
	.setModalResponse('applySessionKillDelay', async (interaction) => {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const { member } = interaction;
		const translator = await Translator.fromUser(member);

		const voiceChannel = member.voice?.channel;
		if (!voiceChannel?.id) return warnNotInSessionWithEditReply(interaction, translator);

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if (!session) return warnNotInSessionWithEditReply(interaction, translator);

		const delayStr = interaction.fields.getTextInputValue('inputDelay');
		const delayMs = parseDuration(delayStr);

		session.killDelayMs = delayMs;

		await session.save();

		await interaction.editReply({
			content: translator.getText('voiceSessionKillDelaySuccess'),
		});
	})
	.setButtonResponse('freezeSession', async (interaction) => {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const { member } = interaction;
		const translator = await Translator.fromUser(member);

		const voiceState = member.voice;
		if (!voiceState) return warnNotInSessionWithEditReply(interaction, translator);

		const voiceChannel = voiceState.channel;
		if (!voiceChannel) return warnNotInSessionWithEditReply(interaction, translator);

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if (!session) return warnNotInSessionWithEditReply(interaction, translator);

		const sessionMember = new PureVoiceSessionMember(
			session.members.get(member.id) ?? { id: '' },
		);
		if (sessionMember.isGuest()) {
			await interaction.editReply({
				content: translator.getText('voiceSessionAdminOrModExpected'),
			});
			return;
		}

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

		await interaction.editReply({
			content: translator.getText(
				'voiceSessionFreezeSuccess',
				`${voiceChannel}`,
				session.frozen,
			),
		});
	})
	.setButtonResponse('showMeHow', async (interaction) => {
		const commandName = `${p_pure(interaction.guildId).raw}voz`;
		await interaction.reply({
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

async function warnNotInSession(interaction: AnyCommandInteraction, translator: Translator) {
	await interaction
		.reply({
			content: translator.getText('voiceSessionJoinExpected', p_pure(interaction).raw),
			flags: MessageFlags.Ephemeral,
		})
		.catch(console.error);
}

async function warnNotInSessionWithEditReply(
	interaction: AnyCommandInteraction,
	translator: Translator,
) {
	await interaction
		.editReply({
			content: translator.getText('voiceSessionJoinExpected', p_pure(interaction).raw),
		})
		.catch(console.error);
}

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
		const member = voiceChannel.guild.members.cache.get(sessionMember.id);
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
							.setCustomId(
								getPurevoiceCustomId(
									'editSessionMember',
									compressId(member.id),
									page,
								),
							)
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
					.setCustomId(getPurevoiceCustomId('sessionMembersNav', 0, 'FS'))
					.setEmoji(getBotEmojiResolvable('navFirstAccent'))
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId(getPurevoiceCustomId('sessionMembersNav', page - 1, 'PV'))
					.setEmoji(getBotEmojiResolvable('navPrevAccent'))
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId('!voz_pageCounterDONOTUSE')
					.setLabel(`${page + 1}/${finalPage + 1}`)
					.setDisabled(true)
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId(getPurevoiceCustomId('sessionMembersNav', page + 1, 'NX'))
					.setEmoji(getBotEmojiResolvable('navNextAccent'))
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId(getPurevoiceCustomId('sessionMembersNav', finalPage, 'LS'))
					.setEmoji(getBotEmojiResolvable('navLastAccent'))
					.setStyle(ButtonStyle.Secondary),
			),
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new ButtonBuilder()
					.setCustomId(getPurevoiceCustomId('addSessionMember', page))
					.setEmoji(getBotEmojiResolvable('plusWhite'))
					.setLabel(translator.getText('buttonAdd'))
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId(getPurevoiceCustomId('sessionMembersNav', page, 'RE'))
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

export const getPurevoiceCustomId = system.customIdGetter;

export default system;
