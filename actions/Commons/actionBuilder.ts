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

export type ContextMenuActionHandler<T extends ContextMenuInteraction = ContextMenuInteraction> = (request: T) => Promise<any>;

/**Representa una acción de menú contextual*/
export class ContextMenuAction {
	name: string;
	localizations: Map<DiscordLocale, string>;
	type: ApplicationCommandType;
	execute: ContextMenuActionHandler;

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
	setResponse(responseFn: ContextMenuActionHandler<ContextMenuCommandInteraction<'cached'>>) {
		this.execute = responseFn;
		return this;
	}

    /** @param responseFn Acción a realizar al indicarse su ejecución*/
	setMessageResponse(responseFn: ContextMenuActionHandler<MessageContextMenuCommandInteraction<'cached'>>) {
		this.execute = responseFn;
		return this;
	}

    /** @param responseFn Acción a realizar al indicarse su ejecución*/
	setUserResponse(responseFn: ContextMenuActionHandler<UserContextMenuCommandInteraction<'cached'>>) {
		this.execute = responseFn;
		return this;
	}
}
