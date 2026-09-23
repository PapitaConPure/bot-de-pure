import { hoursToMilliseconds } from 'date-fns';
import type { Interaction, MessageComponentInteraction, User } from 'discord.js';
import {
	ButtonBuilder,
	ButtonStyle,
	Colors,
	ContainerBuilder,
	LabelBuilder,
	MessageFlags,
	ModalBuilder,
	SeparatorSpacingSize,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	TextDisplayBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';
import type { AnyCommandInteraction, ComplexCommandRequest } from 'types/commands';
import { tenshiAltColor, tenshiColor, tenshiPeachColor } from '@/data/globalProps';
import type { LocaleIds } from '@/i18n';
import { isValidLocaleKey, Locales, Translator } from '@/i18n';
import type { UserConfigDocument, UserConfigSchemaType } from '@/models/userconfigs';
import UserConfigModel from '@/models/userconfigs';
import { updateFollowedFeedTagsCache } from '@/systems/booru/boorufeed';
import { BooruSourceStyles } from '@/systems/booru/boorusources';
import {
	type AcceptedGelbooruConverterKey,
	type AcceptedInstagramConverterKey,
	type AcceptedPixivConverterKey,
	type AcceptedTwitterConverterKey,
	acceptedGelbooruConverters,
	acceptedInstagramConverters,
	acceptedPixivConverters,
	acceptedTwitterConverters,
	instagramConversionServices,
	pixivConversionServices,
	twitterConversionServices,
} from '@/systems/converters/instances';
import { auditError } from '@/systems/others/auditor';
import { makeSessionAutoname } from '@/systems/others/purevoice';
import { getBotEmoji, getBotEmojiResolvable, parseUnicodeEmoji } from '@/utils/emojis';
import { compressId, decompressId } from '@/utils/encoding';
import { millisecondsToDuration } from '@/utils/formatting';
import { improveNumber, shortenText } from '@/utils/misc';
import { parseDuration } from '@/utils/parsing';
import { sanitizeTzCode, toUtcOffset, utcOffsetDisplayFull } from '@/utils/timezones';
import { recacheUser } from '@/utils/usercache';
import { Command, CommandFlag, CommandOptions, CommandTags } from '../commons';

const userNotAvailableText =
	'⚠️ Usuario no disponible / User unavailable / ユーザーは利用できません';

const backToDashboardButton = (compressedAuthorId: string) =>
	new ButtonBuilder()
		.setCustomId(`yo_goToDashboard_${compressedAuthorId}`)
		.setEmoji(getBotEmojiResolvable('navBackAccent'))
		.setStyle(ButtonStyle.Secondary);

const cancelButton = (compressedAuthorId: string) =>
	new ButtonBuilder()
		.setCustomId(`yo_cancelWizard_${compressedAuthorId}`)
		.setEmoji(getBotEmojiResolvable('xmarkAccent'))
		.setStyle(ButtonStyle.Secondary);

async function getWizardContext(
	request: AnyCommandInteraction,
	options: {
		notEphemeral?: boolean;
		editReply?: boolean;
	} = {},
): Promise<
	| {
			success: true;
			context: { user: User; userConfigs: UserConfigDocument; translator: Translator };
	  }
	| { success: false; context: null }
> {
	const { notEphemeral = false, editReply = false } = options;
	const { user } = request;

	const userConfigs = await UserConfigModel.findOne({ userId: request.user.id });
	if (!userConfigs) {
		if (editReply) await request.editReply({ content: userNotAvailableText });
		else
			await request.reply({
				content: userNotAvailableText,
				flags: notEphemeral ? undefined : MessageFlags.Ephemeral,
			});

		return { success: false, context: null };
	}

	const translator = new Translator(userConfigs.language);

	return { success: true, context: { user, userConfigs, translator } };
}

function makeDashboardContainer(
	request: Interaction | ComplexCommandRequest,
	userConfigs: UserConfigSchemaType,
	translator: Translator,
) {
	//const suscriptions = [...userConfigs.feedTagSuscriptions.values()];
	//const suscriptionsFeedCount = suscriptions.length ? suscriptions.map(a => a.length ?? 0).reduce((a, b) => a + b) : 0;
	//const suscriptionsServerCount = userConfigs.feedTagSuscriptions.size;
	//const now = new Date(Date.now());
	//const unix = getUnixTime(now);
	const { tzCode, prc } = userConfigs;
	const compressedUserId = compressId(request.user.id);

	const container = new ContainerBuilder()
		.setAccentColor(tenshiColor)
		.addSectionComponents((section) =>
			section
				.addTextDisplayComponents(
					(textDisplay) =>
						textDisplay.setContent(translator.getText('yoDashboardEpigraph')),
					(textDisplay) => textDisplay.setContent(`# ${request.user.displayName}`),
					(textDisplay) =>
						textDisplay.setContent(
							translator.getText(
								'yoDashboardPRC',
								improveNumber(prc, { shorten: true, translator }),
							),
						),
				)
				.setThumbnailAccessory((thumbnail) =>
					thumbnail
						.setDescription(
							translator.getText('avatarGlobalAvatarAlt', request.user.displayName),
						)
						.setURL(request.user.displayAvatarURL({ size: 256 })),
				),
		)
		.addSeparatorComponents((separator) => separator.setDivider(true))
		.addSectionComponents((section) =>
			section
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(
						[
							translator.getText('yoDashboardTimezoneName'),
							tzCode?.length
								? `${getBotEmoji('clockAccent')} ${utcOffsetDisplayFull(tzCode)}`
								: translator.getText('yoDashboardNoTZ'),
						].join('\n'),
					),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(`yo_promptSetTimezone_${compressedUserId}`)
						.setEmoji(getBotEmojiResolvable('pencilWhite'))
						.setLabel(translator.getText('buttonEdit'))
						.setStyle(ButtonStyle.Primary),
				),
		)
		.addSeparatorComponents((separator) => separator.setDivider(true))
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(translator.getText('yoDashboardLanguageName')),
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`yo_selectLanguage_${compressedUserId}`)
					.setPlaceholder(translator.getText('languageMenuPlaceholder'))
					.setOptions(
						Object.values(Locales).map((locale) => {
							const subTranslator = new Translator(locale);
							return new StringSelectMenuOptionBuilder()
								.setLabel(subTranslator.getText('currentLanguage'))
								.setEmoji(subTranslator.getText('currentLanguageEmojiId'))
								.setValue(locale)
								.setDefault(translator.locale === subTranslator.locale);
						}),
					),
			),
		)
		.addSeparatorComponents((separator) => separator.setDivider(true))
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(translator.getText('yoDashboardOtherConfigsName')),
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`yo_selectConfig_${compressedUserId}`)
					.setPlaceholder(translator.getText('yoDashboardMenuConfig'))
					.setOptions([
						{
							label: 'Boorutato',
							description: translator.getText('yoDashboardMenuConfigFeedDesc'),
							emoji: getBotEmojiResolvable('boorutatoFullColor'),
							value: 'feed',
						},
						{
							label: 'PuréVoice',
							description: translator.getText('yoDashboardMenuConfigVoiceDesc'),
							emoji: getBotEmojiResolvable('purevoiceFullColor'),
							value: 'voice',
						},
						{
							label: 'PuréPix',
							description: translator.getText('yoDashboardMenuConfigPixixDesc'),
							emoji: getBotEmojiResolvable('pixivFullColor'),
							value: 'pixiv',
						},
						{
							label: 'Puréet',
							description: translator.getText('yoDashboardMenuConfigTwitterDesc'),
							emoji: getBotEmojiResolvable('twitterFullColor'),
							value: 'twitter',
						},
						{
							label: 'BoorutatoConvert',
							description: translator.getText('yoDashboardMenuConfigBoorutatoDesc'),
							emoji: getBotEmojiResolvable('boorutatoFullColor'),
							value: 'booru',
						},
						{
							label: 'Puréstagram',
							description: translator.getText('yoDashboardMenuConfigInstagramDesc'),
							emoji: getBotEmojiResolvable('instagramColor'),
							value: 'instagram',
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
					.setCustomId(`yo_exitWizard_${compressedUserId}`)
					.setLabel(translator.getText('buttonClose'))
					.setStyle(ButtonStyle.Secondary),
			),
		);

	return container;
}

