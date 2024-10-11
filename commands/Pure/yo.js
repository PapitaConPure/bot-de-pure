const UserConfigs = require('../../localdata/models/userconfigs');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, Embed, TextInputBuilder, TextInputStyle, ModalBuilder, StringSelectMenuBuilder } = require('discord.js');
const { CommandTags, CommandManager } = require('../Commons/commands');
const { tenshiColor } = require('../../localdata/config.json');
const { Translator } = require('../../internationalization');
const { recacheUser } = require('../../usercache');
const { compressId, shortenText, decompressId, improveNumber, warn } = require('../../func');
const { makeButtonRowBuilder, makeStringSelectMenuRowBuilder } = require('../../tsCasts');
const { auditError } = require('../../systems/others/auditor');
const { updateFollowedFeedTagsCache } = require('../../systems/booru/boorufeed');

/**
 * @param {Boolean} toggle
 * @param {Translator} translator
 */
function displayToggle(toggle, translator) {
    return translator.getText(toggle ? 'toggledOn' : 'toggledOff');
}

/**
 * @param {String} id
 * @param {Translator} translator
 */
const backToDashboardButton = (id, translator) => new ButtonBuilder()
    .setCustomId(`yo_goToDashboard_${compressId(id)}`)
    .setLabel(translator.getText('buttonBack'))
    .setStyle(ButtonStyle.Secondary);

/**
 * @param {String} id
 * @param {Translator} translator
 */
const cancelButton = (id, translator) => new ButtonBuilder()
	.setCustomId(`yo_cancelWizard_${id}`)
	.setLabel(translator.getText('buttonCancel'))
	.setStyle(ButtonStyle.Secondary);

/**
 * @param {String?} iconUrl
 * @param {import('../../internationalization').LocaleIds} stepName
 * @param {import('discord.js').ColorResolvable} stepColor
 * @param {Translator} translator
 */
const wizEmbed = (iconUrl, stepName, stepColor, translator) => {
    const author = { name: translator.getText('yoDashboardAuthor') };
    if(iconUrl) author.iconURL = iconUrl;
    return new EmbedBuilder()
        .setColor(stepColor)
        .setAuthor(author)
        .setFooter({ text: translator.getText(stepName) });
};

/**
 * @param {String} userId 
 * @param {import('../../localdata/models/userconfigs').UserConfigDocument} userConfigs 
 * @param {Translator} translator 
 */
const dashboardRows = (userId, userConfigs, translator) => [
    makeStringSelectMenuRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`yo_selectConfig_${userId}`)
            .setPlaceholder(translator.getText('yoDashboardMenuConfig'))
            .setMaxValues(1)
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
                    emoji: '1260802777320263690',
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
    makeButtonRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`yo_toggleLanguage_${userId}`)
            .setLabel(translator.nextTranslator.getText('currentLanguage'))
            .setEmoji(translator.nextTranslator.getText('currentLanguageEmoji'))
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`yo_exitWizard_${userId}`)
            .setLabel(translator.getText('buttonFinish'))
            .setStyle(ButtonStyle.Secondary),
    ),
];

/**
 * @param {import('discord.js').Interaction | import('../Commons/typings').ComplexCommandRequest} request 
 * @param {import('../../localdata/models/userconfigs').UserConfigDocument} userConfigs 
 * @param {Translator} translator 
 */
const dashboardEmbed = (request, userConfigs, translator) => {
    const suscriptions = [...userConfigs.feedTagSuscriptions.values()];
    return wizEmbed(request.client.user.avatarURL({ size: 128 }), 'yoDashboardName', tenshiColor, translator)
        .setTitle(request.user.tag)
        .setThumbnail(request.user.avatarURL({ size: 512 }))
        .addFields(
            {
                name: translator.getText('yoDashboardLanguageName'),
                value: `${translator.getText('currentLanguageEmoji')} ${translator.getText('currentLanguage')}`,
                inline: true,
            },
            {
                name: translator.getText('yoDashboardPRCName'),
                value: `<:prc:1097208828946301123> ${improveNumber(userConfigs.prc, true)}`,
                inline: true,
            },
            {
                name: translator.getText('yoDashboardFeedTagsName'),
                value: translator.getText(
                    'yoDashboardFeedTagsValue',
                    suscriptions.length ? suscriptions.map(a => a.length ?? 0).reduce((a, b) => a + b) : 0,
                    userConfigs.feedTagSuscriptions.size,
                ),
            },
        );
}

