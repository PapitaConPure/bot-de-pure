const { CommandOptions, CommandOptionSolver } = require('./cmdOpts');
const { CommandTags } = require('./cmdTags');
// @ts-ignore
const { CommandRequest, ComplexCommandRequest, CommandArguments } = require('./typings');
// @ts-ignore
const { Snowflake, User, Interaction, ButtonInteraction, SelectMenuInteraction, MessagePayload, InteractionReplyOptions, CommandInteractionOptionResolver, Message, CommandInteraction, PermissionsBitField, Collection, Attachment, MessageActivity, InteractionDeferReplyOptions, MessageEditOptions, InteractionEditReplyOptions } = require('discord.js');
const { CommandPermissions } = require('./cmdPerms');

/**
 * @typedef {Object} ExtendedCommandRequestPrototype
 * @property {Message<Boolean>} initialReply The command's initial reply
 * @property {Boolean} isMessage Whether the command is a message command (true) or not (false)
 * @property {Boolean} isInteraction Whether the command is an interaction or Slash command (true) or not (false)
 * 
 * @property {MessageActivity?} activity If the command is a message command, returns the message's activity (if any)
 * @property {Collection<Snowflake, Attachment>} attachments A collection of the command's attachments, if it's a message command and it has attachments
 * @property {Readonly<PermissionsBitField>} appPermisions The permissions of the application or bot in the current channel
 * @property {Boolean} deferred
 * @property {Readonly<PermissionsBitField>} memberPermissions The permissions within the current channel of the member who started the command
 * @property {User} user The user who started the command
 * @property {String} userId The id of the user who started the command
 * 
 * @property {(options?: InteractionDeferReplyOptions) => Promise<Message<Boolean>>} deferReply If a Slash command, defers the initial reply. Otherwise, sends a message and remembers it as the initial reply
 * @property {() => Promise<Message<Boolean>>} delete Deletes the original message if the command is a message command
 * @property {() => Promise<Message<Boolean>>} deleteReply Deletes the initial reply
 * @property {(options: (string|MessagePayload)&(MessageEditOptions|InteractionEditReplyOptions)|{}|undefined) => Promise<Message<Boolean>>} editReply Edits the initial reply
 */

/**@type {ExtendedCommandRequestPrototype}*/
const extendedCommandRequestPrototype = {
    initialReply: undefined,
    isInteraction: false,
    isMessage: false,
    
    activity: undefined,
    attachments: undefined,
    appPermisions: undefined,
    deferred: undefined,
    memberPermissions: undefined,
    user: undefined,
    userId: undefined,

    deferReply: undefined,
    delete: undefined,
    deleteReply: undefined,
    editReply: undefined,
};

/**
 * @param {CommandRequest} request
 * @returns {ComplexCommandRequest}
 */
function extendRequest(request) {
    /**@type {ExtendedCommandRequestPrototype}*/
    const extension = Object.assign({}, extendedCommandRequestPrototype);
    
    if(CommandManager.requestIsMessage(request)) {
        extension.isMessage = true;

        extension.appPermisions = request.guild.members.me.permissionsIn(request.channel);
        extension.deferred = false;
        extension.memberPermissions = request.member.permissionsIn(request.channel);
        extension.user = request.author;
        extension.userId = request.author.id;

        extension.deferReply = async(_) => {
            const initialReply = await request.reply({ content: '...' });
            extension.initialReply = initialReply;
            extension.deferred = true;
            return initialReply;
        };
        extension.deleteReply = async() => extension.initialReply?.delete();
        extension.editReply = async(options) => {
            if(extension.initialReply == undefined)
                throw "No se encontró una respuesta inicial de comando a editar";
            
            return extension.initialReply.edit(typeof options === 'string' ? options : { content: '', ...options });
        };
    } else {
        extension.isInteraction = true;
        
        extension.activity = null;
        extension.attachments = new Collection();
        extension.userId = request.user.id;

        extension.delete = async() => undefined;
    }

    for(const [k, v] of Object.entries(extension)) {
        if(v !== undefined)
            request[k] = v;
    }

    // @ts-expect-error
    return request;
}

