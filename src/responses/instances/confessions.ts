import { hoursToMinutes } from 'date-fns';
import {
	type AnyThreadChannel,
	type APISectionComponent,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	Colors,
	ComponentType,
	ContainerBuilder,
	DiscordAPIError,
	FileBuilder,
	type Interaction,
	MediaGalleryBuilder,
	MessageFlags,
	ModalBuilder,
	SectionBuilder,
	SeparatorSpacingSize,
	type TextChannel,
	TextDisplayBuilder,
	TextInputStyle,
} from 'discord.js';
import type { AnyCommandInteraction } from 'types/commands';
import { CommandPermissions } from '@/commands/commons';
import { Translator } from '@/i18n';
import ConfessionSystemModel from '@/models/confessionSystems';
import PendingConfessionModel from '@/models/pendingConfessions';
import { auditError } from '@/systems/others/auditor';
import { DiscordAgent } from '@/utils/discordagent';
import { getBotEmojiResolvable } from '@/utils/emojis';
import { compressId, decompressId } from '@/utils/encoding';
import { fetchGuildMembers } from '@/utils/guildratekeeper';
import { SystemResponses } from '../commons/sysResBuilder';

const auditPermissions = new CommandPermissions()
	.requireAnyOf('ManageMessages')
	.requireAnyOf(['ModerateMembers', 'ManageGuild']);

const timeoutPermissions = CommandPermissions.from(auditPermissions).requireAnyOf([
	'ModerateMembers',
	'KickMembers',
	'BanMembers',
]);

const banPermissions = CommandPermissions.from(auditPermissions).requireAnyOf('BanMembers');

