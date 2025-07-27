const { ActionRowBuilder } = require('discord.js');

//@ts-expect-error
/**@param {import('discord.js').JSONEncodable<import('discord.js').APIActionRowComponent<ReturnType<import('discord.js').ComponentType['toJSON']>>>|import('discord.js').APIActionRowComponent<ReturnType<import('discord.js').ComponentType['toJSON']>>} [component]*/
function makeButtonRowBuilder(component) {
    if(component)
        return /**@type {import('discord.js').ActionRowBuilder<import('discord.js').ButtonBuilder>}*/(ActionRowBuilder.from(component));
    return /**@type {import('discord.js').ActionRowBuilder<import('discord.js').ButtonBuilder>}*/(new ActionRowBuilder());
}

//@ts-expect-error
/**@param {import('discord.js').JSONEncodable<import('discord.js').APIActionRowComponent<ReturnType<import('discord.js').ComponentType['toJSON']>>>|import('discord.js').APIActionRowComponent<ReturnType<import('discord.js').ComponentType['toJSON']>>} [component]*/
function makeChannelSelectMenuRowBuilder(component) {
    if(component)
        return /**@type {import('discord.js').ActionRowBuilder<import('discord.js').ChannelSelectMenuBuilder>}*/(ActionRowBuilder.from(component));
    return /**@type {import('discord.js').ActionRowBuilder<import('discord.js').ChannelSelectMenuBuilder>}*/(new ActionRowBuilder());
}

//@ts-expect-error
/**@param {import('discord.js').JSONEncodable<import('discord.js').APIActionRowComponent<ReturnType<import('discord.js').ComponentType['toJSON']>>>|import('discord.js').APIActionRowComponent<ReturnType<import('discord.js').ComponentType['toJSON']>>} [component]*/
function makeMentionableSelectMenuRowBuilder(component) {
    if(component)
        return /**@type {import('discord.js').ActionRowBuilder<import('discord.js').MentionableSelectMenuBuilder>}*/(ActionRowBuilder.from(component));
    return /**@type {import('discord.js').ActionRowBuilder<import('discord.js').MentionableSelectMenuBuilder>}*/(new ActionRowBuilder());
}

//@ts-expect-error
/**@param {import('discord.js').JSONEncodable<import('discord.js').APIActionRowComponent<ReturnType<import('discord.js').ComponentType['toJSON']>>>|import('discord.js').APIActionRowComponent<ReturnType<import('discord.js').ComponentType['toJSON']>>} [component]*/
function makeRoleSelectMenuRowBuilder(component) {
    if(component)
        return /**@type {import('discord.js').ActionRowBuilder<import('discord.js').RoleSelectMenuBuilder>}*/(ActionRowBuilder.from(component));
    return /**@type {import('discord.js').ActionRowBuilder<import('discord.js').RoleSelectMenuBuilder>}*/(new ActionRowBuilder());
}

//@ts-expect-error
/**@param {import('discord.js').JSONEncodable<import('discord.js').APIActionRowComponent<ReturnType<import('discord.js').ComponentType['toJSON']>>>|import('discord.js').APIActionRowComponent<ReturnType<import('discord.js').ComponentType['toJSON']>>} [component]*/
function makeStringSelectMenuRowBuilder(component) {
    if(component)
        return /**@type {import('discord.js').ActionRowBuilder<import('discord.js').StringSelectMenuBuilder>}*/(ActionRowBuilder.from(component));
    return /**@type {import('discord.js').ActionRowBuilder<import('discord.js').StringSelectMenuBuilder>}*/(new ActionRowBuilder());
}

//@ts-expect-error
/**@param {import('discord.js').JSONEncodable<import('discord.js').APIActionRowComponent<ReturnType<import('discord.js').ComponentType['toJSON']>>>|import('discord.js').APIActionRowComponent<ReturnType<import('discord.js').ComponentType['toJSON']>>} [component]*/
function makeUserSelectMenuRowBuilder(component) {
    if(component)
        return /**@type {import('discord.js').ActionRowBuilder<import('discord.js').UserSelectMenuBuilder>}*/(ActionRowBuilder.from(component));
    return /**@type {import('discord.js').ActionRowBuilder<import('discord.js').UserSelectMenuBuilder>}*/(new ActionRowBuilder());
}

//@ts-expect-error
/**@param {import('discord.js').JSONEncodable<import('discord.js').APIActionRowComponent<ReturnType<import('discord.js').ComponentType['toJSON']>>>|import('discord.js').APIActionRowComponent<ReturnType<import('discord.js').ComponentType['toJSON']>>} [component]*/
function makeTextInputRowBuilder(component) {
    if(component)
        return /**@type {import('discord.js').ActionRowBuilder<import('discord.js').TextInputBuilder>}*/(ActionRowBuilder.from(component));
    return /**@type {import('discord.js').ActionRowBuilder<import('discord.js').TextInputBuilder>}*/(new ActionRowBuilder());
}

//@ts-expect-error
/**@param {import('discord.js').JSONEncodable<import('discord.js').APIActionRowComponent<ReturnType<import('discord.js').ComponentType['toJSON']>>>|import('discord.js').APIActionRowComponent<ReturnType<import('discord.js').ComponentType['toJSON']>>} [component]*/
function makeMessageActionRowBuilder(component) {
    if(component)
        return /**@type {import('discord.js').ActionRowBuilder<import('discord.js').MessageActionRowComponentBuilder>}*/(ActionRowBuilder.from(component));
    return /**@type {import('discord.js').ActionRowBuilder<import('discord.js').MessageActionRowComponentBuilder>}*/(new ActionRowBuilder());
}

module.exports = {
    makeButtonRowBuilder,
    makeChannelSelectMenuRowBuilder,
    makeMentionableSelectMenuRowBuilder,
    makeRoleSelectMenuRowBuilder,
    makeStringSelectMenuRowBuilder,
    makeUserSelectMenuRowBuilder,
    makeTextInputRowBuilder,
    makeMessageActionRowBuilder,
};
