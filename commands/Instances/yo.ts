import { CommandTags, Command, CommandOptions, CommandFlag } from '../Commons/';
import { ButtonBuilder, ButtonStyle, Colors, TextInputBuilder, TextInputStyle, ModalBuilder, StringSelectMenuBuilder, ContainerBuilder, MessageFlags, StringSelectMenuOptionBuilder, SeparatorSpacingSize, LabelBuilder, MessageComponentInteraction, Interaction } from 'discord.js';
import { Translator, Locales, isValidLocaleKey, LocaleIds, LocaleKey } from '../../i18n';
import { compressId, decompressId, improveNumber, warn, shortenText } from '../../func';
import { AcceptedTwitterConverterKey, acceptedTwitterConverters } from '../../systems/agents/pureet';
import { updateFollowedFeedTagsCache } from '../../systems/booru/boorufeed';
import UserConfigs, { UserConfigDocument } from '../../models/userconfigs';
import { makeSessionAutoname } from '../../systems/others/purevoice';
import { tenshiColor, tenshiAltColor } from '../../data/globalProps';
import { makeTextInputRowBuilder } from '../../utils/tsCasts';
import { toUtcOffset, sanitizeTzCode, utcOffsetDisplayFull } from '../../utils/timezones';
import { ComplexCommandRequest } from '../Commons/typings';
import { auditError } from '../../systems/others/auditor';
import { recacheUser } from '../../utils/usercache';

const userNotAvailableText = warn('Usuario no disponible / User unavailable / ユーザーは利用できません');

const backToDashboardButton = (compressedAuthorId: string) => new ButtonBuilder()
	.setCustomId(`yo_goToDashboard_${compressedAuthorId}`)
	.setEmoji('1355128236790644868')
	.setStyle(ButtonStyle.Secondary);

const cancelButton = (compressedAuthorId: string) => new ButtonBuilder()
	.setCustomId(`yo_cancelWizard_${compressedAuthorId}`)
	.setEmoji('1355143793577426962')
	.setStyle(ButtonStyle.Secondary);

function makeDashboardContainer(request: Interaction | ComplexCommandRequest, userConfigs: UserConfigDocument, translator: Translator) {
	//const suscriptions = [...userConfigs.feedTagSuscriptions.values()];
	//const suscriptionsFeedCount = suscriptions.length ? suscriptions.map(a => a.length ?? 0).reduce((a, b) => a + b) : 0;
	//const suscriptionsServerCount = userConfigs.feedTagSuscriptions.size;
	//const now = new Date(Date.now());
	//const unix = getUnixTime(now);
	const { tzCode, prc } = userConfigs;
	const compressedUserId = compressId(request.user.id);

	const container = new ContainerBuilder()
		.setAccentColor(tenshiColor)
		.addSectionComponents(section =>
			section
				.addTextDisplayComponents(
					textDisplay => textDisplay.setContent(translator.getText('yoDashboardEpigraph')),
					textDisplay => textDisplay.setContent(`# ${request.user.displayName}`),
					textDisplay => textDisplay.setContent(
						translator.getText('yoDashboardPRC', improveNumber(prc, { shorten: true, translator }))
					),
				)
				.setThumbnailAccessory(thumbnail =>
					thumbnail
						.setDescription(translator.getText('avatarGlobalAvatarAlt', request.user.displayName))
						.setURL(request.user.displayAvatarURL({ size: 256 }))
				)
		)
		.addSeparatorComponents(separator => separator.setDivider(true))
		.addSectionComponents(section =>
			section
				.addTextDisplayComponents(textDisplay =>
					textDisplay.setContent([
						translator.getText('yoDashboardTimezoneName'),
						tzCode?.length ? `<:clock:1357498813144760603> ${utcOffsetDisplayFull(tzCode)}` : translator.getText('yoDashboardNoTZ'),
					].join('\n')),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(`yo_promptSetTimezone_${compressedUserId}`)
						.setEmoji('1288444896331698241')
						.setLabel(translator.getText('buttonEdit'))
						.setStyle(ButtonStyle.Primary),
				)
		)
		.addSeparatorComponents(separator => separator.setDivider(true))
		.addTextDisplayComponents(textDisplay =>
			textDisplay.setContent(translator.getText('yoDashboardLanguageName'))
		)
		.addActionRowComponents(
			actionRow => actionRow.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`yo_selectLanguage_${compressedUserId}`)
					.setPlaceholder(translator.getText('yoDashboardMenuConfig'))
					.setOptions(Object.values(Locales).map(locale => {
						const subTranslator = new Translator(locale);
						return new StringSelectMenuOptionBuilder()
							.setLabel(subTranslator.getText('currentLanguage'))
							.setEmoji(subTranslator.getText('currentLanguageEmojiId'))
							.setValue(locale)
							.setDefault(translator.locale === subTranslator.locale);
					})),
			),
		)
		.addSeparatorComponents(separator => separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large))
		.addActionRowComponents(
			actionRow => actionRow.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`yo_selectConfig_${compressedUserId}`)
					.setPlaceholder(translator.getText('yoDashboardMenuConfig'))
					.setOptions([
						{
							label: 'PuréFeed',
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
							label: 'PuréPix',
							description: translator.getText('yoDashboardMenuConfigPixixDesc'),
							emoji: '1460135891841585385',
							value: 'pixiv',
						},
						{
							label: 'Puréet',
							description: translator.getText('yoDashboardMenuConfigTwitterDesc'),
							emoji: '1460135894404305019',
							value: 'twitter',
						},
					]),
			),
			actionRow => actionRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`yo_exitWizard_${compressedUserId}`)
					.setLabel(translator.getText('buttonClose'))
					.setStyle(ButtonStyle.Secondary),
			),
		);

	return container;
}