const system = new SystemResponses('conf')
	.setButtonResponse('confess', async (interaction) => {
		const translator = await Translator.fromUser(interaction);

		const modal = new ModalBuilder()
			.setCustomId(getConfessionsCustomId('confessionFilled'))
			.setTitle(translator.getText('confessionConfessModalTitle'))
			.addLabelComponents(
				(label) =>
					label
						.setLabel(translator.getText('confessionConfessModalContentLabel'))
						.setTextInputComponent((textInput) =>
							textInput
								.setCustomId('inputContent')
								.setMinLength(1)
								.setMaxLength(1000)
								.setStyle(TextInputStyle.Paragraph),
						),
				(label) =>
					label
						.setLabel(translator.getText('confessionConfessModalAnonymousLabel'))
						.setCheckboxComponent((checkbox) =>
							checkbox.setCustomId('inputAnonymous').setDefault(true),
						),
			)
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(translator.getText('confessionConfessModalNotice')),
			);

		await interaction.showModal(modal);
	})
	.setModalResponse('confessionFilled', async (interaction) => {
		const [translator, guildTranslator] = await Translator.from(interaction);

		const data = await getConfessionSystemAndChannels(interaction, translator);
		if (data.success === false) {
			await interaction.reply({ content: data.message, flags: MessageFlags.Ephemeral });
			return;
		}

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const { confSystem, logChannel } = data;

		const confContent = interaction.fields.getTextInputValue('inputContent');
		const isAnonymous = interaction.fields.getCheckbox('inputAnonymous');
		const userId = compressId(interaction.user.id);
		const confId = compressId(interaction.id);
		const pendingConf = new PendingConfessionModel({
			id: confId,
			channelId: confSystem.confessionsChannelId,
			content: confContent,
			anonymous: isAnonymous,
		});
		confSystem.pending[confSystem.pending.length] = confId;
		confSystem.markModified('pending');

		const auditContainer = new ContainerBuilder()
			.setAccentColor(0x8334eb)
			.addTextDisplayComponents(
				(textDisplay) =>
					textDisplay.setContent(guildTranslator.getText('confessionAuditSubtitle')),
				(textDisplay) =>
					textDisplay.setContent(
						guildTranslator.getText(
							isAnonymous
								? 'confessionAuditAnonTitle'
								: 'confessionAuditNonAnonTitle',
						),
					),
			)
			.addSeparatorComponents((separator) => separator.setDivider(true))
			.addTextDisplayComponents(
				(textDisplay) =>
					textDisplay.setContent(guildTranslator.getText('confessionAuditContentName')),
				(textDisplay) => textDisplay.setContent(`${confContent}`),
			)
			.addSeparatorComponents((separator) =>
				separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large),
			)
			.addActionRowComponents((actionRow) =>
				actionRow.addComponents(
					new ButtonBuilder()
						.setCustomId(getConfessionsCustomId('acceptConfession', confId, userId))
						.setEmoji(getBotEmojiResolvable('checkmarkWhite'))
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId(getConfessionsCustomId('rejectConfession', confId))
						.setEmoji(getBotEmojiResolvable('xmarkAccent'))
						.setStyle(ButtonStyle.Secondary),
					new ButtonBuilder()
						.setCustomId(getConfessionsCustomId('timeoutConfessant', confId, userId))
						.setEmoji(getBotEmojiResolvable('xmarkWhite'))
						.setLabel(guildTranslator.getText('confessionAuditButtonTimeout'))
						.setStyle(ButtonStyle.Danger),
					new ButtonBuilder()
						.setCustomId(getConfessionsCustomId('banConfessant', confId, userId))
						.setEmoji(getBotEmojiResolvable('xmarkWhite'))
						.setLabel(guildTranslator.getText('confessionAuditButtonBan'))
						.setStyle(ButtonStyle.Danger),
				),
			);

		await delegateConfessionSystemTasks(
			confSystem.save().then(() => pendingConf.save()),
			logChannel.send({ flags: MessageFlags.IsComponentsV2, components: [auditContainer] }),
		);

		const confirmationContainer = new ContainerBuilder()
			.setAccentColor(Colors.Green)
			.addTextDisplayComponents(
				(textDisplay) =>
					textDisplay.setContent(translator.getText('confessionConfessSuccessSubtitle')),
				(textDisplay) =>
					textDisplay.setContent(translator.getText('confessionConfessSuccessTitle')),
				(textDisplay) =>
					textDisplay.setContent(
						translator.getText('confessionConfessSuccessDescription'),
					),
			)
			.addSeparatorComponents((separator) => separator.setDivider(true))
			.addTextDisplayComponents(
				(textDisplay) =>
					textDisplay.setContent(
						translator.getText('confessionConfessSuccessExplanationName'),
					),
				(textDisplay) =>
					textDisplay.setContent(
						translator.getText(
							'confessionConfessSuccessExplanationDescription',
							isAnonymous,
						),
					),
				(textDisplay) =>
					textDisplay.setContent(
						translator.getText('confessionConfessSuccessNoticeName'),
					),
				(textDisplay) =>
					textDisplay.setContent(
						translator.getText('confessionConfessSuccessNoticeDescription'),
					),
			);

		await interaction.editReply({
			flags: MessageFlags.IsComponentsV2,
			components: [confirmationContainer],
		});
	})
	.setButtonResponse(
		'acceptConfession',
		async (interaction, confId, userId, messageId) => {
			const [translator, guildTranslator] = await Translator.from(interaction);
			const data = await getConfessionSystemAndChannels(interaction, translator);
			if (data.success === false) {
				console.log('Unsuccessful Confessions fetch.');
				console.log({ data });
				await interaction.reply({ content: data.message, flags: MessageFlags.Ephemeral });
				return;
			}

			await interaction.deferUpdate();

			const { confSystem, confChannel } = data;

			const confession = await PendingConfessionModel.findOne({ id: confId });
			if (!confession) {
				console.log('Confession already answered.');
				await interaction.editReply({
					components: [
						remakeContainerBuilderWithoutActions(interaction).addTextDisplayComponents(
							(textDisplay) =>
								textDisplay.setContent(
									guildTranslator.getText(
										'confessionRequestAlreadyAnsweredFooter',
									),
								),
						),
					],
				});
				return;
			}

			if (messageId) {
				const actualMessageId = decompressId(messageId);
				const message = await confChannel.messages.fetch(actualMessageId);
				const thread = message.hasThread
					? (message.thread as AnyThreadChannel)
					: await message.startThread({
							name: guildTranslator.getText('confessionRepliesThreadName'),
							reason: guildTranslator.getText('confessionRepliesThreadReason'),
						});

				const agent = await new DiscordAgent().setup(thread);
				agent.setUser(interaction.client.user);

				await agent.sendAsUser({
					username:
						confession.pseudonym
						?? guildTranslator.getText('confessionAnonReplyUsernameDefault'),
					content: `${confession.content}`,
				});
			} else {
				let confessionEpigraph: string;
				const confessionSection = new SectionBuilder();
				const confessionContainer = new ContainerBuilder()
					.setAccentColor(0x8334eb)
					.addSectionComponents(confessionSection);
				const replyButton = new ButtonBuilder()
					.setCustomId(getConfessionsCustomId('promptReplyAnon'))
					.setEmoji(getBotEmojiResolvable('replyAccent'))
					.setStyle(ButtonStyle.Secondary);

				if (confession.anonymous) {
					confessionEpigraph = guildTranslator.getText('confessionMessageAnonEpigraph');
					replyButton.setLabel(
						guildTranslator.getText('confessionMessageButtonReplyShort'),
					);
					confessionSection.setButtonAccessory(replyButton);
				} else {
					await fetchGuildMembers(interaction.guild);
					const confessantId = decompressId(userId);
					const confessant = interaction.guild.members.cache.get(confessantId);

					if (confessant) {
						confessionEpigraph = guildTranslator.getText(
							'confessionMessageNonAnonEpigraph',
							confessant.id,
						);
						confessionSection.setThumbnailAccessory((accessory) =>
							accessory.setURL(confessant.displayAvatarURL({ size: 256 })),
						);
						replyButton.setLabel(
							guildTranslator.getText('confessionMessageButtonReplyLong'),
						);
						confessionContainer.addActionRowComponents((actionRow) =>
							actionRow.setComponents(replyButton),
						);
					} else {
						confessionEpigraph = guildTranslator.getText(
							'confessionMessageNonAnonErrorEpigraph',
						);
						replyButton.setLabel(
							guildTranslator.getText('confessionMessageButtonReplyShort'),
						);
						confessionSection.setButtonAccessory(replyButton);
					}
				}

				confessionSection.addTextDisplayComponents(
					(textDisplay) => textDisplay.setContent(confessionEpigraph),
					(textDisplay) => textDisplay.setContent(confession.content),
				);

				await confChannel.send({
					flags: MessageFlags.IsComponentsV2,
					components: [confessionContainer],
				});
			}

			confSystem.pending = confSystem.pending.filter((p) => p !== confId);
			confSystem.markModified('pending');

			await delegateConfessionSystemTasks(confSystem.save(), confession.deleteOne());

			const container = new ContainerBuilder()
				.setAccentColor(0x32e698)
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(
						guildTranslator.getText(
							'confessionAuditAcceptDescription',
							!!messageId,
							interaction.user.id,
							confChannel.id,
						),
					),
				);

			await interaction.editReply({ components: [container] });
		},
		{ permissions: auditPermissions },
	)
	.setButtonResponse(
		'rejectConfession',
		async (interaction, confId) => {
			const [translator, guildTranslator] = await Translator.from(interaction);
			const data = await getConfessionSystemAndChannels(interaction, translator);
			if (data.success === false) {
				await interaction.reply({ content: data.message, flags: MessageFlags.Ephemeral });
				return;
			}

			const { confSystem } = data;

			const index = confSystem.pending.indexOf(confId);
			if (index < 0) {
				await interaction.update({
					components: [
						remakeContainerBuilderWithoutActions(interaction).addTextDisplayComponents(
							(textDisplay) =>
								textDisplay.setContent(
									guildTranslator.getText(
										'confessionRequestAlreadyAnsweredFooter',
									),
								),
						),
					],
				});
				return;
			}

			await Promise.allSettled(confessionTasks);
			confSystem.pending.splice(index, 1);
			confSystem.markModified('pending');
			await delegateConfessionSystemTasks(
				confSystem.save(),
				PendingConfessionModel.findOneAndDelete({ id: confId }),
			);

			const container = new ContainerBuilder()
				.setAccentColor(0xeb345c)
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(
						guildTranslator.getText(
							'confessionAuditRejectDescription',
							interaction.user.id,
						),
					),
				);

			await interaction.update({ components: [container] });
		},
		{ permissions: auditPermissions },
	)
	.setButtonResponse(
		'timeoutConfessant',
		async (interaction, confId, userId) => {
			const [translator, guildTranslator] = await Translator.from(interaction);
			const data = await getConfessionSystemAndChannels(interaction, translator);
			if (data.success === false) {
				await interaction.reply({ content: data.message, flags: MessageFlags.Ephemeral });
				return;
			}

			const { confSystem } = data;

			const index = confSystem.pending.indexOf(confId);
			if (index < 0) {
				await interaction.update({
					components: [
						remakeContainerBuilderWithoutActions(interaction).addTextDisplayComponents(
							(textDisplay) =>
								textDisplay.setContent(
									guildTranslator.getText(
										'confessionRequestAlreadyAnsweredFooter',
									),
								),
						),
					],
				});
				return;
			}

			confSystem.pending.splice(index, 1);
			confSystem.markModified('pending');
			await delegateConfessionSystemTasks(
				confSystem.save(),
				PendingConfessionModel.findOneAndDelete({ id: confId }),
			);

			const targetMemberId = decompressId(userId);
			const targetMember = interaction.guild.members.cache.get(targetMemberId);
			let confirmationContainer: ContainerBuilder;
			try {
				if (targetMember) {
					const timeoutHours = 2;
					await targetMember.timeout(
						hoursToMinutes(timeoutHours),
						guildTranslator.getText(
							'confessionAuditTimeoutReason',
							interaction.user.username,
						),
					);

					const targetMemberTranslator = await Translator.fromUser(targetMemberId);
					await targetMember
						.send(
							targetMemberTranslator.getText(
								'confessionAuditTimeoutDM',
								interaction.guild.name,
								timeoutHours,
							),
						)
						.catch((_) => _);
				} else
					throw new ReferenceError(
						guildTranslator.getText('confessionAuditTimeoutOrBanAuthorNotFoundError'),
					);

				confirmationContainer = new ContainerBuilder()
					.setAccentColor(Colors.Orange)
					.addTextDisplayComponents(
						(textDisplay) =>
							textDisplay.setContent(
								guildTranslator.getText('confessionAuditTimeoutTitle'),
							),
						(textDisplay) =>
							textDisplay.setContent(
								guildTranslator.getText(
									'confessionAuditTimeoutDescription',
									interaction.user.id,
								),
							),
					);
			} catch (err) {
				confirmationContainer = new ContainerBuilder()
					.setAccentColor(Colors.Red)
					.addTextDisplayComponents(
						(textDisplay) =>
							textDisplay.setContent(
								guildTranslator.getText('confessionAuditTimeoutOrBanFailedTitle'),
							),
						(textDisplay) =>
							textDisplay.setContent(
								guildTranslator.getText(
									'confessionAuditTimeoutFailedDescription',
									interaction.user.id,
									targetMember?.id ?? '...',
								),
							),
					);

				if (err.message)
					confirmationContainer
						.addSeparatorComponents((separator) => separator.setDivider(true))
						.addTextDisplayComponents(
							(textDisplay) =>
								textDisplay.setContent(
									guildTranslator.getText(
										'confessionAuditTimeoutOrBanFailedErrorName',
									),
								),
							(textDisplay) =>
								textDisplay.setContent(`\`\`\`\n${err.message}\n\`\`\``),
						);

				if (!(err instanceof DiscordAPIError))
					auditError(err, {
						request: interaction,
						brief: 'Ha ocurrido un error al aislar un confesante',
						ping: false,
					});
			}

			await interaction.update({ components: [confirmationContainer] });
		},
		{ permissions: timeoutPermissions },
	)
	.setButtonResponse(
		'banConfessant',
		async (interaction, confessionId, compressedTargetMemberId) => {
			const [translator, guildTranslator] = await Translator.from(interaction);
			const data = await getConfessionSystemAndChannels(interaction, translator);
			if (data.success === false) {
				await interaction.reply({ content: data.message, flags: MessageFlags.Ephemeral });
				return;
			}

			const { confSystem } = data;

			const index = confSystem.pending.indexOf(confessionId);
			if (index < 0) {
				await interaction.update({
					components: [
						remakeContainerBuilderWithoutActions(interaction).addTextDisplayComponents(
							(textDisplay) =>
								textDisplay.setContent(
									guildTranslator.getText(
										'confessionRequestAlreadyAnsweredFooter',
									),
								),
						),
					],
				});
				return;
			}

			confSystem.pending.splice(index, 1);
			confSystem.markModified('pending');
			await delegateConfessionSystemTasks(
				confSystem.save(),
				PendingConfessionModel.findOneAndDelete({ id: confessionId }),
			);

			const targetMemberId = decompressId(compressedTargetMemberId);
			const targetMember = interaction.guild.members.cache.get(targetMemberId);
			let confirmationContainer: ContainerBuilder;
			try {
				if (targetMember) {
					await targetMember.ban({
						reason: guildTranslator.getText(
							'confessionAuditBanReason',
							interaction.user.username,
						),
					});
					await targetMember
						.send(
							guildTranslator.getText('confessionAuditBanDM', interaction.guild.name),
						)
						.catch((_) => _);
				} else
					throw new ReferenceError(
						guildTranslator.getText('confessionAuditTimeoutOrBanAuthorNotFoundError'),
					);

				confirmationContainer = new ContainerBuilder()
					.setAccentColor(Colors.Orange)
					.addTextDisplayComponents(
						(textDisplay) =>
							textDisplay.setContent(
								guildTranslator.getText('confessionAuditBanTitle'),
							),
						(textDisplay) =>
							textDisplay.setContent(
								guildTranslator.getText(
									'confessionAuditBanDescription',
									interaction.user.id,
								),
							),
					);
			} catch (err) {
				confirmationContainer = new ContainerBuilder()
					.setAccentColor(Colors.Red)
					.addTextDisplayComponents(
						(textDisplay) =>
							textDisplay.setContent(
								guildTranslator.getText('confessionAuditTimeoutOrBanFailedTitle'),
							),
						(textDisplay) =>
							textDisplay.setContent(
								guildTranslator.getText(
									'confessionAuditBanFailedDescription',
									interaction.user.id,
									targetMember?.id ?? '...',
								),
							),
					);

				if (err.message)
					confirmationContainer
						.addSeparatorComponents((separator) => separator.setDivider(true))
						.addTextDisplayComponents(
							(textDisplay) =>
								textDisplay.setContent(
									guildTranslator.getText(
										'confessionAuditTimeoutOrBanFailedErrorName',
									),
								),
							(textDisplay) =>
								textDisplay.setContent(`\`\`\`\n${err.message}\n\`\`\``),
						);

				if (!(err instanceof DiscordAPIError))
					auditError(err, {
						request: interaction,
						brief: 'Ha ocurrido un error al bannear un confesante',
						ping: false,
					});
			}

			await interaction.update({ components: [confirmationContainer] });
		},
		{ permissions: banPermissions },
	)
	.setButtonResponse('promptReplyAnon', async (interaction) => {
		const translator = await Translator.fromUser(interaction.user);

		const modal = new ModalBuilder()
			.setCustomId(getConfessionsCustomId('replyAnon'))
			.setTitle(translator.getText('confessionAnonReplyModalTitle'))
			.addLabelComponents(
				(label) =>
					label
						.setLabel(translator.getText('confessionAnonReplyModalUsernameName'))
						.setTextInputComponent((textInput) =>
							textInput
								.setCustomId('inputPseudonym')
								.setValue(
									translator.getText(
										'confessionAnonReplyModalUsernameDefault',
										(Date.now() % 0xffff).toString(16),
									),
								)
								.setStyle(TextInputStyle.Short)
								.setRequired(true)
								.setMinLength(1)
								.setMaxLength(32),
						),
				(label) =>
					label
						.setLabel(translator.getText('confessionAnonReplyModalResponseName'))
						.setTextInputComponent((textInput) =>
							textInput
								.setCustomId('inputContent')
								.setPlaceholder(
									translator.getText(
										'confessionAnonReplyModalResponsePlaceholder',
									),
								)
								.setStyle(TextInputStyle.Paragraph)
								.setRequired(true)
								.setMinLength(1)
								.setMaxLength(1000),
						),
			)
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(
					translator.getText('confessionAnonReplyModalResponseNotice'),
				),
			);

		await interaction.showModal(modal);
	})
	.setModalResponse('replyAnon', async (interaction) => {
		const [translator, guildTranslator] = await Translator.from(interaction);
		const data = await getConfessionSystemAndChannels(interaction, translator);
		if (data.success === false) {
			await interaction.reply({ content: data.message, flags: MessageFlags.Ephemeral });
			return;
		}

		const { confSystem, logChannel } = data;
		const { message } = interaction;

		const userId = compressId(interaction.user.id);
		const responseId = compressId(interaction.id);
		const messageId = compressId(message.id);
		const responsePseudonym = interaction.fields.getTextInputValue('inputPseudonym');
		const responseContent = interaction.fields.getTextInputValue('inputContent');
		const pendingConf = new PendingConfessionModel({
			id: responseId,
			channelId: confSystem.confessionsChannelId,
			pseudonym: responsePseudonym,
			content: responseContent,
			anonymous: true,
		});
		confSystem.pending[confSystem.pending.length] = responseId;
		confSystem.markModified('pending');

		const auditContainer = new ContainerBuilder()
			.setAccentColor(0x8334eb)
			.addTextDisplayComponents(
				(textDisplay) =>
					textDisplay.setContent(guildTranslator.getText('confessionAuditReplySubtitle')),
				(textDisplay) =>
					textDisplay.setContent(guildTranslator.getText('confessionAuditReplyTitle')),
				(textDisplay) =>
					textDisplay.setContent(
						guildTranslator.getText(
							'confessionAuditReplyDescription',
							`${message.url}`,
						),
					),
			)
			.addSeparatorComponents((separator) => separator.setDivider(true))
			.addTextDisplayComponents(
				(textDisplay) =>
					textDisplay.setContent(
						guildTranslator.getText('confessionAuditReplyPseudonymName'),
					),
				(textDisplay) => textDisplay.setContent(responsePseudonym),
			)
			.addSeparatorComponents((separator) => separator.setDivider(true))
			.addTextDisplayComponents(
				(textDisplay) =>
					textDisplay.setContent(
						guildTranslator.getText('confessionAuditReplyContentName'),
					),
				(textDisplay) => textDisplay.setContent(responseContent),
			)
			.addSeparatorComponents((separator) =>
				separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large),
			)
			.addActionRowComponents((actionRow) =>
				actionRow.addComponents(
					new ButtonBuilder()
						.setCustomId(
							getConfessionsCustomId(
								'acceptConfession',
								responseId,
								userId,
								messageId,
							),
						)
						.setEmoji(getBotEmojiResolvable('checkmarkWhite'))
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId(getConfessionsCustomId('rejectConfession', responseId))
						.setEmoji(getBotEmojiResolvable('xmarkAccent'))
						.setStyle(ButtonStyle.Secondary),
					new ButtonBuilder()
						.setCustomId(
							getConfessionsCustomId('timeoutConfessant', responseId, userId),
						)
						.setEmoji(getBotEmojiResolvable('xmarkWhite'))
						.setLabel(guildTranslator.getText('confessionAuditButtonTimeout'))
						.setStyle(ButtonStyle.Danger),
					new ButtonBuilder()
						.setCustomId(getConfessionsCustomId('banConfessant', responseId, userId))
						.setEmoji(getBotEmojiResolvable('xmarkWhite'))
						.setLabel(guildTranslator.getText('confessionAuditButtonBan'))
						.setStyle(ButtonStyle.Danger),
				),
			);

		await delegateConfessionSystemTasks(
			logChannel.send({ flags: MessageFlags.IsComponentsV2, components: [auditContainer] }),
			confSystem.save().then(() => pendingConf.save()),
		);

		await interaction.reply({
			flags: MessageFlags.Ephemeral,
			content: translator.getText('confessionReplySuccessNoticeDescription'),
		});
	});

