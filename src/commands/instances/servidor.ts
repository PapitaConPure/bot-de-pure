import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type CategoryChannel,
	ChannelType,
	Colors,
	ContainerBuilder,
	type Guild,
	type GuildChannel,
	type GuildMember,
	MessageFlags,
	ModalBuilder,
	SeparatorSpacingSize,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	TextInputStyle,
} from 'discord.js';
import type { AnyCommandInteraction } from 'types/commands';
import { tenshiAltColor, tenshiColor, tenshiPeachColor } from '@/data/globalProps';
import { isValidLocaleKey, Locales, Translator } from '@/i18n';
import { type GuildConfigDocument, GuildConfigModel } from '@/models/guildconfigs';
import { PureVoiceModel, PureVoiceSessionModel } from '@/models/purevoice';
import { getBotEmojiResolvable } from '@/utils/emojis';
import { compressId } from '@/utils/encoding';
import { recacheGuild } from '@/utils/guildcache';
import { p_pure } from '@/utils/prefixes';
import { Command, CommandPermissions, CommandTags } from '../commons';

const cancelButton = (compressedUserId: string) =>
	new ButtonBuilder()
		.setCustomId(`servidor_exitWizard_${compressedUserId}`)
		.setEmoji(getBotEmojiResolvable('xmarkAccent'))
		.setStyle(ButtonStyle.Secondary);

const backToMainDashboardButton = (compressedAuthorId: string) =>
	new ButtonBuilder()
		.setCustomId(`servidor_goToDashboard_${compressedAuthorId}`)
		.setEmoji(getBotEmojiResolvable('navBackAccent'))
		.setStyle(ButtonStyle.Secondary);

const backToVoiceWizardButton = (compressedUserId: string) =>
	new ButtonBuilder()
		.setCustomId(`servidor_goToVoiceWizard_${compressedUserId}`)
		.setEmoji(getBotEmojiResolvable('navBackAccent'))
		.setStyle(ButtonStyle.Secondary);

const tags = new CommandTags().add('MOD');

const permissions = new CommandPermissions().requireAnyOf(['ManageGuild']);

