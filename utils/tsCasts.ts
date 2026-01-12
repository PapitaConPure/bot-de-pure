import { ActionRowBuilder, APIActionRowComponent, ButtonBuilder, ChannelSelectMenuBuilder, JSONEncodable, MentionableSelectMenuBuilder, MessageActionRowComponentBuilder, RoleSelectMenuBuilder, StringSelectMenuBuilder, TextInputBuilder, UserSelectMenuBuilder } from 'discord.js';

export function makeButtonRowBuilder(component?: JSONEncodable<APIActionRowComponent<ReturnType<any>>> | APIActionRowComponent<ReturnType<any>>) {
    if(component)
        return (ActionRowBuilder.from(component) as ActionRowBuilder<ButtonBuilder>);
    return new ActionRowBuilder<ButtonBuilder>();
}

export function makeChannelSelectMenuRowBuilder(component?: JSONEncodable<APIActionRowComponent<ReturnType<any>>> | APIActionRowComponent<ReturnType<any>>) {
    if(component)
        return ActionRowBuilder.from(component) as ActionRowBuilder<ChannelSelectMenuBuilder>;
    return new ActionRowBuilder<ChannelSelectMenuBuilder>();
}

export function makeMentionableSelectMenuRowBuilder(component?: JSONEncodable<APIActionRowComponent<ReturnType<any>>> | APIActionRowComponent<ReturnType<any>>) {
    if(component)
        return ActionRowBuilder.from(component) as ActionRowBuilder<MentionableSelectMenuBuilder>;
    return new ActionRowBuilder<MentionableSelectMenuBuilder>();
}

export function makeRoleSelectMenuRowBuilder(component?: JSONEncodable<APIActionRowComponent<ReturnType<any>>> | APIActionRowComponent<ReturnType<any>>) {
    if(component)
        return ActionRowBuilder.from(component) as ActionRowBuilder<RoleSelectMenuBuilder>;
    return new ActionRowBuilder<RoleSelectMenuBuilder>();
}

export function makeStringSelectMenuRowBuilder(component?: JSONEncodable<APIActionRowComponent<ReturnType<any>>> | APIActionRowComponent<ReturnType<any>>) {
    if(component)
        return ActionRowBuilder.from(component) as ActionRowBuilder<StringSelectMenuBuilder>;
    return new ActionRowBuilder<StringSelectMenuBuilder>();
}

export function makeUserSelectMenuRowBuilder(component?: JSONEncodable<APIActionRowComponent<ReturnType<any>>> | APIActionRowComponent<ReturnType<any>>) {
    if(component)
        return ActionRowBuilder.from(component) as ActionRowBuilder<UserSelectMenuBuilder>;
    return new ActionRowBuilder<UserSelectMenuBuilder>();
}

export function makeTextInputRowBuilder(component?: JSONEncodable<APIActionRowComponent<ReturnType<any>>> | APIActionRowComponent<ReturnType<any>>) {
    if(component)
        return ActionRowBuilder.from(component) as ActionRowBuilder<TextInputBuilder>;
    return new ActionRowBuilder<TextInputBuilder>();
}

export function makeMessageActionRowBuilder(component?: JSONEncodable<APIActionRowComponent<ReturnType<any>>> | APIActionRowComponent<ReturnType<any>>) {
    if(component)
        return ActionRowBuilder.from(component) as ActionRowBuilder<MessageActionRowComponentBuilder>;
    return new ActionRowBuilder<MessageActionRowComponentBuilder>();
}