const makeVoiceContainer = (compressedAuthorId: string, userConfigs: UserConfigDocument, translator: Translator) => {
	const container = new ContainerBuilder()
		.setAccentColor(tenshiAltColor)
		.addTextDisplayComponents(textDisplay =>
			textDisplay.setContent(`${translator.getText('yoVoiceTitle')}\n${translator.getText('yoVoiceDescription')}`)
		)
		.addSeparatorComponents(separator => separator.setDivider(true))
		.addTextDisplayComponents(textDisplay =>
			textDisplay.setContent(translator.getText('yoVoicePingName'))
		)
		.addActionRowComponents(actionRow =>
			actionRow.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`yo_setVoicePing_${compressedAuthorId}`)
					.setPlaceholder(translator.getText('yoVoiceMenuPing'))
					.setOptions(
						{
							value: 'always',
							label: translator.getText('always'),
							description: translator.getText('yoVoiceMenuPingAlwaysDesc'),
							default: userConfigs.voice.ping === 'always',
						},
						{
							value: 'onCreate',
							label: translator.getText('yoVoiceMenuPingOnCreateLabel'),
							description: translator.getText('yoVoiceMenuPingOnCreateDesc'),
							default: userConfigs.voice.ping === 'onCreate',
						},
						{
							value: 'never',
							label: translator.getText('never'),
							description: translator.getText('yoVoiceMenuPingNeverDesc'),
							default: userConfigs.voice.ping === 'never',
						},
					)
			)
		)
		.addSeparatorComponents(separator => separator.setDivider(true))
		.addSectionComponents(section =>
			section
				.addTextDisplayComponents(textDisplay =>
					textDisplay.setContent([
						translator.getText('yoVoiceAutonameName'),
						makeSessionAutoname(userConfigs) ?? translator.getText('yoVoiceAutonameValueNone'),
					].join('\n'))
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(`yo_setVoiceAutoname_${compressedAuthorId}`)
						.setEmoji('1288444896331698241')
						.setLabel(translator.getText('buttonEdit'))
						.setStyle(ButtonStyle.Primary)
				)
		)
		.addSeparatorComponents(separator => separator.setDivider(true))
		.addSectionComponents(textDisplay =>
			textDisplay
				.addTextDisplayComponents(
					textDisplay => textDisplay.setContent([
						translator.getText('yoVoiceKillDelayName'),
						'4m 45s',
					].join('\n')),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(`yo_setVoiceKillDelay_${compressedAuthorId}`)
						.setEmoji('1288444896331698241')
						.setLabel(translator.getText('buttonEdit'))
						.setStyle(ButtonStyle.Primary)
				)
		)
		.addSeparatorComponents(separator => separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large))
		.addActionRowComponents(
			actionRow => actionRow.addComponents(
				backToDashboardButton(compressedAuthorId),
				cancelButton(compressedAuthorId),
			),
		);

	return container;
};

