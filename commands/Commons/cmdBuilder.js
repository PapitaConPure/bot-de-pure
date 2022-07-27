const { CommandOptionsManager } = require('./cmdOpts');
const { CommandMetaFlagsManager } = require('./cmdFlags');
const { CommandRequest, CommandOptions } = require('./typings');
const { Interaction, ButtonInteraction, SelectMenuInteraction, ModalSubmitInteraction, MessagePayload, InteractionReplyOptions } = require('discord.js');

/**Representa un comando*/
class CommandManager {
    /**@type {String}*/
    name;
    /**@type {Array<String>?}*/
	aliases;
    /**@type {String?}*/
	desc;
    /**@type {String?}*/
	brief;
    /**@type {CommandMetaFlagsManager}*/
	flags;
    /**@type {CommandOptionsManager?}*/
	options;
    /**@type {String?}*/
	callx;
    /**@type {Boolean?}*/
	experimental;
    /**
     * @typedef {String | MessagePayload | InteractionReplyOptions} ReplyOptions
     * @type {ReplyOptions}
     */
    reply;
    /**
     * @typedef {(request: CommandRequest, args: CommandOptions, isSlash = false) => Promise<*>} ExecutionFunction
     * @typedef {(interaction: Interaction, ...args: String) => Promise<*>} InteractionResponseFunction
     * @typedef {(interaction: ButtonInteraction, ...args: String) => Promise<*>} ButtonResponseFunction
     * @typedef {(interaction: SelectMenuInteraction, ...args: String) => Promise<*>} SelectMenuResponseFunction
     * @typedef {(interaction: ModalSubmitInteraction, ...args: String) => Promise<*>} ModalResponseFunction
     * @type {ExecutionFunction}
     */
    execute;

    /**
     * 
     * @param {String} name
     * @param {CommandMetaFlagsManager} flags
     */
    constructor(name, flags) {
        if(typeof name !== 'string') throw new TypeError('El nombre debe ser un string');
        if(!flags?.bitField)         throw new TypeError('Las flags deben ser un CommandMetaFlagsManager');
        this.name = name;
        this.flags = flags;
        this.experimental = true;
        this.execute = (request, _args, _isSlash) => request.reply(this.reply);
    };

    /**@param {...String} aliases*/
    setAliases(...aliases) {
        if(!aliases.length) throw new Error('Debes pasar al menos un alias');
        this.aliases = aliases;
        return this;
    };
    
    /**@param {String} desc*/
    setBriefDescription(desc) {
        if(typeof desc !== 'string') throw new TypeError('La descripción debe ser un string');
        if(!desc.length)             throw new Error('Debes escribir una descripción válida');
        this.brief = desc;
        return this;
    };
    
    /**@param {...String} desc*/
    setLongDescription(...desc) {
        if(!desc.length) throw new Error('Debes especificar una descripción');
        this.desc = desc.join('\n');
        return this;
    };
    
    /**@param {CommandOptionsManager} options*/
    setOptions(options) {
        if(!options.options) throw new Error('Las opciones deben ser un CommandOptionsManager');
        this.options = options;
        this.callx = options.callSyntax;
        return this;
    };
    
    /**@param {Boolean?} experimental*/
    setExperimental(experimental) {
        this.experimental = experimental ?? false;
        return this;
    };

    /**@param {ReplyOptions} replyOptions*/
    setReply(replyOptions) {
        this._reply = replyOptions;
        return this;
    }

    /**@param {ExecutionFunction} exeFn*/
    setExecution(exeFn) {
        this.execute = exeFn;
        return this;
    };

    /**@param {Function} fn Una función no anónima*/
    setFunction(fn) {
        const functionName = fn.name;
        this[functionName] = fn;
        return this;
    }

    /**@param {InteractionResponseFunction} responseFn Una función no anónima a ejecutar al recibir una interacción*/
    setInteractionResponse(responseFn) {
        return this.setFunction(responseFn);
    };

    /**@param {ButtonResponseFunction} responseFn Una función no anónima a ejecutar al recibir una interacción*/
    setButtonResponse(responseFn) {
        return this.setFunction(responseFn)
    };

    /**@param {SelectMenuResponseFunction} responseFn Una función no anónima a ejecutar al recibir una interacción*/
    setSelectMenuResponse(responseFn) {
        return this.setFunction(responseFn)
    };

    /**@param {ModalResponseFunction} responseFn Una función no anónima a ejecutar al recibir una interacción*/
    setModalResponse(responseFn) {
        return this.setFunction(responseFn)
    };
};

module.exports = {
    CommandManager,
};