/**
 * 
 * @param {import('discord.js').Interaction} interaction 
 * @param {import('../../localdata/models/userconfigs').UserConfigDocument} userConfigs 
 * @param {Translator} translator 
 */
const voiceEmbed = (interaction, userConfigs, translator) => {
    const voicePingConfig = (() => {
        switch(userConfigs.voice.ping) {
        case 'always': return translator.getText('always');
        case 'onCreate': return translator.getText('yoVoiceMenuPingOnCreateLabel');
        case 'never': return translator.getText('never');
        default: throw 'User ping config was invalid';
        }
    })();

    return wizEmbed(interaction.client.user.avatarURL(), 'yoVoiceStep', 0x0096fa, translator)
        .setTitle(translator.getText('yoVoiceTitle'))
        .addFields(
            {
                name: translator.getText('yoVoicePingName'),
                value: voicePingConfig,
                inline: true,
            },
            {
                name: translator.getText('yoVoiceAutonameName'),
                value: userConfigs.voice.autoname ? `💠【${userConfigs.voice.autoname}】` : '_Ninguno._',
                inline: true,
            },
        );
};

/**
 * @param {String} userId 
 * @param {import('../../localdata/models/userconfigs').UserConfigDocument} userConfigs 
 * @param {Translator} translator 
 */
const pixivRows = (userId, userConfigs, translator) => [
    makeButtonRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`yo_setPixivConvert_${userId}_${userConfigs.convertPixiv ? '': 'enable'}`)
            .setStyle(userConfigs.convertPixiv ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setEmoji(userConfigs.convertPixiv ? '919403803126661120' : '1138853641600643174'),
        backToDashboardButton(userId, translator),
        cancelButton(userId, translator),
    ),
];

/**
 * @param {String} userId 
 * @param {import('discord.js').ButtonInteraction} interaction 
 * @param {import('../../localdata/models/userconfigs').UserConfigDocument} userConfigs 
 * @param {Translator} translator 
 */
const selectTagsChannelRows = (userId, interaction, userConfigs, translator) => [
    new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`yo_modifyFollowedTags_${compressId(userId)}`)
            .setOptions([...userConfigs.feedTagSuscriptions.entries()].map(([k, v]) => ({
                label: shortenText(v.join(' ') || '<Ninguna tag>', 99),
                description: `#${interaction.guild?.channels.cache.get(k)?.name ?? '???'}`,
                value: k,
            })))
            .setPlaceholder(translator.getText('feedSelectFeed')),
    ),
    new ActionRowBuilder().addComponents(
        backToDashboardButton(userId, translator),
        cancelButton(userId, translator),
    ),
];

/**
 * @param {import('discord.js').Interaction | import('../Commons/typings').ComplexCommandRequest} request 
 * @param {Translator} translator 
 */
const selectTagsChannelEmbed = (request, translator) => wizEmbed(request.client.user.avatarURL({ size: 128 }), 'yoDashboardName', Colors.Blurple, translator)
    .setTitle(translator.getText('yoSelectTagsChannelTitle'));

/**
 * @param {String} userId 
 * @param {Translator} translator 
 */
const followedTagsRows = (userId, channelId, translator, isAlt) => [
    new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`yo_editFT_${compressId(userId)}_${compressId(channelId)}_ADD`)
            .setEmoji('1086797601925513337')
            .setLabel(translator.getText('feedSetTagsButtonAdd'))
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`yo_editFT_${compressId(userId)}_${compressId(channelId)}_REMOVE`)
            .setEmoji('1086797599287296140')
            .setLabel(translator.getText('feedSetTagsButtonRemove'))
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId(`yo_selectFTC_${userId}`)
            .setLabel(translator.getText('buttonBack'))
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!!isAlt),
        cancelButton(userId, translator)
            .setDisabled(!!isAlt),
    ),
];

