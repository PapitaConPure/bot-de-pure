const { ApplicationCommandType, Locale, ContextMenuCommandInteraction, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction } = require('discord.js');
const { Translator, LocaleIds } = require('../../internationalization');

/**
 * @typedef {'ChatInput' | 'Message' | 'User'} CommandTypes
 * @typedef {(interaction: ContextMenuCommandInteraction) => Promise<*>} ContextMenuAction
 * @typedef {(interaction: MessageContextMenuCommandInteraction) => Promise<*>} MessageContextMenuAction
 * @typedef {(interaction: UserContextMenuCommandInteraction) => Promise<*>} UserContextMenuAction
 */

/**Representa una acción de menú contextual*/
class ContextMenuActionManager {
    /**@type {String}*/
    name;
    /**@type {Map<String, String>}*/
    localizations;
    /**@type {ApplicationCommandType}*/
    type;
    /**@type {ContextMenuAction|MessageContextMenuAction|UserContextMenuAction}*/
    execute;

    /**
     * Crea una acción de menú contextual
     * @param {LocaleIds} nameLocaleId ID de traducción del nombre único de la acción
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
    }

    /** @param {ContextMenuAction} responseFn Acción a realizar al indicarse su ejecución*/
    setResponse(responseFn) {
        this.execute = responseFn;
        return this;
    }

    /** @param {MessageContextMenuAction} responseFn Acción a realizar al indicarse su ejecución*/
    setMessageResponse(responseFn) {
        this.execute = responseFn;
        return this;
    }

    /** @param {UserContextMenuAction} responseFn Acción a realizar al indicarse su ejecución*/
    setUserResponse(responseFn) {
        this.execute = responseFn;
        return this;
    }
}

module.exports = {
    ContextMenuActionManager,
}