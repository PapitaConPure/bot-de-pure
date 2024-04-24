const { CommandOptionsManager } = require('./cmdOpts');
const { CommandMetaFlagsManager } = require('./cmdFlags');
const { ComplexCommandRequest, CommandOptions } = require('./typings');
const { Interaction, ButtonInteraction, SelectMenuInteraction, ModalSubmitInteraction, MessagePayload, InteractionReplyOptions, PermissionsBitField, PermissionFlagsBits } = require('discord.js');
const { CommandPermissions } = require('./cmdPerms');

/**Representa un comando*/
class CommandManager {
    /**@type {String}*/
    name;
    /**@type {Array<String>?}*/
	aliases;
    /**@type {String}*/
	desc;
    /**@type {String?}*/
	brief;
    /**@type {CommandMetaFlagsManager}*/
	flags;
    /**@type {CommandPermissions}*/
    permissions;
    /**@type {CommandOptionsManager?}*/
	options;
    /**@type {String?}*/
	callx;
    /**
     * @type {Boolean?}
     * @deprecated Los comandos mensaje/Slash experimentales ya se adoptaron como la norma
     */
	experimental;
    /**@type {Map<String, any>}*/
    memory;
    /**
     * @typedef {String | MessagePayload | InteractionReplyOptions} ReplyOptions
     * @type {ReplyOptions}
     */
    reply;
    /**
     * @typedef {(request: ComplexCommandRequest, args: CommandOptions, isSlash = false, rawArgs: string) => Promise<*>} ExecutionFunction
     * @typedef {(interaction: Interaction, ...args: String[]) => Promise<*>} InteractionResponseFunction
     * @typedef {import('discord.js').ModalMessageModalSubmitInteraction<ModalSubmitInteraction>} ModalResponseInteraction
     * @typedef {(interaction: ButtonInteraction, ...args: String[]) => Promise<*>} ButtonResponseFunction
     * @typedef {(interaction: SelectMenuInteraction, ...args: String[]) => Promise<*>} SelectMenuResponseFunction
     * @typedef {(interaction: ModalResponseInteraction, ...args: String[]) => Promise<*>} ModalResponseFunction
     * @type {ExecutionFunction}
     */
    execute;
    
    /**
     * Crea un comando
     * @param {String} name El nombre identificador del comando
     * @param {CommandMetaFlagsManager} flags Un objeto {@linkcode CommandMetaFlagsManager} con las flags del comando
     */
    constructor(name, flags) {
        if(typeof name !== 'string') throw new TypeError('El nombre debe ser un string');
        if(!name.length)             throw new Error('El nombre del comando no puede estar vacío');
        if(!flags?.bitField)         throw new TypeError('Las flags deben ser un CommandMetaFlagsManager');
        this.name = name;
        this.flags = flags;
        this.permissions = new CommandPermissions();
        this.actions = [];
        this.experimental = true;
        this.memory = new Map();
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
    
    /**@param {...String} desc*/
    setDescription(...desc) {
        return this.setLongDescription(...desc);
    };
    
    /**@param {CommandPermissions} permissions*/
    setPermissions(permissions) {
        if(typeof (permissions?.isAllowed) !== 'function')
            throw new TypeError('Las opciones deben ser una instancia de CommandPermissions');

        this.permissions = permissions;
        return this;
    };
    
    /**@param {CommandOptionsManager} options*/
    setOptions(options) {
        if(!options.options) throw new Error('Las opciones deben ser un CommandOptionsManager');
        this.options = options;
        this.callx = options.callSyntax;
        return this;
    };
    
    /**
     * @param {Boolean?} experimental
     * @deprecated Los comandos mensaje/Slash experimentales ya se adoptaron como la norma
     */
    setExperimental(experimental) {
        this.experimental = experimental ?? false;
        return this;
    };

    /**@param {ReplyOptions} replyOptions*/
    setReply(replyOptions) {
        this.reply = replyOptions;
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
        return this.setFunction(responseFn);
    };

    /**@param {SelectMenuResponseFunction} responseFn Una función no anónima a ejecutar al recibir una interacción*/
    setSelectMenuResponse(responseFn) {
        return this.setFunction(responseFn);
    };

    /**@param {ModalResponseFunction} responseFn Una función no anónima a ejecutar al recibir una interacción*/
    setModalResponse(responseFn) {
        return this.setFunction(responseFn);
    };

    /**@param {import('./typings').CommandRequest} request*/
    static requestize(request) {
        if(request.author)
            request.user = request.author;
        
        request.userId ??= request.user.id;
    }
};

module.exports = {
    CommandManager,
};