const makeTwitterServicePickerContainer = (compressedAuthorId: string, service: string, translator: Translator) => {
	const container = new ContainerBuilder()
		.setAccentColor(0x040404) //Tema de twitter/X
		.addTextDisplayComponents(textDisplay =>
			textDisplay.setContent([
				translator.getText('yoTwitterTitle'),
				translator.getText('yoTwitterDesc')
			].join('\n')),
		)
		.addSeparatorComponents(separator => separator.setDivider(true))
		.addTextDisplayComponents(textDisplay =>
			textDisplay.setContent(translator.getText('yoConversionServiceName'))
		)
		.addActionRowComponents(
			actionRow => actionRow.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`yo_setTwitterConvert_${compressedAuthorId}`)
					.setPlaceholder(translator.getText('yoConversionServiceMenuService'))
					.setOptions(
						{
							value: 'none',
							label: translator.getText('yoConversionServiceMenuServiceNoneLabel'),
							description: translator.getText('yoTwitterMenuServiceNoneDesc'),
							default: service === 'none' || !service,
						},
						{
							value: 'vx',
							label: 'vxTwitter / fixvx',
							description: translator.getText('yoTwitterMenuServiceVxDesc'),
							default: service === 'vx',
						},
						{
							value: 'fx',
							label: 'FxTwitter / FixupX',
							description: translator.getText('yoTwitterMenuServiceFxDesc'),
							default: service === 'fx',
						},
						{
							value: 'girlcockx',
							label: 'girlcockx.com',
							default: service === 'girlcockx',
						},
						{
							value: 'cunnyx',
							label: 'cunnyx.com',
							default: service === 'cunnyx',
						},
					)
			),
		)
		.addSeparatorComponents(separator => separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large))
		.addActionRowComponents(actionRow =>
			actionRow.addComponents(
				backToDashboardButton(compressedAuthorId),
				cancelButton(compressedAuthorId),
			),
		);

	return container;
}

const makePixivServicePickerContainer = (compressedAuthorId: string, service: string, translator: Translator) => {
	const container = new ContainerBuilder()
		.setAccentColor(0x0096fa) //Tema de pixiv
		.addTextDisplayComponents(textDisplay =>
			textDisplay.setContent([
				translator.getText('yoPixivTitle'),
				translator.getText('yoPixivDesc')
			].join('\n')),
		)
		.addSeparatorComponents(separator => separator.setDivider(true))
		.addTextDisplayComponents(textDisplay =>
			textDisplay.setContent(translator.getText('yoConversionServiceName'))
		)
		.addActionRowComponents(
			actionRow => actionRow.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`yo_setPixivConvert_${compressedAuthorId}`)
					.setPlaceholder(translator.getText('yoConversionServiceMenuService'))
					.setOptions(
						{
							value: 'none',
							label: translator.getText('yoConversionServiceMenuServiceNoneLabel'),
							description: translator.getText('yoPixivMenuServiceNoneDesc'),
							default: service === 'none' || !service,
						},
						{
							value: 'phixiv',
							label: 'phixiv',
							description: translator.getText('yoPixivMenuServicePhixivDesc'),
							default: service === 'phixiv',
						},
					)
			),
		)
		.addSeparatorComponents(separator => separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large))
		.addActionRowComponents(actionRow =>
			actionRow.addComponents(
				backToDashboardButton(compressedAuthorId),
				cancelButton(compressedAuthorId),
			),
		);

	return container;
}

function makeSelectTagsChannelContainer(compressedAuthorId: string, request: MessageComponentInteraction, userConfigs: UserConfigDocument, translator: Translator) {
	const container = new ContainerBuilder()
		.setAccentColor(tenshiAltColor)
		.addTextDisplayComponents(
			textDisplay => textDisplay.setContent(translator.getText('yoSelectTagsChannelTitle')),
		)
		.addActionRowComponents(
			actionRow => actionRow.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`yo_modifyFollowedTags_${compressedAuthorId}`)
					.setOptions([...userConfigs.feedTagSuscriptions.entries()].map(([channelId, tags]) => {
						const channel = request.client?.channels.cache.get(channelId);
						if(!channel || channel.isDMBased() || !channel.isSendable())
							return {
								label: translator.getText('invalidChannel'),
								value: `!${channelId}`,
							};

						return {
							label: shortenText(tags.join(' ') || '...', 99, '…'),
							description: `#${channel.name ?? '???'}`,
							value: channelId,
						};
					}))
					.setPlaceholder(translator.getText('feedSelectFeed')),
			),
			actionRow => actionRow.addComponents(
				backToDashboardButton(compressedAuthorId),
				cancelButton(compressedAuthorId),
			),
		);

	return container;
}

