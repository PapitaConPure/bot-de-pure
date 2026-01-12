const UserConfigs = require('../../models/userconfigs');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, TextInputBuilder, TextInputStyle, ModalBuilder, StringSelectMenuBuilder, ContainerBuilder, MessageFlags, StringSelectMenuOptionBuilder } = require('discord.js');
const { CommandTags, Command } = require('../Commons/commands');
const { tenshiColor, tenshiAltColor } = require('../../data/config.json');
const { Translator, Locales, isValidLocaleKey } = require('../../i18n');
const { recacheUser } = require('../../utils/usercache');
const { compressId, decompressId, improveNumber, warn, shortenText } = require('../../func');
const { makeTextInputRowBuilder } = require('../../utils/tsCasts');
const { auditError } = require('../../systems/others/auditor');
const { updateFollowedFeedTagsCache } = require('../../systems/booru/boorufeed');
const { makeSessionAutoname } = require('../../systems/others/purevoice');
const { toUtcOffset, sanitizeTzCode, utcOffsetDisplayFull } = require('../../utils/timezones');
const { acceptedTwitterConverters } = require('../../systems/agents/pureet');

const userNotAvailableText = warn('Usuario no disponible / User unavailable / ユーザーは利用できません');

/**@param {string} compressedAuthorId*/
const backToDashboardButton = compressedAuthorId => new ButtonBuilder()
    .setCustomId(`yo_goToDashboard_${compressedAuthorId}`)
    .setEmoji('1355128236790644868')
    .setStyle(ButtonStyle.Secondary);

/**@param {string} compressedAuthorId*/
const cancelButton = compressedAuthorId => new ButtonBuilder()
	.setCustomId(`yo_cancelWizard_${compressedAuthorId}`)
    .setEmoji('1355143793577426962')
	.setStyle(ButtonStyle.Secondary);

/**
 * @param {string?} iconUrl
 * @param {import('../../i18n').LocaleIds} stepName
 * @param {import('discord.js').ColorResolvable} stepColor
 * @param {Translator} translator
 */
const wizEmbed = (iconUrl, stepName, stepColor, translator) => {
    const author = { name: translator.getText('yoDashboardAuthorEpigraph') };
    if(iconUrl) author.iconURL = iconUrl;
    return new EmbedBuilder()
        .setColor(stepColor)
        .setAuthor(author)
        .setFooter({ text: translator.getText(stepName) })
        .setTimestamp(Date.now());
};

/**
 * @param {import('discord.js').Interaction | import('../Commons/typings').ComplexCommandRequest} request 
 * @param {import('../../models/userconfigs').UserConfigDocument} userConfigs 
 * @param {Translator} translator 
 */
function makeDashboardContainer(request, userConfigs, translator) {
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
                    textDisplay => textDisplay.setContent(translator.getText('yoDashboardAuthorEpigraph')),
                    textDisplay => textDisplay.setContent(`# ${request.user.displayName}`),
                    textDisplay => textDisplay.setContent([
                        tzCode?.length ? `<:clock:1357498813144760603> ${utcOffsetDisplayFull(tzCode)}` : translator.getText('yoDashboardNoTZ'),
                        translator.getText('yoDashboardPRC', improveNumber(prc, { shorten: true })),
                    ].join('\n')),
                )
                .setThumbnailAccessory(
                    thumbnail => thumbnail
                        .setDescription(translator.getText('avatarGlobalAvatarAlt', request.user.displayName))
                        .setURL(request.user.displayAvatarURL({ size: 256 }))
                )
        )
        .addSeparatorComponents(separator => separator.setDivider(true))
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
            actionRow => actionRow.addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`yo_selectConfig_${compressedUserId}`)
                    .setPlaceholder(translator.getText('yoDashboardMenuConfig'))
                    .setOptions([
                        {
                            label: 'PuréFeed',
                            description: translator.getText('yoDashboardMenuConfigFeedDesc'),
                            emoji: '921788204540100608',
                            value: 'feed',
                        },
                        {
                            label: 'PuréVoice',
                            description: translator.getText('yoDashboardMenuConfigVoiceDesc'),
                            emoji: '1354500099799257319',
                            value: 'voice',
                        },
                        {
                            label: 'PuréPix',
                            description: translator.getText('yoDashboardMenuConfigPixixDesc'),
                            emoji: '919403803126661120',
                            value: 'pixiv',
                        },
                        {
                            label: 'Puréet',
                            description: translator.getText('yoDashboardMenuConfigTwitterDesc'),
                            emoji: '1232243415165440040',
                            value: 'twitter',
                        },
                    ]),
            ),
            actionRow => actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`yo_promptSetTimezone_${compressedUserId}`)
                    .setLabel(translator.getText('yoDashboardTimezone'))
                    .setEmoji('1357498813144760603')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`yo_exitWizard_${compressedUserId}`)
                    .setLabel(translator.getText('buttonFinish'))
                    .setStyle(ButtonStyle.Secondary),
            ),
        );

    return container;
}