/**
 * @function
 * @param {import('discord.js').Interaction | import('../Commons/typings').ComplexCommandRequest} request 
 * @param {*} userConfigs 
 * @param {String} channelId 
 * @param {Translator} translator 
 */
const followedTagsEmbed = (request, userConfigs, channelId, translator) => wizEmbed(request.client.user.avatarURL({ size: 128 }), 'yoDashboardName', Colors.LuminousVividPink, translator)
    .addFields(
        {
            name: translator.getText('yoTagsName'),
            value: `\`\`\`\n${userConfigs.feedTagSuscriptions.get(channelId)?.join(' ') || translator.getText('yoTagsValueDefault')}\n\`\`\``,
        },
    );

const flags = new CommandTags().add('COMMON');
const command = new CommandManager('yo', flags)
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

        // @ts-ignore
        const translator = new Translator(userConfigs.language);
        const wizard = dashboardEmbed(request, userConfigs, translator);
        return request.reply({
            embeds: [wizard],
            components: dashboardRows(request.userId, userConfigs, translator),
        });
	})
	.setButtonResponse(async function goToDashboard(interaction, authorId) {
		const { user } = interaction;
			
		const userConfigs = await UserConfigs.findOne({ userId: user.id });
        if(!userConfigs)
            return interaction.reply({ content: '⚠️ Usuario inexistente / Unexistent user', ephemeral: true });
        
        // @ts-ignore
        const translator = new Translator(userConfigs.language);

		if(compressId(user.id) !== authorId)
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });
		
		return interaction.update({
			embeds: [dashboardEmbed(interaction, userConfigs, translator)],
			components: dashboardRows(user.id, userConfigs, translator),
		});
	})
	.setButtonResponse(async function toggleLanguage(interaction, authorId) {
		const { user } = interaction;
			
		const userConfigs = await UserConfigs.findOne({ userId: user.id });
        if(!userConfigs)
            return interaction.reply({ content: warn('Usuario inexistente / Unexistent user / 存在しないユーザー'), ephemeral: true });

        // @ts-ignore
        let translator = new Translator(userConfigs.language);
		
		if(user.id !== authorId)
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

        userConfigs.language = translator.next;
        translator = new Translator(translator.next);
        
        return Promise.all([
            userConfigs.save().then(() => recacheUser(user.id)),
            interaction.update({
                embeds: [dashboardEmbed(interaction, userConfigs, translator)],
                components: dashboardRows(user.id, userConfigs, translator),
            }),
        ]);
	})
    .setSelectMenuResponse(async function selectConfig(interaction, authorId) {
        const selected = interaction.values[0];

        if(selected === 'feed')
            return command.selectFTC(interaction, authorId);
        
		const { user } = interaction;
			
		const userConfigs = await UserConfigs.findOne({ userId: user.id });
        if(!userConfigs)
            return interaction.reply({ content: '⚠️ Usuario inexistente / Unexistent user', ephemeral: true });

        const translator = new Translator(/**@type {'es'|'en'}*/(userConfigs.language));
		
		if(user.id !== authorId)
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });
        
        let embed;
        let components;

        userConfigs.voice ??= {};
        userConfigs.voice.ping ??= 'always';

        switch(selected) {
        case 'voice':
            embed = voiceEmbed(interaction, userConfigs, translator);
            components = [
                makeStringSelectMenuRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`yo_setVoicePing_${authorId}`)
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
                makeButtonRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`yo_setAutoname_${authorId}`)
                        .setStyle(ButtonStyle.Primary)
                        .setLabel('Nombre de sesión automático...'),
                    backToDashboardButton(authorId, translator),
                    cancelButton(authorId, translator),
                ),
            ];
            break;
            
        case 'pixiv':
            embed = wizEmbed(interaction.client.user.avatarURL(), 'yoPixivStep', 0x0096fa, translator)
                .setTitle(translator.getText('yoPixivTitle'));
            components = pixivRows(authorId, userConfigs, translator);

            break;

        default:
            embed = wizEmbed(interaction.client.user.avatarURL(), 'yoTwitterStep', 0x040404, translator)
                .setTitle(translator.getText('yoTwitterTitle'));
            components = [
                makeStringSelectMenuRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`yo_setTwitterConvert_${authorId}`)
                        .setPlaceholder(translator.getText('yoTwitterMenuService'))
                        .setOptions(
                            {
                                value: 'vx',
                                label: 'vxTwitter / fixvx',
                                description: translator.getText('yoTwitterMenuServiceVxDesc'),
                            },
                            {
                                value: 'fx',
                                label: 'FxTwitter / FixupX',
                                description: translator.getText('yoTwitterMenuServiceFxDesc'),
                            },
                            {
                                value: 'none',
                                label: translator.getText('yoTwitterMenuServiceNoneLabel'),
                                description: translator.getText('yoTwitterMenuServiceNoneDesc'),
                            },
                        )
                ),
                makeButtonRowBuilder().addComponents(
                    backToDashboardButton(authorId, translator),
                    cancelButton(authorId, translator),
                ),
            ];
            break;
        }

        return interaction.update({
            content: null,
            embeds: [embed],
            components,
        });
    })
    .setSelectMenuResponse(async function setVoicePing(interaction, authorId, enable) {
        const { user } = interaction;
            
        const userConfigs = await UserConfigs.findOne({ userId: user.id });
        if(!userConfigs)
            return interaction.reply({ content: warn('Usuario inexistente / Unexistent user'), ephemeral: true });

        const translator = new Translator(/**@type {import('../../internationalization').LocaleKey}*/(userConfigs.language));
        
        if(user.id !== authorId)
            return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

        let pingMode = interaction.values[0];
        userConfigs.voice.ping = pingMode;
        userConfigs.markModified('voice');
        
        return Promise.all([
            userConfigs.save(),
            interaction.update({
                embeds: [ voiceEmbed(interaction, userConfigs, translator) ],
            }),
        ]);
    })
    .setButtonResponse(async function setPixivConvert(interaction, authorId, enable) {
		const { user } = interaction;
			
		const userConfigs = await UserConfigs.findOne({ userId: user.id });
        if(!userConfigs)
            return interaction.reply({ content: warn('Usuario inexistente / Unexistent user'), ephemeral: true });

        const translator = new Translator(/**@type {import('../../internationalization').LocaleKey}*/(userConfigs.language));
		
		if(user.id !== authorId)
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

        const convertPixiv = !!enable;

        if(convertPixiv === userConfigs.convertPixiv) {
            return interaction.update({
                content: translator.getText('yoPixivStateAlreadySet', convertPixiv),
                components: pixivRows(authorId, userConfigs, translator),
            });
        }

        userConfigs.convertPixiv = convertPixiv;
        
        return Promise.all([
            userConfigs.save().then(() => recacheUser(user.id)),
            interaction.update({
                content: null,
                components: pixivRows(authorId, userConfigs, translator),
            }),
        ]);
    })
    .setSelectMenuResponse(async function setTwitterConvert(interaction, authorId, enable) {
		const { user } = interaction;
			
		const userConfigs = await UserConfigs.findOne({ userId: user.id });
        if(!userConfigs)
            return interaction.reply({ content: warn('Usuario inexistente / Unexistent user'), ephemeral: true });

        // @ts-ignore
        const translator = new Translator(userConfigs.language);
		
		if(user.id !== authorId)
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

        let service = interaction.values[0];
        if(service === 'none') service = '';

        if(service !== '' && service !== 'vx' && service !== 'fx')
            throw 'Resultado de servicio de conversión de Twitter inesperado';

        userConfigs.twitterPrefix = service;
        
        return Promise.all([
            userConfigs.save().then(() => recacheUser(user.id)),
            interaction.reply({ content: translator.getText('yoTwitterSuccess'), ephemeral: true }),
        ]);
    })
	.setButtonResponse(async function selectFTC(interaction, authorId) {
		const { user } = interaction;
			
		const userConfigs = await UserConfigs.findOne({ userId: user.id });
        if(!userConfigs)
            return interaction.reply({ content: '⚠️ Usuario inexistente / Unexistent user', ephemeral: true });

        // @ts-ignore
        const translator = new Translator(userConfigs.language);
		
		if(user.id !== authorId)
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

        if(userConfigs.feedTagSuscriptions.size === 0)
            return interaction.reply({ content: translator.getText('yoFeedEmptyError'), ephemeral: true });
        
        return Promise.all([
            userConfigs.save(),
            interaction.update({
                content: null,
                embeds: [selectTagsChannelEmbed(interaction, translator)],
                // @ts-ignore
                components: selectTagsChannelRows(user.id, interaction, userConfigs, translator),
            }),
        ]);
	})
	.setSelectMenuResponse(async function modifyFollowedTags(interaction, authorId, isAlt) {
		const { user } = interaction;
        const channelId = isAlt ? interaction.channelId : interaction.values[0];
			
		const userConfigs = await UserConfigs.findOne({ userId: user.id });
        if(!userConfigs)
            return interaction.reply({ content: warn('Usuario inexistente / Unexistent user'), ephemeral: true });

        // @ts-ignore
        const translator = new Translator(userConfigs.language);
		
		if(compressId(user.id) !== authorId)
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });
        
        return Promise.all([
            userConfigs.save(),
            interaction.update({
                embeds: [followedTagsEmbed(interaction, userConfigs, channelId, translator)],
                // @ts-ignore
                components: followedTagsRows(user.id, channelId, translator, isAlt),
            }),
        ]);
	})
	.setButtonResponse(async function editFT(interaction, authorId, channelId, operation) {
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
            .setCustomId(`yo_setFollowedTags_${operation}_${compressId(channelId)}`)
            .setTitle(title)
            // @ts-ignore
            .addComponents(row);

        return interaction.showModal(modal).catch(auditError);
	})
	.setModalResponse(async function setFollowedTags(interaction, operation, customChannelId) {
		const channelId = customChannelId ? decompressId(customChannelId) : interaction.channelId;
		const userId = interaction.user.id;
		const editedTags = interaction.fields.getTextInputValue('tagsInput').toLowerCase().split(/[ \n]+/).filter(t => t.length);

		const userQuery = { userId };
		const userConfigs = (await UserConfigs.findOne(userQuery)) || new UserConfigs(userQuery);
		// @ts-ignore
		const translator = new Translator(userConfigs.language);
		let newTags = userConfigs.feedTagSuscriptions.get(channelId)?.slice(0) ?? [];
		/**@type {import('../../internationalization.js').LocaleIds}*/
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
            const updateContent = {
				content: translator.getText('feedSetTagsUnchanged'),
                ephemeral: true,
            };
            return interaction.update(updateContent).catch(() => interaction.reply(updateContent));
        }

		if(newTags.length)
			userConfigs.feedTagSuscriptions.set(channelId, newTags);
		else
			userConfigs.feedTagSuscriptions.delete(channelId);
		userConfigs.markModified('feedTagSuscriptions');
		
		await userConfigs.save();

		updateFollowedFeedTagsCache(userId, channelId, newTags);

		const updateContent = {
			content: translator.getText(setTagsResponse, editedTags.join(' ')),
			embeds: [followedTagsEmbed(interaction, userConfigs, channelId, translator)],
			ephemeral: true,
		};

		return interaction.update(updateContent).catch(() => interaction.reply(updateContent));
	})
	.setButtonResponse(async function cancelWizard(interaction, authorId) {
        const translator = await Translator.from(authorId);

		if(interaction.user.id !== authorId)
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });
		
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
	})
	.setButtonResponse(async function exitWizard(interaction, authorId) {
        const translator = await Translator.from(authorId);

		if(interaction.user.id !== authorId)
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });
		
		const cancelEmbed = wizEmbed(interaction.client.user.avatarURL(), 'finishedStepFooterName', Colors.NotQuiteBlack, translator)
			.setDescription(translator.getText('yoFinishedStep'));
		return interaction.update({
            content: null,
			embeds: [cancelEmbed],
			components: [],
		});
	});

module.exports = command;