function makeFollowedTagsContainer(compressedAuthorId: string, channelId: string, userConfigs: UserConfigDocument, translator: Translator, isAlt: boolean) {
	const compressedChannelId = compressId(channelId);

	const container = new ContainerBuilder()
		.setAccentColor(Colors.LuminousVividPink)
		.addTextDisplayComponents(
			textDisplay => textDisplay.setContent(`## ${translator.getText('yoTagsName')}`),
			textDisplay => textDisplay.setContent(
				`\`\`\`\n${userConfigs.feedTagSuscriptions.get(channelId)?.join(' ') || translator.getText('yoTagsValueDefault')}\n\`\`\``
			)
		)
		.addActionRowComponents(
			actionRow => actionRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`yo_editFT_${compressedAuthorId}_${compressedChannelId}_ADD${isAlt ? '_ALT' : ''}`)
					.setEmoji('1086797601925513337')
					.setLabel(translator.getText('feedSetTagsButtonAdd'))
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId(`yo_editFT_${compressedAuthorId}_${compressedChannelId}_REMOVE${isAlt ? '_ALT' : ''}`)
					.setEmoji('1086797599287296140')
					.setLabel(translator.getText('feedSetTagsButtonRemove'))
					.setStyle(ButtonStyle.Danger),
				new ButtonBuilder()
					.setCustomId(`yo_selectFeedTC_${compressedAuthorId}`)
					.setEmoji('1355128236790644868')
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(!!isAlt),
				cancelButton(compressedAuthorId)
					.setDisabled(!!isAlt),
			),
		);

	return container;
}

async function makeSelectFeedTCResponse(interaction: MessageComponentInteraction, compressedAuthorId: string) {
	const { user } = interaction;

	const [userConfigs] = await Promise.all([
		UserConfigs.findOne({ userId: user.id }),
		interaction.deferReply({ flags: MessageFlags.Ephemeral }),
	]);

	if(!userConfigs)
		return interaction.editReply({ content: userNotAvailableText });

	const translator = new Translator(userConfigs.language);

	if(user.id !== decompressId(compressedAuthorId))
		return interaction.editReply({ content: translator.getText('unauthorizedInteraction') });

	if(userConfigs.feedTagSuscriptions.size === 0)
		return interaction.editReply({ content: translator.getText('yoFeedEmptyError') });

	return Promise.all([
		userConfigs.save(),
		interaction.message.edit({
			components: [makeSelectTagsChannelContainer(compressedAuthorId, interaction, userConfigs, translator)],
		}),
		interaction.deleteReply(),
	]);
}

const options = new CommandOptions()
	.addOptions(
		new CommandFlag()
			.setShort('e')
			.setLong([ 'efímero', 'efimero', 'ephemeral' ])
			.setDesc('para que solo tú puedas ver la respuesta'),
	);

const tags = new CommandTags().add('COMMON');