const makeVoiceContainer = (
	compressedAuthorId: string,
	userConfigs: UserConfigSchemaType,
	translator: Translator,
) => {
	const container = new ContainerBuilder()
		.setAccentColor(tenshiAltColor)
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(
				`${translator.getText('yoVoiceTitle')}\n${translator.getText('yoVoiceDescription')}`,
			),
		)
		.addSeparatorComponents((separator) => separator.setDivider(true))
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(translator.getText('yoVoicePingName')),
		)
		.addActionRowComponents((actionRow) =>
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
					),
			),
		)
		.addSeparatorComponents((separator) => separator.setDivider(true))
		.addSectionComponents((section) =>
			section
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(
						[
							translator.getText('yoVoiceAutonameName'),
							makeSessionAutoname(userConfigs)
								?? translator.getText('yoVoiceAutonameValueNone'),
						].join('\n'),
					),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(`yo_setVoiceAutoname_${compressedAuthorId}`)
						.setEmoji(getBotEmojiResolvable('pencilWhite'))
						.setLabel(translator.getText('buttonEdit'))
						.setStyle(ButtonStyle.Primary),
				),
		)
		.addSeparatorComponents((separator) => separator.setDivider(true))
		.addSectionComponents((textDisplay) =>
			textDisplay
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(
						[
							translator.getText('yoVoiceKillDelayName'),
							userConfigs.voice.killDelay
								? millisecondsToDuration(userConfigs.voice.killDelay)
								: `_${translator.getText('disabled')}_`,
						].join('\n'),
					),
				)
				.setButtonAccessory(
					new ButtonBuilder()
						.setCustomId(`yo_setVoiceKillDelay_${compressedAuthorId}`)
						.setEmoji(getBotEmojiResolvable('pencilWhite'))
						.setLabel(translator.getText('buttonEdit'))
						.setStyle(ButtonStyle.Primary),
				),
		)
		.addSeparatorComponents((separator) =>
			separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large),
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				backToDashboardButton(compressedAuthorId),
				cancelButton(compressedAuthorId),
			),
		);

	return container;
};