/**
 * 
 * @param {ComplexCommandRequest} request El comando disparado, ya sea de mensaje o Slash
 * @param {CommandArguments} args El administrador de opciones del comando
 * @param {Boolean} [isSlash] Si es un comando Slash (true) o no (false)
 * @param {String} [rawArgs] Argumentos sin modificar, como una sola cadena
 * @returns {Promise<*>}
 */
async function executeFnSample(request, args, isSlash = false, rawArgs = undefined) {}

/**
 * @typedef {(request: ComplexCommandRequest, args: CommandOptionSolver) => Promise<*>} ExperimentalExecuteFunction
 */

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
    /**@type {CommandTags}*/
	flags;
    /**@type {CommandPermissions}*/
    permissions;
    /**@type {CommandOptions?}*/
	options;
    /**@type {String?}*/
	callx;
    /**
     * Define si usar un {@link CommandOptionSolver} en lugar de la unión `string[] | CommandInteractionOptionResolver`
     * @type {Boolean?}
     * 
     */
	experimental;
    /**@type {Map<String, any>}*/
    memory;
    /**
     * @typedef {(String | MessagePayload | import('discord.js').MessageReplyOptions) & InteractionReplyOptions & { fetchReply: Boolean }} ReplyOptions
     * @type {ReplyOptions}
     */
    reply;
    /**
     * @typedef {typeof executeFnSample} ExecutionFunction
     * @typedef {(interaction: Interaction, ...args: String[]) => Promise<*>} InteractionResponseFunction
     * @typedef {import('discord.js').ModalMessageModalSubmitInteraction<'cached'>} ModalResponseInteraction
     * @typedef {(interaction: ButtonInteraction<'cached'>, ...args: String[]) => Promise<*>} ButtonResponseFunction
     * @typedef {(interaction: SelectMenuInteraction<'cached'>, ...args: String[]) => Promise<*>} SelectMenuResponseFunction
     * @typedef {(interaction: ModalResponseInteraction, ...args: String[]) => Promise<*>} ModalResponseFunction
     * @type {ExecutionFunction}
     */
    execute;
    
    /**
     * Crea un comando
     * @param {String} name El nombre identificador del comando
     * @param {CommandTags} tags Un objeto {@linkcode CommandTags} con las flags del comando
     */
    constructor(name, tags) {
        if(typeof name !== 'string') throw new TypeError('El nombre debe ser un string');
        if(!name.length)             throw new Error('El nombre del comando no puede estar vacío');
        if(!tags)                    throw new TypeError('Debes suministrar CommandTags para el comando');
        if(!tags.bitfield)           throw new TypeError('Las flags deben ser un CommandTags');
        this.name = name;
        this.aliases = [];
        this.flags = tags;
        this.actions = [];
        this.experimental = false;
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
    
    /**@param {CommandOptions} options*/
    setOptions(options) {
        if(!options.options) throw new Error('Las opciones deben ser un CommandOptions');
        this.options = options;
        this.callx = options.callSyntax;
        return this;
    };
    
    /**
     * Define si usar un {@link CommandOptionSolver} en lugar de la unión `string[] | CommandInteractionOptionResolver`
     * @param {Boolean} [experimental=false] Si establecer el comando como experimental (true) o no (false)
     * 
     */
    setExperimental(experimental = false) {
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

    /**@param {ExperimentalExecuteFunction} exeFn*/
    setExperimentalExecution(exeFn) {
        // @ts-ignore
        this.execute = exeFn;
        return this;
    }

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

    /**
     * @param {CommandRequest|Interaction} request
     * @returns {request is Message<true>}
     */
    static requestIsMessage(request) {
        return request instanceof Message;
    }

    /**
     * @param {CommandRequest|Interaction} request
     * @returns {request is CommandInteraction<'cached'>}
     */
    static requestIsInteraction(request) {
        return request instanceof CommandInteraction;
    }

    /**@param {CommandRequest} request*/
    static requestize(request) {
        return extendRequest(request);
    }
};

module.exports = {
    CommandManager,
};