/**
 * 
 * @param {string} compressedAuthorId 
 * @param {import('../../models/userconfigs').UserConfigDocument} userConfigs 
 * @param {Translator} translator 
 */
const makeVoiceContainer = (compressedAuthorId, userConfigs, translator) => {
    const voicePingConfig = (() => {
        switch(userConfigs.voice.ping) {
        case 'always': return translator.getText('always');
        case 'onCreate': return translator.getText('yoVoiceMenuPingOnCreateLabel');
        case 'never': return translator.getText('never');
        default: return '⚠️';
        }
    })();

    const container = new ContainerBuilder()
        .setAccentColor(0x0096fa) //Tema de pixiv
        .addTextDisplayComponents(textDisplay =>
            textDisplay.setContent(`${translator.getText('yoVoiceTitle')}\n${translator.getText('yoVoiceDescription')}`)
        )
        .addSeparatorComponents(separator => separator.setDivider(true))
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent([
                translator.getText('yoVoicePingName'),
                voicePingConfig,
            ].join('\n')),
        )
        .addSeparatorComponents(separator => separator.setDivider(false))
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent([
                translator.getText('yoVoiceAutonameName'),
                makeSessionAutoname(userConfigs) ?? translator.getText('yoVoiceAutonameValueNone'),
            ].join('\n')),
        )
        .addSeparatorComponents(separator => separator.setDivider(false))
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent([
                translator.getText('yoVoiceKillDelayName'),
                '4m 45s',
            ].join('\n')),
        )
        .addSeparatorComponents(separator => separator.setDivider(true))
        .addActionRowComponents(
            actionRow => actionRow.addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`yo_setVoicePing_${compressedAuthorId}`)
                    .setPlaceholder(translator.getText('yoVoiceMenuPing'))
                    .setOptions(
                        {
                            value: 'always',
                            label: translator.getText('always'),
                            description: translator.getText('yoVoiceMenuPingAlwaysDesc'),
                        },
                        {
                            value: 'onCreate',
                            label: translator.getText('yoVoiceMenuPingOnCreateLabel'),
                            description: translator.getText('yoVoiceMenuPingOnCreateDesc'),
                        },
                        {
                            value: 'never',
                            label: translator.getText('never'),
                            description: translator.getText('yoVoiceMenuPingNeverDesc'),
                        },
                    )
            ),
            actionRow => actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`yo_setVoiceAutoname_${compressedAuthorId}`)
                    .setStyle(ButtonStyle.Primary)
                    .setLabel(translator.getText('yoVoiceAutonameButtonLabel')),
                new ButtonBuilder()
                    .setCustomId(`yo_setVoiceKillDelay_${compressedAuthorId}`)
                    .setStyle(ButtonStyle.Primary)
                    .setLabel(translator.getText('yoVoiceKillDelayButtonLabel')),
                backToDashboardButton(compressedAuthorId),
                cancelButton(compressedAuthorId),
            ),
        );

    return container;
};

/**
 * @param {string} compressedAuthorId 
 * @param {string} service 
 * @param {Translator} translator 
 */
const makeTwitterServicePickerContainer = (compressedAuthorId, service, translator) => {
    const container = new ContainerBuilder()
        .setAccentColor(0x040404) //Tema de twitter/X
        .addTextDisplayComponents(textDisplay =>
            textDisplay.setContent(translator.getText('yoTwitterTitle')),
        )
        .addSeparatorComponents(separator => separator.setDivider(true))
        .addTextDisplayComponents(
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
            actionRow => actionRow.addComponents(
                backToDashboardButton(compressedAuthorId),
                cancelButton(compressedAuthorId),
            ),
        );

    return container;
}

/**
 * @param {string} compressedAuthorId
 * @param {string} service 
 * @param {Translator} translator
 */
const makePixivServicePickerContainer = (compressedAuthorId, service, translator) => {
    const container = new ContainerBuilder()
        .setAccentColor(0x0096fa)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(translator.getText('yoPixivTitle')),
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
            actionRow => actionRow.addComponents(
                backToDashboardButton(compressedAuthorId),
                cancelButton(compressedAuthorId),
            ),
        );

    return container;
}

/**
 * @param {string} compressedAuthorId
 * @param {import('../Commons/typings').AnyRequest} request
 * @param {import('../../models/userconfigs').UserConfigDocument} userConfigs
 * @param {Translator} translator 
 */