const confessionTasks: unknown[] = [];

/**
 * @description
 * Intenta resolver un sistema de confesiones de la BDD y sus canales relacionados.
 *
 * Verifica que todos los componentes necesarios para sustentar un sistema de confesiones sean válidos.
 * Si no lo son, falla y devuelve un objeto con `success = false` y un `message` de diagnóstico de error.
 * @returns Un objeto con los datos obtenidos.
 */
async function getConfessionSystemAndChannels(interaction: Interaction, translator: Translator) {
	await Promise.allSettled(confessionTasks);

	/**
	 * @param {string} message
	 * @returns {{ success: false, message: string }}
	 */
	const makeErr = (message: string): { success: false; message: string } => ({
		success: false,
		message,
	});

	const confSystem = await ConfessionSystemModel.findOne({ guildId: interaction.guildId });
	if (!confSystem) return makeErr(translator.getText('confessionSystemNotConfigured'));

	const logChannel = interaction.guild?.channels.cache.get(confSystem.logChannelId);
	if (!logChannel || logChannel.type !== ChannelType.GuildText)
		return makeErr(translator.getText('confessionAuditChannelNotFound'));

	const confChannel = interaction.guild?.channels.cache.get(confSystem.confessionsChannelId);
	if (!confChannel || confChannel.type !== ChannelType.GuildText)
		return makeErr(translator.getText('confessionConfessionsChannelNotFound'));

	const ret: {
		success: true;
		confSystem: typeof confSystem;
		logChannel: TextChannel;
		confChannel: TextChannel;
	} = {
		success: true,
		confSystem,
		logChannel,
		confChannel,
	};

	return ret;
}