const command = new Command(
	{
		es: 'servidor',
		en: 'server',
		ja: 'server',
	},
	tags,
)
	.setAliases(
		'server',
		'guild',
		'sv',
		'serverconfig',
		'serverconfigs',
		'guildconfig',
		'guildconfigs',
	)
	.setBriefDescription(
		'Para ver y configurar las preferencias del servidor por medio de un Asistente',
	)
	.setLongDescription(
		'Para ver y configurar las preferencias del servidor.',
		'Si quieres cambiar alguna configuración, puedes presionar cualquier botón para proceder con el Asistente',
	)
	.setPermissions(permissions)
	.setExecution(async (request) => {
		const [translator, guildTranslator] = await Translator.from(request);
		const compressedUserId = compressId(request.userId);

		return request.reply({
			flags: MessageFlags.IsComponentsV2,
			components: [
				makeDashboardContainer(
					compressedUserId,
					request.guild,
					translator,
					guildTranslator,
				),
			],
		});
	})
	.setSelectMenuResponse(
		async function selectLanguage(interaction, compressedUserId) {
			const { success, context } = await getWizardContext(interaction);
			if (!success) return;
			const { guild, guildConfigs, translator } = context;

			const newLocale = interaction.values[0];
			if (!newLocale || !isValidLocaleKey(newLocale)) return interaction.deleteReply();

			guildConfigs.locale = newLocale;
			const guildTranslator = new Translator(newLocale);

			await guildConfigs.save();
			await recacheGuild(guild);

			return interaction.update({
				flags: MessageFlags.IsComponentsV2,
				components: [
					makeDashboardContainer(compressedUserId, guild, translator, guildTranslator),
				],
			});
		},
		{ userFilterIndex: 0, applyTagExclusions: true },
	)
	.setSelectMenuResponse(
		async function selectConfig(interaction, compressedUserId) {
			const { success, context } = await getWizardContext(interaction);
			if (!success) return;
			const { guild, translator } = context;

			switch (interaction.values[0]) {
				case 'voice': {
					const container = await makeMainVoiceWizardContainer(
						compressedUserId,
						guild,
						translator,
					);

					return interaction.update({ components: [container] });
				}

				default:
					return interaction.reply({
						flags: MessageFlags.Ephemeral,
						content: translator.getText('invalidInput'),
					});
			}
		},
		{ userFilterIndex: 0, applyTagExclusions: true },
	)
	.setButtonResponse(
		async function goToDashboard(interaction, compressedUserId) {
			const { success, context } = await getWizardContext(interaction);
			if (!success) return;
			const { guild, translator, guildTranslator } = context;

			return interaction.update({
				flags: MessageFlags.IsComponentsV2,
				components: [
					makeDashboardContainer(compressedUserId, guild, translator, guildTranslator),
				],
			});
		},
		{ userFilterIndex: 0, applyTagExclusions: true },
	)
	.setButtonResponse(
		async function exitWizard(interaction) {
			const translator = await Translator.fromUser(interaction);

			const container = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(translator.getText('serverWizardClosedDescription')),
			);

			return interaction.update({ components: [container] });
		},
		{ userFilterIndex: 0, applyTagExclusions: true },
	)
	.setButtonResponse(
		async function goToVoiceWizard(interaction, compressedUserId) {
			const translator = await Translator.fromUser(interaction);
			const { guild } = interaction;

			const container = await makeMainVoiceWizardContainer(
				compressedUserId,
				guild,
				translator,
			);

			return interaction.update({ components: [container] });
		},
		{ userFilterIndex: 0, applyTagExclusions: true },
	)
	.setButtonResponse(
		async function selectVoiceInstallation(interaction, compressedUserId) {
			const translator = await Translator.fromUser(interaction);

			const wizard = makeVoiceWizardContainer(translator, Colors.Gold)
				.addTextDisplayComponents(
					(textDisplay) =>
						textDisplay.setContent(translator.getText('voiceInstallationSelectTitle')),
					(textDisplay) =>
						textDisplay.setContent(
							translator.getText('voiceInstallationSelectDescription'),
						),
				)
				.addActionRowComponents((actionRow) =>
					actionRow.addComponents(
						new ButtonBuilder()
							.setCustomId(
								`servidor_promptInstallVoiceSystem_${compressedUserId}_new`,
							)
							.setLabel(translator.getText('voiceInstallationSelectButtonCreateNew'))
							.setStyle(ButtonStyle.Success),
						new ButtonBuilder()
							.setCustomId(`servidor_promptInstallVoiceSystem_${compressedUserId}`)
							.setLabel(translator.getText('voiceInstallationSelectButtonInject'))
							.setStyle(ButtonStyle.Primary),
						backToVoiceWizardButton(compressedUserId),
						cancelButton(compressedUserId),
					),
				);

			return interaction.update({ components: [wizard] });
		},
		{ userFilterIndex: 0, applyTagExclusions: true },
	)
	.setButtonResponse(
		async function promptInstallVoiceSystem(interaction, compressedUserId, createNew) {
			const translator = await Translator.fromUser(interaction);

			const modal = new ModalBuilder()
				.setCustomId(
					`servidor_installVoiceSystem_${compressedUserId}${createNew ? `_${createNew}` : ''}`,
				)
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
		{ userFilterIndex: 0, applyTagExclusions: true },
	)
	.setModalResponse(
		async function installVoiceSystem(interaction, compressedUserId, createNew) {
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
				await PureVoiceModel.deleteOne(guildQuery);
				const pv = new PureVoiceModel({
					...guildQuery,
					categoryId: category.id,
					voiceMakerId: voiceMaker.id,
				});

				const wizard = makeVoiceWizardContainer(translator, Colors.Green)
					.addTextDisplayComponents(
						(textDisplay) =>
							textDisplay.setContent(
								translator.getText('voiceCategoryInstalledTitle'),
							),
						(textDisplay) =>
							textDisplay.setContent(
								translator.getText(
									'voiceCategoryInstalledDescription',
									p_pure(interaction.guildId).raw,
								),
							),
					)
					.addActionRowComponents((actionRow) =>
						actionRow.addComponents(
							backToVoiceWizardButton(compressedUserId),
							cancelButton(compressedUserId),
						),
					);

				await pv.save();

				return Promise.all([
					interaction.message.edit({
						components: [wizard],
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
		{ userFilterIndex: 0, applyTagExclusions: true },
	)
	.setButtonResponse(
		async function promptRelocateVoiceSystem(interaction, compressedUserId) {
			const translator = await Translator.fromUser(interaction);

			const guildQuery = { guildId: interaction.guildId };
			const pv = await PureVoiceModel.findOne(guildQuery);

			if (!pv) return interaction.deleteReply();

			const modal = new ModalBuilder()
				.setCustomId(`servidor_relocateVoiceSystem_${compressedUserId}`)
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
		{ userFilterIndex: 0, applyTagExclusions: true },
	)
	.setModalResponse(
		async function relocateVoiceSystem(interaction, compressedUserId) {
			const translator = await Translator.fromUser(interaction);

			const guildQuery = { guildId: interaction.guildId };
			const pv = await PureVoiceModel.findOne(guildQuery);

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

			const wizard = makeVoiceWizardContainer(translator, Colors.Yellow)
				.addTextDisplayComponents(
					(textDisplay) =>
						textDisplay.setContent(translator.getText('voiceRelocatedTitle')),
					(textDisplay) =>
						textDisplay.setContent(translator.getText('voiceRelocatedDescription')),
				)
				.addActionRowComponents((actionRow) =>
					actionRow.addComponents(
						backToVoiceWizardButton(compressedUserId),
						cancelButton(compressedUserId),
					),
				);

			return interaction.update({ components: [wizard] });
		},
		{ userFilterIndex: 0, applyTagExclusions: true },
	)
	.setButtonResponse(
		async function deleteVoiceSystem(interaction, compressedUserId) {
			const translator = await Translator.fromUser(interaction);

			const wizard = makeVoiceWizardContainer(translator, Colors.Red)
				.addTextDisplayComponents(
					(textDisplay) =>
						textDisplay.setContent(translator.getText('voiceUninstallTitle')),
					(textDisplay) =>
						textDisplay.setContent(translator.getText('voiceUninstallDescription')),
				)
				.addSeparatorComponents((separator) => separator.setDivider(false))
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(translator.getText('voiceUninstallConfirmQuestion')),
				)
				.addActionRowComponents((actionRow) =>
					actionRow.addComponents(
						new ButtonBuilder()
							.setCustomId(`servidor_deleteVoiceSystemConfirmed_${compressedUserId}`)
							.setLabel(translator.getText('voiceButtonUninstallConfirm'))
							.setStyle(ButtonStyle.Danger),
						backToVoiceWizardButton(compressedUserId),
						cancelButton(compressedUserId),
					),
				);

			return interaction.update({ components: [wizard] });
		},
		{ userFilterIndex: 0, applyTagExclusions: true },
	)
	.setButtonResponse(
		async function deleteVoiceSystemConfirmed(interaction, compressedUserId) {
			const guildQuery = { guildId: interaction.guildId };
			const [translator, pv] = await Promise.all([
				Translator.fromUser(interaction),
				PureVoiceModel.findOne(guildQuery),
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
					PureVoiceModel.deleteOne(guildQuery),
				]);

				const deleteEmbed = makeVoiceWizardContainer(translator, tenshiPeachColor)
					.addTextDisplayComponents(
						(textDisplay) =>
							textDisplay.setContent(translator.getText('voiceUninstalledTitle')),
						(textDisplay) =>
							textDisplay.setContent(
								translator.getText('voiceUninstalledDescription'),
							),
					)
					.addActionRowComponents((actionRow) =>
						actionRow.addComponents(
							backToVoiceWizardButton(compressedUserId),
							cancelButton(compressedUserId),
						),
					);

				return interaction.editReply({ components: [deleteEmbed] });
			} catch {
				return interaction.editReply({ content: null });
			}
		},
		{ userFilterIndex: 0, applyTagExclusions: true },
	);

async function getWizardContext(
	request: AnyCommandInteraction & { guild: Guild },
	options: {
		notEphemeral?: boolean;
		editReply?: boolean;
	} = {},
): Promise<
	| {
			success: true;
			context: {
				guild: Guild;
				guildConfigs: GuildConfigDocument;
				translator: Translator;
				guildTranslator: Translator;
			};
	  }
	| { success: false; context: null }
> {
	const { notEphemeral = false, editReply = false } = options;
	const { guild } = request;

	const [translator, guildConfigs] = await Promise.all([
		Translator.fromUser(request),
		GuildConfigModel.findOne({ guildId: request.guild.id }),
	]);

	if (!guildConfigs) {
		const guildNotAvailableText = translator.getText('servidorGuildUnavailable');
		if (editReply) await request.editReply({ content: guildNotAvailableText });
		else
			await request.reply({
				content: guildNotAvailableText,
				flags: notEphemeral ? undefined : MessageFlags.Ephemeral,
			});

		return { success: false, context: null };
	}

	const guildTranslator = new Translator(guildConfigs.locale);

	return { success: true, context: { guild, guildConfigs, translator, guildTranslator } };
}

function makeDashboardContainer(
	compressedUserId: string,
	guild: Guild,
	translator: Translator,
	guildTranslator: Translator,
) {
	const container = new ContainerBuilder().setAccentColor(tenshiColor);
	const guildIcon = guild.iconURL({ size: 512 });

	if (guildIcon)
		container.addSectionComponents((section) =>
			section
				.addTextDisplayComponents(
					(textDisplay) =>
						textDisplay.setContent(translator.getText('serverDashboardServerEpigraph')),
					(textDisplay) => textDisplay.setContent(`# ${guild.name}`),
				)
				.setThumbnailAccessory((thumbnail) =>
					thumbnail
						.setDescription(translator.getText('infoGuildIconAlt'))
						.setURL(guildIcon),
				),
		);
	else
		container.addTextDisplayComponents(
			(textDisplay) =>
				textDisplay.setContent(translator.getText('serverDashboardServerEpigraph')),
			(textDisplay) => textDisplay.setContent(`# ${guild.name}`),
		);

	container
		.addSeparatorComponents((separator) => separator.setDivider(true))
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(translator.getText('serverDashboardLanguageName')),
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`server_selectLanguage_${compressedUserId}`)
					.setPlaceholder(translator.getText('languageMenuPlaceholder'))
					.setOptions(
						Object.values(Locales).map((locale) => {
							const subTranslator = new Translator(locale);
							return new StringSelectMenuOptionBuilder()
								.setLabel(subTranslator.getText('currentLanguage'))
								.setEmoji(subTranslator.getText('currentLanguageEmojiId'))
								.setValue(locale)
								.setDefault(guildTranslator.locale === subTranslator.locale);
						}),
					),
			),
		)
		.addSeparatorComponents((separator) => separator.setDivider(true))
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(translator.getText('serverDashboardOtherConfigsName')),
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`servidor_selectConfig_${compressedUserId}`)
					.setPlaceholder(translator.getText('serverDashboardMenuConfig'))
					.setOptions([
						{
							label: 'Boorutato',
							description: translator.getText('yoDashboardMenuConfigFeedDesc'),
							emoji: '1460145550119669912',
							value: 'feed',
						},
						{
							label: 'PuréVoice',
							description: translator.getText('yoDashboardMenuConfigVoiceDesc'),
							emoji: '1460145551847723132',
							value: 'voice',
						},
						{
							label: translator.getText('serverDashboardMenuConfigConfessionsLabel'),
							emoji: '1461426802890244116',
							value: 'confessions',
						},
					]),
			),
		)
		.addSeparatorComponents((separator) =>
			separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large),
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`servidor_exitWizard_${compressedUserId}`)
					.setLabel(translator.getText('buttonClose'))
					.setStyle(ButtonStyle.Secondary),
			),
		);

	return container;
}

