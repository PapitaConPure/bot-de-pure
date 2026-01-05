const { ApplicationCommandType, Locale } = require('discord.js');
const { Translator } = require('../../i18n');

/**
 * @typedef {'ChatInput' | 'Message' | 'User'} CommandTypes
 * @typedef {import('discord.js').ContextMenuCommandInteraction<'cached'>|import('discord.js').MessageContextMenuCommandInteraction<'cached'>|import('discord.js').UserContextMenuCommandInteraction<'cached'>} ContextMenuInteraction
 */

/**
 * @template {ContextMenuInteraction} [T=ContextMenuInteraction]
 * @typedef {(request: T) => Promise<*>} ContextMenuAction
 */

/**Representa una acción de menú contextual*/
class ContextMenuActionManager {
    /**@type {String}*/
    name;
    /**@type {Map<import('discord.js').LocaleString, String>}*/
    localizations;
    /**@type {ApplicationCommandType}*/
    type;
    /**@type {ContextMenuAction}*/
    execute;

    /**
     * Crea una acción de menú contextual
     * @param {import('../../i18n').LocaleIds} nameLocaleId ID de traducción del nombre único de la acción
     * @param {CommandTypes} type Tipo de acción de menú contextual
     * @constructor
     */
    constructor(nameLocaleId, type) {
        const translation = Translator.getTranslation(nameLocaleId);

        this.name = translation['es'];
        this.type = ApplicationCommandType[type];

        this.localizations = new Map();
        this.localizations.set(Locale.EnglishUS, translation['en']);
        this.localizations.set(Locale.EnglishGB, translation['en']);
        this.localizations.set(Locale.Japanese,  translation['ja']);
    }

    /** @param {ContextMenuAction<import('discord.js').ContextMenuCommandInteraction<'cached'>>} responseFn Acción a realizar al indicarse su ejecución*/
    setResponse(responseFn) {
        this.execute = responseFn;
        return this;
    }

    /** @param {ContextMenuAction<import('discord.js').MessageContextMenuCommandInteraction<'cached'>>} responseFn Acción a realizar al indicarse su ejecución*/
    setMessageResponse(responseFn) {
        this.execute = responseFn;
        return this;
    }

    /** @param {ContextMenuAction<import('discord.js').UserContextMenuCommandInteraction<'cached'>>} responseFn Acción a realizar al indicarse su ejecución*/
    setUserResponse(responseFn) {
        this.execute = responseFn;
        return this;
    }
}

module.exports = {
    ContextMenuActionManager,
}