const command = new Command('yo', tags)
	.setAliases(
		'usuario', 'configurar', 'configuración', 'configuracion', 'preferencias',
		'me', 'myself', 'configs', 'config',
	)
	.setBriefDescription('Para ver y configurar tus preferencias por medio de un Asistente')
	.setLongDescription(
		'Para ver y configurar tus preferencias.',
		'Si quieres cambiar alguna configuración, puedes presionar cualquier botón para proceder con el Asistente',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const userQuery = { userId: request.userId };

		let [userConfigs] = await Promise.all([
			UserConfigs.findOne(userQuery),
			request.deferReply(
				args.hasFlag('efímero') ? { flags: MessageFlags.Ephemeral } : {}
			),
		]);

		if(!userConfigs) {
			userConfigs = new UserConfigs(userQuery);
			await userConfigs.save();
		}

		const translator = new Translator(userConfigs.language);
		return request.editReply({
			flags: MessageFlags.IsComponentsV2,
			components: [makeDashboardContainer(request, userConfigs, translator)],
		});
	})
	.setButtonResponse(async function goToDashboard(interaction, authorId) {
		const { user } = interaction;

		const userConfigs = await UserConfigs.findOne({ userId: user.id });
		if(!userConfigs)
			return interaction.reply({ content: userNotAvailableText, ephemeral: true });

		const translator = new Translator(userConfigs.language);

		if(compressId(user.id) !== authorId)
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		return interaction.update({
			components: [makeDashboardContainer(interaction, userConfigs, translator)],
		});
	})
	.setSelectMenuResponse(async function selectLanguage(interaction) {
		const { user } = interaction;

		const userConfigs = await UserConfigs.findOne({ userId: user.id });
		if(!userConfigs)
			return interaction.reply({ content: userNotAvailableText, ephemeral: true });

		let translator = new Translator(userConfigs.language);

		const newLanguage = interaction.values[0];
		if(!newLanguage || !isValidLocaleKey(newLanguage))
			return interaction.deleteReply();

		userConfigs.language = newLanguage;
		translator = new Translator(newLanguage);

		await userConfigs.save().then(() => recacheUser(user.id));

		return interaction.update({
			components: [makeDashboardContainer(interaction, userConfigs, translator)],
		});
	}, { userFilterIndex: 0 })
	.setButtonResponse(async function promptSetTimezone(interaction) {
		const { user } = interaction;

		const userConfigs = await UserConfigs.findOne({ userId: user.id });
		if(!userConfigs)
			return interaction.reply({ content: userNotAvailableText, ephemeral: true });

		const translator = new Translator(userConfigs.language);

		const modal = new ModalBuilder()
			.setCustomId('yo_setTimezone')
			.setTitle(translator.getText('yoTimezoneModalTitle'))
			.addTextDisplayComponents(textDisplay =>
				textDisplay.setContent(translator.getText('yoTimezoneModalTutorial'))
			)
			.addLabelComponents(label =>
				label
					.setLabel(translator.getText('yoTimezoneModalTimezoneLabel'))
					.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId('inputTimezone')
						.setPlaceholder(translator.getText('yoTimezoneModalTimezonePlaceholder'))
						.setMinLength(0)
						.setMaxLength(32)
						.setRequired(false)
						.setValue(`${userConfigs.tzCode || 'UTC'}`)
						.setStyle(TextInputStyle.Short)
					),
			);

		return interaction.showModal(modal);
	}, { userFilterIndex: 0 })
	.setModalResponse(async function setTimezone(interaction) {
		const { user } = interaction;

		const userConfigs = await UserConfigs.findOne({ userId: user.id });
		if(!userConfigs)
			return interaction.reply({
				content: userNotAvailableText,
				ephemeral: true,
			});

		const translator = new Translator(userConfigs.language);

		const tzCode = interaction.fields.getTextInputValue('inputTimezone');
		if(tzCode?.length) {
			const sanitizedTzCode = sanitizeTzCode(tzCode);
			const utcOffset = toUtcOffset(sanitizedTzCode);

			if(utcOffset == null)
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('yoTimezoneInvalidTimezone'),
				});

			userConfigs.tzCode = sanitizedTzCode || 'UTC';
		} else {
			userConfigs.tzCode = null;
		}

		return Promise.all([
			userConfigs.save().then(() => recacheUser(user.id)),
			interaction.update({
				components: [makeDashboardContainer(interaction, userConfigs, translator)],
			}),
		]);
	})
	.setSelectMenuResponse(async function selectConfig(interaction, compressedAuthorId) {
		const selected = interaction.values[0];

		const { user } = interaction;

		if(selected === 'feed')
			return makeSelectFeedTCResponse(interaction, compressedAuthorId);

		const userConfigs = await UserConfigs.findOne({ userId: user.id });
		if(!userConfigs)
			return interaction.reply({ content: userNotAvailableText, ephemeral: true });

		const translator = new Translator(userConfigs.language);

		if(user.id !== decompressId(compressedAuthorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		userConfigs.voice.ping ??= 'always';

		switch(selected) {
		case 'voice':
			return interaction.update({
				components: [makeVoiceContainer(compressedAuthorId, userConfigs, translator)],
			});

		case 'pixiv':
			return interaction.update({
				components: [makePixivServicePickerContainer(compressedAuthorId, userConfigs.pixivConverter, translator)],

			});

		default:
			return interaction.update({
				components: [makeTwitterServicePickerContainer(compressedAuthorId, userConfigs.twitterPrefix, translator)],
			});
		}
	})
	.setSelectMenuResponse(async function setVoicePing(interaction, compressedAuthorId) {
		const { user } = interaction;

		const userConfigs = await UserConfigs.findOne({ userId: user.id });
		if(!userConfigs)
			return interaction.reply({ content: userNotAvailableText, ephemeral: true });

		const translator = new Translator(userConfigs.language as LocaleKey);

		let pingMode = interaction.values[0] as 'always' | 'onCreate' | 'never';
		userConfigs.voice.ping = pingMode;
		userConfigs.markModified('voice');

		return Promise.all([
			userConfigs.save(),
			interaction.update({
				components: [makeVoiceContainer(compressedAuthorId, userConfigs, translator)],
			}),
		]);
	}, { userFilterIndex: 0 })
	.setButtonResponse(async function setVoiceAutoname(interaction) {
		const { user } = interaction;

		const userConfigs = await UserConfigs.findOne({ userId: user.id });
		if(!userConfigs)
			return interaction.reply({ content: userNotAvailableText, ephemeral: true });

		const translator = new Translator(userConfigs.language);

		const modal = new ModalBuilder()
			.setCustomId('yo_applyVoiceAutoname')
			.setTitle(translator.getText('yoVoiceAutonameModalTitle'))
			.addLabelComponents(
				label => label
					.setLabel(translator.getText('name'))
					.setTextInputComponent(textInput =>
						textInput
							.setCustomId('inputName')
							.setPlaceholder(translator.getText('yoVoiceAutonameModalNamingPlaceholder'))
							.setMinLength(0)
							.setMaxLength(24)
							.setRequired(false)
							.setValue(userConfigs.voice?.autoname ?? '')
							.setStyle(TextInputStyle.Short)
					),
				label => label
					.setLabel(translator.getText('emoji'))
					.setTextInputComponent(textInput =>
						textInput
							.setCustomId('inputEmoji')
							.setPlaceholder(translator.getText('yoVoiceAutonameModalEmojiPlaceholder'))
							.setMinLength(0)
							.setMaxLength(2)
							.setRequired(false)
							.setValue(userConfigs.voice?.autoemoji ?? '')
							.setStyle(TextInputStyle.Short)
					),
			);

		return interaction.showModal(modal);
	}, { userFilterIndex: 0 })
	.setModalResponse(async function applyVoiceAutoname(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const { user } = interaction;

		const userConfigs = await UserConfigs.findOne({ userId: user.id });
		if(!userConfigs)
			return interaction.editReply({ content: userNotAvailableText });

		userConfigs.voice.autoname = interaction.fields.getTextInputValue('inputName');
		userConfigs.voice.autoemoji = interaction.fields.getTextInputValue('inputEmoji');

		await userConfigs.save();

		const translator = new Translator(userConfigs.language as LocaleKey);

		await interaction.message.edit({
			components: [makeVoiceContainer(compressId(interaction.user.id), userConfigs, translator)]
		}).catch(console.error);

		return interaction.editReply({ content: translator.getText('yoVoiceAutonameSuccess') });
	})
	.setButtonResponse(async function setVoiceKillDelay(interaction) {
		const { user } = interaction;

		const userConfigs = await UserConfigs.findOne({ userId: user.id });
		if(!userConfigs)
			return interaction.reply({ content: userNotAvailableText, ephemeral: true });

		const translator = new Translator(userConfigs.language as LocaleKey);

		const modal = new ModalBuilder()
			.setCustomId('yo_applyVoiceKillDelay')
			.setTitle(translator.getText('yoVoiceKillDelayModalTitle'))
			.addComponents(
				makeTextInputRowBuilder().addComponents(new TextInputBuilder()
					.setCustomId('inputDuration')
					.setLabel(translator.getText('yoVoiceKillDelayModalDelayLabel'))
					.setPlaceholder(translator.getText('yoVoiceKillDelayModalDelayPlaceholder'))
					.setMinLength(0)
					.setMaxLength(10)
					.setRequired(false)
					.setValue(userConfigs.voice?.killDelay ? `${userConfigs.voice.killDelay}` : '')
					.setStyle(TextInputStyle.Short)),
			);

		return interaction.showModal(modal);
	}, { userFilterIndex: 0 })
	.setModalResponse(async function applyVoiceKillDelay_PENDING(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const { user } = interaction;

		const userConfigs = await UserConfigs.findOne({ userId: user.id });
		if(!userConfigs)
			return interaction.editReply({ content: userNotAvailableText });

		//FIXME: esto está completamente mal. Parsear formato XXm XXs luego
		const killDelay = +interaction.fields.getTextInputValue('inputDuration');
		userConfigs.voice.killDelay = isNaN(killDelay) ? 0 : killDelay;

		await userConfigs.save();

		const translator = new Translator(userConfigs.language as LocaleKey);

		await interaction.message.edit({
			components: [makeVoiceContainer(compressId(interaction.user.id), userConfigs, translator)],
		}).catch(console.error);

		return interaction.editReply({ content: translator.getText('yoVoiceKillDelaySuccess') });
	})
	.setSelectMenuResponse(async function setPixivConvert(interaction, compressedAuthorId) {
		const { user } = interaction;

		const [userConfigs] = await Promise.all([
			UserConfigs.findOne({ userId: user.id }),
			interaction.deferReply({ flags: MessageFlags.Ephemeral }),
		]);
		if(!userConfigs)
			return interaction.editReply({ content: userNotAvailableText });

		const translator = new Translator(userConfigs.language);

		if(user.id !== decompressId(compressedAuthorId))
			return interaction.editReply({ content: translator.getText('unauthorizedInteraction') });

		let service = interaction.values[0];
		if(service === 'none') service = '';

		if(service !== '' && service !== 'phixiv')
			throw 'Resultado de servicio de conversión de pixiv inesperado';

		userConfigs.pixivConverter = service;

		return Promise.all([
			userConfigs.save().then(() => recacheUser(user.id)),
			interaction.message.edit({
				components: [makePixivServicePickerContainer(compressedAuthorId, userConfigs.pixivConverter, translator)],
			}),
			interaction.editReply({ content: translator.getText('yoConversionServiceSuccess') }),
		]);
	}, { userFilterIndex: 0 })
	.setSelectMenuResponse(async function setTwitterConvert(interaction, compressedAuthorId) {
		const { user } = interaction;

		const [userConfigs] = await Promise.all([
			UserConfigs.findOne({ userId: user.id }),
			interaction.deferReply({ flags: MessageFlags.Ephemeral }),
		]);
		if(!userConfigs)
			return interaction.editReply({ content: userNotAvailableText });

		const translator = new Translator(userConfigs.language);

		if(user.id !== decompressId(compressedAuthorId))
			return interaction.editReply({ content: translator.getText('unauthorizedInteraction') });

		let service = interaction.values[0] as AcceptedTwitterConverterKey | 'none' | '';
		if(service === 'none') service = '';

		if(!acceptedTwitterConverters.includes(service))
			throw 'Resultado de servicio de conversión de Twitter inesperado';

		userConfigs.twitterPrefix = service;

		return Promise.all([
			userConfigs.save().then(() => recacheUser(user.id)),
			interaction.message.edit({
				components: [makeTwitterServicePickerContainer(compressedAuthorId, userConfigs.twitterPrefix, translator)],
			}),
			interaction.editReply({ content: translator.getText('yoConversionServiceSuccess') }),
		]);
	}, { userFilterIndex: 0 })
	.setButtonResponse(async function selectFeedTC(interaction, compressedAuthorId) {
		return makeSelectFeedTCResponse(interaction, compressedAuthorId);
	})
	.setSelectMenuResponse(async function modifyFollowedTags(interaction, compressedAuthorId, isAlt) {
		const { user } = interaction;
		const channelId = isAlt ? interaction.channelId : interaction.values[0];

		const userConfigs = await UserConfigs.findOne({ userId: user.id });
		if(!userConfigs)
			return interaction.reply({ content: userNotAvailableText, ephemeral: true });

		const translator = new Translator(userConfigs.language);

		if(!channelId || channelId.startsWith('!'))
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidChannel'),
			});

		if(compressId(user.id) !== compressedAuthorId)
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('unauthorizedInteraction'),
			});

		return Promise.all([
			userConfigs.save(),
			interaction.update({
				components: [makeFollowedTagsContainer(compressedAuthorId, channelId, userConfigs, translator, !!isAlt)],
			}),
		]);
	})
	.setButtonResponse(async function editFT(interaction, authorId, channelId, operation, isAlt) {
		channelId = decompressId(channelId);
		const { user } = interaction;
		const translator = await Translator.from(user.id);

		if(compressId(user.id) !== authorId)
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		const tagsLabel = new LabelBuilder()
			.setTextInputComponent(textInput =>
				textInput
					.setCustomId('tagsInput')
					.setMinLength(1)
					.setMaxLength(160)
					.setPlaceholder('touhou animated 1girl')
					.setStyle(TextInputStyle.Paragraph)
			);

		let title;
		if(operation === 'ADD') {
			tagsLabel.setLabel(translator.getText('feedEditTagsInputAdd'));
			title = translator.getText('feedEditTagsTitleAdd');
		} else {
			tagsLabel.setLabel(translator.getText('feedEditTagsInputRemove'));
			title = translator.getText('feedEditTagsTitleRemove');
		}

		const modal = new ModalBuilder()
			.setCustomId(`yo_setFollowedTags_${operation}_${compressId(channelId)}${isAlt ? '_ALT' : ''}`)
			.setTitle(title)
			.addLabelComponents(tagsLabel);

		return interaction.showModal(modal).catch(auditError);
	})
	.setModalResponse(async function setFollowedTags(interaction, operation, customChannelId, isAlt) {
		const channelId = customChannelId ? decompressId(customChannelId) : interaction.channelId;
		const userId = interaction.user.id;
		const editedTags = interaction.fields.getTextInputValue('tagsInput').toLowerCase().split(/[ \n]+/).filter(t => t.length);

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const userQuery = { userId };
		const userConfigs = (await UserConfigs.findOne(userQuery)) || new UserConfigs(userQuery);
		const translator = new Translator(userConfigs.language);
		let newTags = userConfigs.feedTagSuscriptions.get(channelId)?.slice(0) ?? [];
		let setTagsResponse: LocaleIds;
		let previousLength = newTags.length;

		if(operation === 'ADD') {
			newTags.push(...editedTags.filter(t => !newTags.includes(t)));
			newTags.splice(6);
			setTagsResponse = 'feedSetTagsAdd';
		} else {
			newTags = newTags.filter(t => !editedTags.includes(t));
			setTagsResponse = 'feedSetTagsRemove';
		}

		if(previousLength === newTags.length) {
			return interaction.editReply({
				content: translator.getText('feedSetTagsUnchanged'),
			});
		}

		if(newTags.length)
			userConfigs.feedTagSuscriptions.set(channelId, newTags);
		else
			userConfigs.feedTagSuscriptions.delete(channelId);
		userConfigs.markModified('feedTagSuscriptions');

		await userConfigs.save();

		updateFollowedFeedTagsCache(userId, channelId, newTags);

		return Promise.all([
			interaction.message.edit({
				content: translator.getText(setTagsResponse, editedTags.join(' ')),
				components: [makeFollowedTagsContainer(compressId(userId), channelId, userConfigs, translator, !!isAlt)],
			}),
			interaction.deleteReply(),
		]);
	})
	.setButtonResponse(async function cancelWizard(interaction) {
		const translator = await Translator.from(interaction);

		const container = new ContainerBuilder()
			.addTextDisplayComponents(textDisplay =>
				textDisplay.setContent(translator.getText('yoCancelledStep'))
			);

		return interaction.update({
			components: [container],
		});
	}, { userFilterIndex: 0 })
	.setButtonResponse(async function exitWizard(interaction) {
		const translator = await Translator.from(interaction);

		const finishContainer = new ContainerBuilder()
			.addTextDisplayComponents(textDisplay =>
				textDisplay.setContent(translator.getText('yoFinishedStep'))
			);

		return interaction.update({
			components: [finishContainer],
		});
	}, { userFilterIndex: 0 });

export default command;
