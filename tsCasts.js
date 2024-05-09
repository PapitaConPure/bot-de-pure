const {
    ActionRowBuilder,
    ButtonBuilder,
    ChannelSelectMenuBuilder,
    MentionableSelectMenuBuilder,
    RoleSelectMenuBuilder,
    StringSelectMenuBuilder,
    UserSelectMenuBuilder,
    TextInputBuilder
} = require('discord.js');

/**@typedef {import('discord.js').AnyComponentBuilder} awasd*/

function makeButtonRowBuilder() {
    return /**@type {ActionRowBuilder<ButtonBuilder>}*/(new ActionRowBuilder());
}

function makeChannelSelectMenuRowBuilder() {
    return /**@type {ActionRowBuilder<ChannelSelectMenuBuilder>}*/(new ActionRowBuilder());
}

function makeMentionableSelectMenuRowBuilder() {
    return /**@type {ActionRowBuilder<MentionableSelectMenuBuilder>}*/(new ActionRowBuilder());
}

function makeRoleSelectMenuRowBuilder() {
    return /**@type {ActionRowBuilder<RoleSelectMenuBuilder>}*/(new ActionRowBuilder());
}

function makeStringSelectMenuRowBuilder() {
    return /**@type {ActionRowBuilder<StringSelectMenuBuilder>}*/(new ActionRowBuilder());
}

function makeUserSelectMenuRowBuilder() {
    return /**@type {ActionRowBuilder<UserSelectMenuBuilder>}*/(new ActionRowBuilder());
}

function makeTextInputRowBuilder() {
    return /**@type {ActionRowBuilder<TextInputBuilder>}*/(new ActionRowBuilder());
}

module.exports = {
    makeButtonRowBuilder,
    makeChannelSelectMenuRowBuilder,
    makeMentionableSelectMenuRowBuilder,
    makeRoleSelectMenuRowBuilder,
    makeStringSelectMenuRowBuilder,
    makeUserSelectMenuRowBuilder,
    makeTextInputRowBuilder,
};