function makeVoiceWizardContainer(translator: Translator, stepColor: number) {
	return new ContainerBuilder()
		.setAccentColor(stepColor)
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(translator.getText('voiceWizardEpigraph')),
		);
}

async function makeMainVoiceWizardContainer(
	compressedUserId: string,
	guild: Guild,
	translator: Translator,
) {
	const container = makeVoiceWizardContainer(translator, tenshiAltColor)
		.addTextDisplayComponents(
			(textDisplay) =>
				textDisplay.setContent(translator.getText('voiceInstallationStartTitle')),
			(textDisplay) => textDisplay.setContent(translator.getText('voiceWizardWelcome')),
		)
		.addSeparatorComponents((separator) => separator.setDivider(false))
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(translator.getText('voiceInstallationNextStepDescription')),
		);

	const pv = await PureVoiceModel.findOne({ guildId: guild.id });
	const row = new ActionRowBuilder<ButtonBuilder>();
	const isInstalled =
		pv && guild.channels.cache.get(pv.categoryId) && guild.channels.cache.get(pv.voiceMakerId);
	if (!isInstalled)
		row.addComponents(
			new ButtonBuilder()
				.setCustomId(`servidor_selectVoiceInstallation_${compressedUserId}`)
				.setLabel(translator.getText('voiceButtonInstall'))
				.setStyle(ButtonStyle.Primary),
		);
	else
		row.addComponents(
			new ButtonBuilder()
				.setCustomId(`servidor_promptRelocateVoiceSystem_${compressedUserId}`)
				.setLabel(translator.getText('voiceButtonRelocate'))
				.setStyle(ButtonStyle.Primary),
		);

	row.addComponents(
		new ButtonBuilder()
			.setCustomId(`servidor_deleteVoiceSystem_${compressedUserId}`)
			.setLabel(translator.getText('voiceButtonUninstall'))
			.setStyle(ButtonStyle.Danger)
			.setDisabled(!isInstalled),
		backToMainDashboardButton(compressedUserId),
		cancelButton(compressedUserId),
	);

	container.addActionRowComponents(row);

	return container;
}

export default command;