interface ConverterWizardServiceOption<TConverterKey extends string> {
	value: TConverterKey;
	label: string;
	description?: string;
}

interface ConverterWizard<TConverterKey extends string> {
	title: LocaleIds;
	description: LocaleIds;
	serviceColor: number;
	serviceNoneDescription: LocaleIds;
	services: ReadonlyArray<TConverterKey | ''>;
	getServiceOptions: (translator: Translator) => ConverterWizardServiceOption<TConverterKey>[];
	getKey: (userConfigs: UserConfigDocument) => TConverterKey | '';
	setKey: (userConfigs: UserConfigDocument, key: TConverterKey | '') => void;
}

const converterWizards = {
	twitter: {
		title: 'yoTwitterTitle',
		description: 'yoTwitterDesc',
		serviceColor: BooruSourceStyles.twitter.color,
		serviceNoneDescription: 'yoTwitterMenuServiceNoneDesc',
		services: acceptedTwitterConverters,
		getServiceOptions: (translator) => [
			{
				value: 'vx',
				label: twitterConversionServices.vx.name,
				description: translator.getText('yoTwitterMenuServiceVxDesc'),
			},
			{
				value: 'fx',
				label: twitterConversionServices.fx.name,
				description: translator.getText('yoTwitterMenuServiceFxDesc'),
			},
			{
				value: 'girlcockx',
				label: twitterConversionServices.girlcockx.name,
			},
			{
				value: 'cunnyx',
				label: twitterConversionServices.cunnyx.name,
			},
		],
		getKey: (userConfigs) => userConfigs.twitterPrefix,
		setKey: (userConfigs, key) => (userConfigs.twitterPrefix = key),
	} as ConverterWizard<AcceptedTwitterConverterKey>,
	pixiv: {
		title: 'yoPixivTitle',
		description: 'yoPixivDesc',
		serviceColor: BooruSourceStyles.pixiv.color,
		serviceNoneDescription: 'yoPixivMenuServiceNoneDesc',
		services: acceptedPixivConverters,
		getServiceOptions: (translator) => [
			{
				value: 'phixiv',
				label: pixivConversionServices.phixiv.name,
				description: translator.getText('yoPixivMenuServicePhixivDesc'),
			},
		],
		getKey: (userConfigs) => userConfigs.pixivConverter,
		setKey: (userConfigs, key) => (userConfigs.pixivConverter = key),
	} as ConverterWizard<AcceptedPixivConverterKey>,
	instagram: {
		title: 'yoInstagramTitle',
		description: 'yoInstagramDesc',
		serviceColor: BooruSourceStyles.instagram.color,
		serviceNoneDescription: 'yoInstagramMenuServiceNoneDesc',
		services: acceptedInstagramConverters,
		getServiceOptions: (translator) => [
			{
				value: 'dd',
				label: instagramConversionServices.dd.name,
				description: translator.getText('yoInstagramMenuServiceDdinstagramDesc'),
			},
			{
				value: 'ddd',
				label: instagramConversionServices.ddd.name,
				description: translator.getText('yoInstagramMenuServiceDddinstagramDesc'),
			},
			{
				value: 'gdd',
				label: instagramConversionServices.gdd.name,
				description: translator.getText('yoInstagramMenuServiceGddinstagramDesc'),
			},
			{
				value: 'kk',
				label: instagramConversionServices.kk.name,
			},
			{
				value: 'ez',
				label: instagramConversionServices.ez.name,
			},
			{
				value: 'dogin',
				label: instagramConversionServices.dogin.name,
			},
		],
		getKey: (userConfigs) => userConfigs.instagramConverter,
		setKey: (userConfigs, key) => (userConfigs.instagramConverter = key),
	} as ConverterWizard<AcceptedInstagramConverterKey>,
} as const;
type ConverterWizardKey = keyof typeof converterWizards;

function makeConverterServicePickerContainer<
	TConverterWizardKey extends ConverterWizardKey,
	TConverterKey extends string = ReturnType<
		(typeof converterWizards)[TConverterWizardKey]['getKey']
	>,