function makeSelectTagsChannelContainer(compressedAuthorId, request, userConfigs, translator) {
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
                                value: null,
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

/**
 * 
 * @param {string} compressedAuthorId 
 * @param {string} channelId 
 * @param {import('../../models/userconfigs').UserConfigDocument} userConfigs 
 * @param {Translator} translator 
 * @param {boolean} isAlt 
 */
function makeFollowedTagsContainer(compressedAuthorId, channelId, userConfigs, translator, isAlt) {
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

const flags = new CommandTags().add('COMMON');
const command = new Command('yo', flags)
	.setAliases(
		'usuario', 'configurar', 'configuración', 'configuracion', 'preferencias',
		'me', 'myself', 'configs', 'config',
	)
	.setBriefDescription('Para ver y configurar tus preferencias por medio de un Asistente')
	.setLongDescription(
        'Para ver y configurar tus preferencias.',
        'Si quieres cambiar alguna configuración, puedes presionar cualquier botón para proceder con el Asistente',
    )
	.setExecution(async request => {
        const userQuery = { userId: request.userId };
		let userConfigs = await UserConfigs.findOne(userQuery);

        if(!userConfigs) {
            userConfigs = new UserConfigs(userQuery);
            await userConfigs.save();
        }

        const translator = new Translator(userConfigs.language);
        return request.reply({
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
            const utcOffset = toUtcOffset(tzCode);
    
            if(utcOffset == null)
                return interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    content: translator.getText('yoTimezoneInvalidTimezone'),
                });
    
            userConfigs.tzCode = sanitizeTzCode(tzCode) || 'UTC';
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

        //FIXME: ???????????????????????
        if(selected === 'feed')
            return command['selectFeedTC'](interaction, compressedAuthorId);

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

        const translator = new Translator(/**@type {import('../../i18n').LocaleKey}*/(userConfigs.language));

        let pingMode = /**@type {'always'|'onCreate'|'never'}*/(interaction.values[0]);
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

        const translator = new Translator(/**@type {import('../../i18n').LocaleKey}*/(userConfigs.language));
		
        const modal = new ModalBuilder()
            .setCustomId('yo_applyVoiceAutoname')
            .setTitle(translator.getText('yoVoiceAutonameModalTitle'))
            .addComponents(
                makeTextInputRowBuilder().addComponents(new TextInputBuilder()
                    .setCustomId('inputName')
                    .setLabel(translator.getText('name'))
                    .setPlaceholder(translator.getText('yoVoiceAutonameModalNamingPlaceholder'))
                    .setMinLength(0)
                    .setMaxLength(24)
                    .setRequired(false)
                    .setValue(userConfigs.voice?.autoname ?? '')
                    .setStyle(TextInputStyle.Short)),
                makeTextInputRowBuilder().addComponents(new TextInputBuilder()
                    .setCustomId('inputEmoji')
                    .setLabel(translator.getText('emoji'))
                    .setPlaceholder(translator.getText('yoVoiceAutonameModalEmojiPlaceholder'))
                    .setMinLength(0)
                    .setMaxLength(2)
                    .setRequired(false)
                    .setValue(userConfigs.voice?.autoemoji ?? '')
                    .setStyle(TextInputStyle.Short)),
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

        const translator = new Translator(/**@type {import('../../i18n').LocaleKey}*/(userConfigs.language));

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

        const translator = new Translator(/**@type {import('../../i18n').LocaleKey}*/(userConfigs.language));
		
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

        const translator = new Translator(/**@type {import('../../i18n').LocaleKey}*/(userConfigs.language));

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

        let service = /**@type {import('../../systems/agents/pureet').AcceptedTwitterConverterKey | 'none' | ''}*/(interaction.values[0]);
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
	})
	.setSelectMenuResponse(async function modifyFollowedTags(interaction, compressedAuthorId, isAlt) {
		const { user } = interaction;
        const channelId = isAlt ? interaction.channelId : interaction.values[0];

		const userConfigs = await UserConfigs.findOne({ userId: user.id });
        if(!userConfigs)
            return interaction.reply({ content: userNotAvailableText, ephemeral: true });

        const translator = new Translator(userConfigs.language);

		if(compressId(user.id) !== compressedAuthorId)
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

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

        const row = new ActionRowBuilder().addComponents(tagsInput);
        const modal = new ModalBuilder()
            .setCustomId(`yo_setFollowedTags_${operation}_${compressId(channelId)}${isAlt ? '_ALT' : ''}`)
            .setTitle(title)
            // @ts-ignore
            .addComponents(row);

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
		/**@type {import('../../i18n').LocaleIds}*/
		let setTagsResponse;
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

		const cancelEmbed = wizEmbed(interaction.client.user.avatarURL(), 'cancelledStepFooterName', Colors.NotQuiteBlack, translator)
			.addFields({
				name: translator.getText('cancelledStepName'),
				value: translator.getText('yoCancelledStep'),
			});

		return interaction.update({
            content: null,
			embeds: [cancelEmbed],
			components: [],
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

module.exports = command;