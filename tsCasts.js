const {
    ActionRowBuilder,
    ButtonBuilder,
    ChannelSelectMenuBuilder,
    MentionableSelectMenuBuilder,
    RoleSelectMenuBuilder,
    StringSelectMenuBuilder,
    UserSelectMenuBuilder,
    TextInputBuilder,
    ComponentType,
} = require('discord.js');

/**@typedef {import('discord.js').AnyComponentBuilder} awasd*/

//@ts-expect-error
/**@param {import('discord.js').JSONEncodable<import('discord.js').APIActionRowComponent<ReturnType<ComponentType['toJSON']>>>|import('discord.js').APIActionRowComponent<ReturnType<ComponentType['toJSON']>>} [component]*/
function makeButtonRowBuilder(component) {
    if(component)
        return /**@type {ActionRowBuilder<ButtonBuilder>}*/(ActionRowBuilder.from(component));
    return /**@type {ActionRowBuilder<ButtonBuilder>}*/(new ActionRowBuilder());
}

//@ts-expect-error
/**@param {import('discord.js').JSONEncodable<import('discord.js').APIActionRowComponent<ReturnType<ComponentType['toJSON']>>>|import('discord.js').APIActionRowComponent<ReturnType<ComponentType['toJSON']>>} [component]*/
function makeChannelSelectMenuRowBuilder(component) {
    if(component)
        return /**@type {ActionRowBuilder<ChannelSelectMenuBuilder>}*/(ActionRowBuilder.from(component));
    return /**@type {ActionRowBuilder<ChannelSelectMenuBuilder>}*/(new ActionRowBuilder());
}

//@ts-expect-error
/**@param {import('discord.js').JSONEncodable<import('discord.js').APIActionRowComponent<ReturnType<ComponentType['toJSON']>>>|import('discord.js').APIActionRowComponent<ReturnType<ComponentType['toJSON']>>} [component]*/
function makeMentionableSelectMenuRowBuilder(component) {
    if(component)
        return /**@type {ActionRowBuilder<MentionableSelectMenuBuilder>}*/(ActionRowBuilder.from(component));
    return /**@type {ActionRowBuilder<MentionableSelectMenuBuilder>}*/(new ActionRowBuilder());
}

//@ts-expect-error
/**@param {import('discord.js').JSONEncodable<import('discord.js').APIActionRowComponent<ReturnType<ComponentType['toJSON']>>>|import('discord.js').APIActionRowComponent<ReturnType<ComponentType['toJSON']>>} [component]*/
function makeRoleSelectMenuRowBuilder(component) {
    if(component)
        return /**@type {ActionRowBuilder<RoleSelectMenuBuilder>}*/(ActionRowBuilder.from(component));
    return /**@type {ActionRowBuilder<RoleSelectMenuBuilder>}*/(new ActionRowBuilder());
}

//@ts-expect-error
/**@param {import('discord.js').JSONEncodable<import('discord.js').APIActionRowComponent<ReturnType<ComponentType['toJSON']>>>|import('discord.js').APIActionRowComponent<ReturnType<ComponentType['toJSON']>>} [component]*/
function makeStringSelectMenuRowBuilder(component) {
    if(component)
        return /**@type {ActionRowBuilder<StringSelectMenuBuilder>}*/(ActionRowBuilder.from(component));
    return /**@type {ActionRowBuilder<StringSelectMenuBuilder>}*/(new ActionRowBuilder());
}

//@ts-expect-error
/**@param {import('discord.js').JSONEncodable<import('discord.js').APIActionRowComponent<ReturnType<ComponentType['toJSON']>>>|import('discord.js').APIActionRowComponent<ReturnType<ComponentType['toJSON']>>} [component]*/
function makeUserSelectMenuRowBuilder(component) {
    if(component)
        return /**@type {ActionRowBuilder<UserSelectMenuBuilder>}*/(ActionRowBuilder.from(component));
    return /**@type {ActionRowBuilder<UserSelectMenuBuilder>}*/(new ActionRowBuilder());
}

//@ts-expect-error
/**@param {import('discord.js').JSONEncodable<import('discord.js').APIActionRowComponent<ReturnType<ComponentType['toJSON']>>>|import('discord.js').APIActionRowComponent<ReturnType<ComponentType['toJSON']>>} [component]*/
function makeTextInputRowBuilder(component) {
    if(component)
        return /**@type {ActionRowBuilder<TextInputBuilder>}*/(ActionRowBuilder.from(component));
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