>(
	converterWizardKey: TConverterWizardKey,
	compressedAuthorId: string,
	service: TConverterKey | 'none' | '',
	translator: Translator,
) {
	const converterWizard = converterWizards[converterWizardKey];
	const container = new ContainerBuilder()
		.setAccentColor(converterWizard.serviceColor)
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(
				[
					translator.getText(converterWizard.title),
					translator.getText(converterWizard.description),
				].join('\n'),
			),
		)
		.addSeparatorComponents((separator) => separator.setDivider(true))
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(translator.getText('yoConversionServiceName')),
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`yo_setConvert_${compressedAuthorId}_${converterWizardKey}`)
					.setPlaceholder(translator.getText('yoConversionServiceMenuService'))
					.setOptions([
						{
							value: 'none',
							label: translator.getText('yoConversionServiceMenuServiceNoneLabel'),
							description: translator.getText(converterWizard.serviceNoneDescription),
							default: service === 'none' || !service,
						},
						...converterWizard
							.getServiceOptions(translator)
							.map((s: ConverterWizardServiceOption<string>) => ({
								...s,
								default: service === s.value,
							})),
					]),
			),
		)
		.addSeparatorComponents((separator) =>
			separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large),
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				backToDashboardButton(compressedAuthorId),
				cancelButton(compressedAuthorId),
			),
		);

	return container;
}

const makeBoorutatoServicePickerContainer = (
	compressedAuthorId: string,
	services: { gelbooru: AcceptedGelbooruConverterKey | '' },
	translator: Translator,
) => {
	const hasGelbooru = services.gelbooru !== '';

	const container = new ContainerBuilder()
		.setAccentColor(tenshiPeachColor)
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(
				[
					translator.getText('yoBoorutatoTitle'),
					translator.getText('yoBoorutatoDesc'),
				].join('\n'),
			),
		)
		.addSeparatorComponents((separator) => separator.setDivider(true))
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(`### -# ${getBotEmoji('gelbooruColor')} Gelbooru`),
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`yo_setBooruConvert_${compressedAuthorId}_gelbooru`)
					.setPlaceholder(translator.getText('yoConversionServiceMenuService'))
					.setOptions(
						{
							value: 'none',
							label: translator.getText('disabled'),
							description: translator.getText('yoBoorutatoMenuServiceDisabledDesc'),
							default: !hasGelbooru,
						},
						{
							value: 'boorutato',
							label: translator.getText('enabled'),
							description: translator.getText('yoBoorutatoMenuServiceEnabledDesc'),
							default: hasGelbooru,
						},
					),
			),
		)
		.addSeparatorComponents((separator) =>
			separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large),
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				backToDashboardButton(compressedAuthorId),
				cancelButton(compressedAuthorId),
			),
		);

	return container;
};

function makeSelectTagsChannelContainer(
	compressedAuthorId: string,
	request: MessageComponentInteraction,
	userConfigs: UserConfigSchemaType,
	translator: Translator,
) {
	const container = new ContainerBuilder()
		.setAccentColor(tenshiAltColor)
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(translator.getText('yoSelectTagsChannelTitle')),
		)
		.addActionRowComponents(
			(actionRow) =>
				actionRow.addComponents(
					new StringSelectMenuBuilder()
						.setCustomId(`yo_modifyFollowedTags_${compressedAuthorId}`)
						.setOptions(
							[...userConfigs.feedTagSuscriptions.entries()].map(
								([channelId, tags]) => {
									const channel = request.client?.channels.cache.get(channelId);
									if (!channel || channel.isDMBased() || !channel.isSendable())
										return {
											label: translator.getText('invalidChannel'),
											value: `!${channelId}`,
										};

									return {
										label: shortenText(tags.join(' ') || '...', 99, '…'),
										description: `#${channel.name ?? '???'}`,
										value: channelId,
									};
								},
							),
						)
						.setPlaceholder(translator.getText('feedSelectFeed')),
				),
			(actionRow) =>
				actionRow.addComponents(
					backToDashboardButton(compressedAuthorId),
					cancelButton(compressedAuthorId),
				),
		);

	return container;
}

