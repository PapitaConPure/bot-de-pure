import { ApplicationCommandType, ContextMenuCommandInteraction, Locale as DiscordLocale, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction } from 'discord.js';
import { LocaleIds, Translator } from '../../i18n';

export type ActionCommandType =
    | 'ChatInput'
    | 'Message'
    | 'User';

export type ContextMenuInteraction =
    | ContextMenuCommandInteraction<'cached'>
    | MessageContextMenuCommandInteraction<'cached'>
    | UserContextMenuCommandInteraction<'cached'>;

export type ContextMenuAction<T extends ContextMenuInteraction = ContextMenuInteraction> = (request: T) => Promise<any>;

/**Representa una acción de menú contextual*/
export class ContextMenuActionManager {
    name: string;
    localizations: Map<DiscordLocale, string>;
    type: ApplicationCommandType;
    execute: ContextMenuAction;

    constructor(nameLocaleId: LocaleIds, type: ActionCommandType) {
        const translation = Translator.getTranslation(nameLocaleId);

        this.name = translation['es'];
        this.type = ApplicationCommandType[type];

        this.localizations = new Map();
        this.localizations.set(DiscordLocale.EnglishUS, translation['en']);
        this.localizations.set(DiscordLocale.EnglishGB, translation['en']);
        this.localizations.set(DiscordLocale.Japanese,  translation['ja']);
    }

    /** @param responseFn Acción a realizar al indicarse su ejecución*/
    setResponse(responseFn: ContextMenuAction<ContextMenuCommandInteraction<'cached'>>) {
        this.execute = responseFn;
        return this;
    }

    /** @param responseFn Acción a realizar al indicarse su ejecución*/
    setMessageResponse(responseFn: ContextMenuAction<MessageContextMenuCommandInteraction<'cached'>>) {
        this.execute = responseFn;
        return this;
    }

    /** @param responseFn Acción a realizar al indicarse su ejecución*/
    setUserResponse(responseFn: ContextMenuAction<UserContextMenuCommandInteraction<'cached'>>) {
        this.execute = responseFn;
        return this;
    }
}