function remakeContainerBuilderWithoutActions(
	interaction: AnyCommandInteraction,
): ContainerBuilder {
	const container = interaction.message?.components.find(
		(component) => component.type === ComponentType.Container,
	);
	if (!container) throw ReferenceError('El mensaje no tenía un contenedor.');

	const builder = new ContainerBuilder();

	for (const component of container.components) {
		switch (component.type) {
			case ComponentType.TextDisplay:
				console.log(
					`Detected a TextDisplay component with content: "${component.content}"`,
				);
				builder.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(component.content),
				);
				break;
			case ComponentType.Separator:
				console.log(
					`Detected a separator with divider=${component.divider}, spacing=${component.spacing}`,
				);
				builder.addSeparatorComponents((separator) =>
					separator.setDivider(component.divider).setSpacing(component.spacing),
				);
				break;
			case ComponentType.Section: {
				if (component.accessory.type === ComponentType.Button) {
					console.log(`Detected a Section component with Button accesory.`);
					builder.addTextDisplayComponents(
						component.components.map(
							(textDisplay) => new TextDisplayBuilder(textDisplay),
						),
					);
				} else {
					console.log(`Detected a Section component with Button accesory.`);
					builder.addSectionComponents(
						new SectionBuilder(component as APISectionComponent),
					);
				}
				break;
			}
			case ComponentType.MediaGallery:
				console.log(`Detected a MediaGallery component.`);
				builder.addMediaGalleryComponents(new MediaGalleryBuilder(component));
				break;
			case ComponentType.File:
				console.log(`Detected a File component.`);
				builder.addFileComponents(new FileBuilder(component));
				break;
		}
	}

	console.log('Was able to remake builder');

	return builder;
}

/**
 * @description Delega tareas pendientes al sistema de confesiones.
 * @param tasks Nuevas promesas a delegar al sistema de confesiones.
 */
async function delegateConfessionSystemTasks(...tasks: unknown[]) {
	confessionTasks.push(...tasks);
	return Promise.allSettled(tasks);
}

export const getConfessionsCustomId = system.customIdGetter;

export default system;