function makeFollowedTagsContainer(
	compressedAuthorId: string,
	channelId: string,
	userConfigs: UserConfigSchemaType,
	translator: Translator,
	isAlt: boolean,
) {
	const compressedChannelId = compressId(channelId);

	const container = new ContainerBuilder()
		.setAccentColor(Colors.LuminousVividPink)
		.addTextDisplayComponents(
			(textDisplay) => textDisplay.setContent(`## ${translator.getText('yoTagsName')}`),
			(textDisplay) =>
				textDisplay.setContent(
					`\`\`\`\n${userConfigs.feedTagSuscriptions.get(channelId)?.join(' ') || translator.getText('yoTagsValueDefault')}\n\`\`\``,
				),
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new ButtonBuilder()
					.setCustomId(
						`yo_editFT_${compressedAuthorId}_${compressedChannelId}_ADD${isAlt ? '_ALT' : ''}`,
					)
					.setEmoji(getBotEmojiResolvable('tagPlus'))
					.setLabel(translator.getText('feedSetTagsButtonAdd'))
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId(
						`yo_editFT_${compressedAuthorId}_${compressedChannelId}_REMOVE${isAlt ? '_ALT' : ''}`,
					)
					.setEmoji(getBotEmojiResolvable('tagMinus'))
					.setLabel(translator.getText('feedSetTagsButtonRemove'))
					.setStyle(ButtonStyle.Danger),
				new ButtonBuilder()
					.setCustomId(`yo_selectFeedTC_${compressedAuthorId}`)
					.setEmoji(getBotEmojiResolvable('navBackAccent'))
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(!!isAlt),
				cancelButton(compressedAuthorId).setDisabled(!!isAlt),
			),
		);

	return container;
}

async function makeSelectFeedTCResponse(
	interaction: MessageComponentInteraction,
	compressedAuthorId: string,
) {
	const { user } = interaction;

	const [userConfigs] = await Promise.all([
		UserConfigModel.findOne({ userId: user.id }),
		interaction.deferReply({ flags: MessageFlags.Ephemeral }),
	]);

	if (!userConfigs) return interaction.editReply({ content: userNotAvailableText });

	const translator = new Translator(userConfigs.language);

	if (user.id !== decompressId(compressedAuthorId))
		return interaction.editReply({ content: translator.getText('unauthorizedInteraction') });

	if (userConfigs.feedTagSuscriptions.size === 0)
		return interaction.editReply({ content: translator.getText('yoFeedEmptyError') });

	return Promise.all([
		userConfigs.save(),
		interaction.message.edit({
			components: [
				makeSelectTagsChannelContainer(
					compressedAuthorId,
					interaction,
					userConfigs,
					translator,
				),
			],
		}),
		interaction.deleteReply(),
	]);
}

const options = new CommandOptions().addOptions(
	new CommandFlag()
		.setShort('e')
		.setLong(['efímero', 'efimero', 'ephemeral'])
		.setDesc('para que solo tú puedas ver la respuesta'),
);

const tags = new CommandTags().add('COMMON');

const command = new Command(
	{
		es: 'yo',
		en: 'me',
		ja: 'watashi',
	},
	tags,
)
	.setAliases(
		'usuario',
		'configurar',
		'configuración',
		'configuracion',
		'preferencias',
		'me',
		'self',
		'myself',
		'atashi',
		'ateshi',
		'atishi',
		'boku',
		'ore',
		'configs',
		'config',
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
			UserConfigModel.findOne(userQuery),
			request.deferReply(args.hasFlag('efímero') ? { flags: MessageFlags.Ephemeral } : {}),
		]);

		if (!userConfigs) {
			userConfigs = new UserConfigModel(userQuery);
			await userConfigs.save();
		}

		const translator = new Translator(userConfigs.language);
		return request.editReply({
			flags: MessageFlags.IsComponentsV2,
			components: [makeDashboardContainer(request, userConfigs, translator)],
		});
	})
	.setButtonResponse(async function goToDashboard(interaction, authorId) {
		const { success, context } = await getWizardContext(interaction);
		if (!success) return;
		const { user, userConfigs, translator } = context;

		if (compressId(user.id) !== authorId)
			return interaction.reply({
				content: translator.getText('unauthorizedInteraction'),
				flags: MessageFlags.Ephemeral,
			});

		return interaction.update({
			components: [makeDashboardContainer(interaction, userConfigs, translator)],
		});
	})
	.setSelectMenuResponse(
		async function selectLanguage(interaction) {
			const { success, context } = await getWizardContext(interaction);
			if (!success) return;
			const { user, userConfigs } = context;

			const newLanguage = interaction.values[0];
			if (!newLanguage || !isValidLocaleKey(newLanguage)) return interaction.deleteReply();

			userConfigs.language = newLanguage;
			const translator = new Translator(newLanguage);

			await userConfigs.save().then(() => recacheUser(user.id));

			return interaction.update({
				components: [makeDashboardContainer(interaction, userConfigs, translator)],
			});
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(
		async function promptSetTimezone(interaction) {
			const { success, context } = await getWizardContext(interaction);
			if (!success) return;
			const { userConfigs, translator } = context;

			const modal = new ModalBuilder()
				.setCustomId('yo_setTimezone')
				.setTitle(translator.getText('yoTimezoneModalTitle'))
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(translator.getText('yoTimezoneModalTutorial')),
				)
				.addLabelComponents((label) =>
					label
						.setLabel(translator.getText('yoTimezoneModalTimezoneLabel'))
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId('inputTimezone')
								.setPlaceholder(
									translator.getText('yoTimezoneModalTimezonePlaceholder'),
								)
								.setMinLength(0)
								.setMaxLength(32)
								.setRequired(false)
								.setValue(`${userConfigs.tzCode || 'UTC'}`)
								.setStyle(TextInputStyle.Short),
						),
				);

			return interaction.showModal(modal);
		},
		{ userFilterIndex: 0 },
	)
	.setModalResponse(async function setTimezone(interaction) {
		const { success, context } = await getWizardContext(interaction);
		if (!success) return;
		const { user, userConfigs, translator } = context;

		const tzCode = interaction.fields.getTextInputValue('inputTimezone');
		if (tzCode?.length) {
			const sanitizedTzCode = sanitizeTzCode(tzCode);
			const utcOffset = toUtcOffset(sanitizedTzCode);

			if (utcOffset == null)
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('invalidTimezone'),
				});

			userConfigs.tzCode = sanitizedTzCode || 'UTC';
		} else {
			userConfigs.tzCode = undefined;
		}

		return Promise.all([
			userConfigs.save().then(() => recacheUser(user.id)),
			interaction.update({
				components: [makeDashboardContainer(interaction, userConfigs, translator)],
			}),
		]);
	})
	.setSelectMenuResponse(
		async function selectConfig(interaction, compressedAuthorId) {
			const selected = interaction.values[0];

			if (selected === 'feed')
				return makeSelectFeedTCResponse(interaction, compressedAuthorId);

			const { success, context } = await getWizardContext(interaction);
			if (!success) return;
			const { userConfigs, translator } = context;

			userConfigs.voice.ping ??= 'always';

			switch (selected) {
				case 'voice':
					return interaction.update({
						components: [
							makeVoiceContainer(compressedAuthorId, userConfigs, translator),
						],
					});

				case 'pixiv':
				case 'twitter':
				case 'instagram':
					return interaction.update({
						components: [
							makeConverterServicePickerContainer(
								selected,
								compressedAuthorId,
								converterWizards[selected].getKey(userConfigs),
								translator,
							),
						],
					});

				case 'booru':
					return interaction.update({
						components: [
							makeBoorutatoServicePickerContainer(
								compressedAuthorId,
								{ gelbooru: userConfigs.gelbooruConverter },
								translator,
							),
						],
					});
			}
		},
		{ userFilterIndex: 0 },
	)
	.setSelectMenuResponse(
		async function setVoicePing(interaction, compressedAuthorId) {
			const { success, context } = await getWizardContext(interaction);
			if (!success) return;
			const { userConfigs, translator } = context;

			const pingMode = interaction.values[0] as 'always' | 'onCreate' | 'never';
			userConfigs.voice.ping = pingMode;
			userConfigs.markModified('voice');

			return Promise.all([
				userConfigs.save(),
				interaction.update({
					components: [makeVoiceContainer(compressedAuthorId, userConfigs, translator)],
				}),
			]);
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(
		async function setVoiceAutoname(interaction) {
			const { success, context } = await getWizardContext(interaction);
			if (!success) return;
			const { userConfigs, translator } = context;

			const modal = new ModalBuilder()
				.setCustomId('yo_applyVoiceAutoname')
				.setTitle(translator.getText('yoVoiceAutonameModalTitle'))
				.addLabelComponents(
					(label) =>
						label
							.setLabel(translator.getText('name'))
							.setTextInputComponent((textInput) =>
								textInput
									.setCustomId('inputName')
									.setPlaceholder(
										translator.getText('yoVoiceAutonameModalNamingPlaceholder'),
									)
									.setMinLength(0)
									.setMaxLength(24)
									.setRequired(false)
									.setValue(userConfigs.voice?.autoname ?? '')
									.setStyle(TextInputStyle.Short),
							),
					(label) =>
						label
							.setLabel(translator.getText('emoji'))
							.setTextInputComponent((textInput) =>
								textInput
									.setCustomId('inputEmoji')
									.setPlaceholder(
										translator.getText('yoVoiceAutonameModalEmojiPlaceholder'),
									)
									.setMinLength(0)
									.setMaxLength(2)
									.setRequired(false)
									.setValue(userConfigs.voice?.autoemoji ?? '')
									.setStyle(TextInputStyle.Short),
							),
				);

			return interaction.showModal(modal);
		},
		{ userFilterIndex: 0 },
	)
	.setModalResponse(async function applyVoiceAutoname(interaction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const { success, context } = await getWizardContext(interaction, { editReply: true });
		if (!success) return;
		const { userConfigs, translator } = context;

		const name = interaction.fields.getTextInputValue('inputName');
		const emoji = interaction.fields.getTextInputValue('inputEmoji');
		const unicodeEmoji = parseUnicodeEmoji(emoji);

		if (emoji.length && !unicodeEmoji)
			return interaction.editReply({
				content: translator.getText('invalidEmoji'),
			});

		userConfigs.voice.autoname = name;
		if (unicodeEmoji) userConfigs.voice.autoemoji = unicodeEmoji;

		userConfigs.markModified('voice');
		await userConfigs.save();

		await interaction.message
			.edit({
				components: [
					makeVoiceContainer(compressId(interaction.user.id), userConfigs, translator),
				],
			})
			.catch(console.error);

		return interaction.editReply({ content: translator.getText('yoVoiceAutonameSuccess') });
	})
	.setButtonResponse(
		async function setVoiceKillDelay(interaction) {
			const { success, context } = await getWizardContext(interaction);
			if (!success) return;
			const { userConfigs, translator } = context;

			const modal = new ModalBuilder()
				.setCustomId('yo_applyVoiceKillDelay')
				.setTitle(translator.getText('yoVoiceKillDelayModalTitle'))
				.addLabelComponents(
					new LabelBuilder()
						.setLabel(translator.getText('yoVoiceKillDelayModalDelayLabel'))
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId('inputDuration')
								.setPlaceholder(
									translator.getText('yoVoiceKillDelayModalDelayPlaceholder'),
								)
								.setMinLength(0)
								.setMaxLength(10)
								.setRequired(false)
								.setValue(
									userConfigs.voice?.killDelay
										? millisecondsToDuration(userConfigs.voice.killDelay)
										: '',
								)
								.setStyle(TextInputStyle.Short),
						),
				);

			return interaction.showModal(modal);
		},
		{ userFilterIndex: 0 },
	)
	.setModalResponse(async function applyVoiceKillDelay(interaction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const { success, context } = await getWizardContext(interaction, { editReply: true });
		if (!success) return;
		const { userConfigs, translator } = context;

		const killDelay = parseDuration(interaction.fields.getTextInputValue('inputDuration'));
		userConfigs.voice.killDelay =
			Number.isNaN(killDelay) || killDelay <= 0
				? undefined
				: Math.min(killDelay, hoursToMilliseconds(12));

		await userConfigs.save();

		await interaction.message
			.edit({
				components: [
					makeVoiceContainer(compressId(interaction.user.id), userConfigs, translator),
				],
			})
			.catch(console.error);

		return interaction.editReply({ content: translator.getText('yoVoiceKillDelaySuccess') });
	})
	.setSelectMenuResponse(
		async function setConvert(interaction, compressedAuthorId, converterWizardKey) {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			const { success, context } = await getWizardContext(interaction, { editReply: true });
			if (!success) return;
			const { user, userConfigs, translator } = context;

			if (!(converterWizardKey in converterWizards))
				throw new Error('Clave de asistente de conversión inesperada.');

			const converterWizard = converterWizards[converterWizardKey as ConverterWizardKey];
			let converterKey = interaction.values[0] as 'none' | '';
			if (converterKey === 'none') converterKey = '';

			if (!converterWizard.services.includes(converterKey))
				throw new Error('Resultado de servicio de conversión inesperado.');

			converterWizard.setKey(userConfigs, converterKey);

			return Promise.all([
				userConfigs.save().then(() => recacheUser(user.id)),
				interaction.message.edit({
					components: [
						makeConverterServicePickerContainer(
							converterWizardKey as ConverterWizardKey,
							compressedAuthorId,
							converterWizard.getKey(userConfigs),
							translator,
						),
					],
				}),
				interaction.editReply({
					content: translator.getText('yoConversionServiceSuccess'),
				}),
			]);
		},
		{ userFilterIndex: 0 },
	)
	.setSelectMenuResponse(
		async function setBooruConvert(interaction, compressedAuthorId, service) {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			const { success, context } = await getWizardContext(interaction, { editReply: true });
			if (!success) return;
			const { user, userConfigs, translator } = context;

			switch (service) {
				case 'gelbooru': {
					let converterKey = interaction.values[0] as
						| AcceptedGelbooruConverterKey
						| 'none'
						| '';
					if (converterKey === 'none') converterKey = '';

					if (!acceptedGelbooruConverters.includes(converterKey))
						throw new Error(
							`Resultado de servicio de conversión de Booru inesperado: ${converterKey}`,
						);

					userConfigs.gelbooruConverter = converterKey;
				}
			}

			return Promise.all([
				userConfigs.save().then(() => recacheUser(user.id)),
				interaction.message.edit({
					components: [
						makeBoorutatoServicePickerContainer(
							compressedAuthorId,
							{ gelbooru: userConfigs.gelbooruConverter },
							translator,
						),
					],
				}),
				interaction.editReply({
					content: translator.getText('yoConversionServiceSuccess'),
				}),
			]);
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(async function selectFeedTC(interaction, compressedAuthorId) {
		return makeSelectFeedTCResponse(interaction, compressedAuthorId);
	})
	.setSelectMenuResponse(
		async function modifyFollowedTags(interaction, compressedAuthorId, isAlt) {
			const channelId = isAlt ? interaction.channelId : interaction.values[0];

			const { success, context } = await getWizardContext(interaction);
			if (!success) return;
			const { user, userConfigs, translator } = context;

			if (!channelId || channelId.startsWith('!'))
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('invalidChannel'),
				});

			if (compressId(user.id) !== compressedAuthorId)
				return interaction.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('unauthorizedInteraction'),
				});

			return Promise.all([
				userConfigs.save(),
				interaction.update({
					components: [
						makeFollowedTagsContainer(
							compressedAuthorId,
							channelId,
							userConfigs,
							translator,
							!!isAlt,
						),
					],
				}),
			]);
		},
	)
	.setButtonResponse(async function editFT(interaction, authorId, channelId, operation, isAlt) {
		channelId = decompressId(channelId);
		const { user } = interaction;
		const translator = await Translator.fromUser(user);

		if (compressId(user.id) !== authorId)
			return interaction.reply({
				content: translator.getText('unauthorizedInteraction'),
				flags: MessageFlags.Ephemeral,
			});

		const tagsLabel = new LabelBuilder().setTextInputComponent((textInput) =>
			textInput
				.setCustomId('tagsInput')
				.setMinLength(1)
				.setMaxLength(160)
				.setPlaceholder('touhou animated 1girl')
				.setStyle(TextInputStyle.Paragraph),
		);

		let title: string;
		if (operation === 'ADD') {
			tagsLabel.setLabel(translator.getText('feedEditTagsInputAdd'));
			title = translator.getText('feedEditTagsTitleAdd');
		} else {
			tagsLabel.setLabel(translator.getText('feedEditTagsInputRemove'));
			title = translator.getText('feedEditTagsTitleRemove');
		}

		const modal = new ModalBuilder()
			.setCustomId(
				`yo_setFollowedTags_${operation}_${compressId(channelId)}${isAlt ? '_ALT' : ''}`,
			)
			.setTitle(title)
			.addLabelComponents(tagsLabel);

		return interaction.showModal(modal).catch(auditError);
	})
	.setModalResponse(
		async function setFollowedTags(interaction, operation, customChannelId, isAlt) {
			const channelId = customChannelId
				? decompressId(customChannelId)
				: interaction.channelId;
			const userId = interaction.user.id;
			const editedTags = interaction.fields
				.getTextInputValue('tagsInput')
				.toLowerCase()
				.split(/[ \n]+/)
				.filter((t) => t.length);

			!isAlt && (await interaction.deferReply({ flags: MessageFlags.Ephemeral }));

			const userQuery = { userId };
			const userConfigs =
				(await UserConfigModel.findOne(userQuery)) || new UserConfigModel(userQuery);
			const translator = new Translator(userConfigs.language);
			let newTags = userConfigs.feedTagSuscriptions.get(channelId)?.slice(0) ?? [];
			let setTagsResponse: LocaleIds;
			const previousLength = newTags.length;

			if (operation === 'ADD') {
				newTags.push(...editedTags.filter((t) => !newTags.includes(t)));
				newTags.splice(6);
				setTagsResponse = 'feedSetTagsAdd';
			} else {
				newTags = newTags.filter((t) => !editedTags.includes(t));
				setTagsResponse = 'feedSetTagsRemove';
			}

			if (previousLength === newTags.length) {
				return interaction.editReply({
					content: translator.getText('feedSetTagsUnchanged'),
				});
			}

			isAlt && (await interaction.deferUpdate());

			if (newTags.length) userConfigs.feedTagSuscriptions.set(channelId, newTags);
			else userConfigs.feedTagSuscriptions.delete(channelId);
			userConfigs.markModified('feedTagSuscriptions');

			await userConfigs.save();

			updateFollowedFeedTagsCache(userId, channelId, newTags);

			const payload = {
				components: [
					new TextDisplayBuilder({
						content: translator.getText(setTagsResponse, editedTags.join(' ')),
					}),
					makeFollowedTagsContainer(
						compressId(userId),
						channelId,
						userConfigs,
						translator,
						!!isAlt,
					),
				],
			};

			return Promise.all([
				isAlt ? interaction.editReply(payload) : interaction.message.edit(payload),
				isAlt ? Promise.resolve() : interaction.deleteReply(),
			]);
		},
	)
	//We maintain both cancelWizard and exitWizard for compatibility for now...
	.setButtonResponse(
		async function cancelWizard(interaction) {
			const translator = await Translator.fromUser(interaction);

			const container = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(translator.getText('yoWizardClosedDescription')),
			);

			return interaction.update({ components: [container] });
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(
		async function exitWizard(interaction) {
			const translator = await Translator.fromUser(interaction);

			const container = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(translator.getText('yoWizardClosedDescription')),
			);

			return interaction.update({ components: [container] });
		},
		{ userFilterIndex: 0 },
	);

export default command;
