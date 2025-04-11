const { Message, CommandInteraction, Collection } = require('discord.js');

/**
 * @typedef {Object} ExtendedCommandRequestPrototype
 * @property {Message<Boolean>} initialReply The command's initial reply
 * @property {Boolean} isMessage Whether the command is a message command (true) or not (false)
 * @property {Boolean} isInteraction Whether the command is an interaction or Slash command (true) or not (false)
 * @property {() => Message<true>} inferAsMessage Infers the command as a guild Message Command. Throws an error if the command isn't really a Message Command
 * @property {() => import('discord.js').ChatInputCommandInteraction<'cached'>} inferAsSlash Infers the command as a cached Slash Command Interaction. Throws an error if the command isn't really a Slash Command
 * 
 * @property {import('discord.js').MessageActivity?} activity If the command is a message command, returns the message's activity (if any)
 * @property {Collection<import('discord.js').Snowflake, import('discord.js').Attachment>} attachments A collection of the command's attachments, if it's a message command and it has attachments
 * @property {Readonly<import('discord.js').PermissionsBitField>} appPermisions The permissions of the application or bot in the current channel
 * @property {Boolean} deferred
 * @property {Boolean} replied
 * @property {Readonly<import('discord.js').PermissionsBitField>} memberPermissions The permissions within the current channel of the member who started the command
 * @property {import('discord.js').User} user The user who started the command
 * @property {String} userId The id of the user who started the command
 * 
 * @property {(options?: (string|import('discord.js').MessagePayload)&(import('discord.js').MessageEditOptions|import('discord.js').InteractionReplyOptions)|{}|undefined) => Promise<Message<Boolean>>} reply If a Slash command, defers the initial reply. Otherwise, sends a message and remembers it as the initial reply
 * @property {(options?: (string|import('discord.js').MessagePayload)&(import('discord.js').MessageEditOptions|import('discord.js').InteractionReplyOptions)|{}|undefined) => Promise<Message<Boolean>>} replyFirst If a Slash command, defers the initial reply. Otherwise, sends a message and remembers it as the initial reply
 * @property {(options?: import('discord.js').InteractionDeferReplyOptions) => Promise<Message<Boolean>>} deferReply If a Slash command, defers the initial reply. Otherwise, sends a message and remembers it as the initial reply
 * @property {() => Promise<Message<Boolean>>} delete Deletes the original message if the command is a message command
 * @property {() => Promise<Message<Boolean>>} deleteReply Deletes the initial reply
 * @property {(options: (string|import('discord.js').MessagePayload)&(import('discord.js').MessageEditOptions|import('discord.js').InteractionEditReplyOptions)|{}|undefined) => Promise<Message<Boolean>>} editReply Edits the initial reply
 * @property {() => Boolean} wasDeferred Determines whether the initial reply was deferred (true) or not (false)
 * @property {() => Boolean} wasReplied Determines whether the initial reply was sent (true) or not (false)
 */

/**@type {ExtendedCommandRequestPrototype}*/
const extendedCommandRequestPrototype = {
    initialReply: undefined,
    isInteraction: false,
    isMessage: false,
    inferAsMessage: undefined,
    inferAsSlash: undefined,
    
    activity: undefined,
    attachments: undefined,
    appPermisions: undefined,
    deferred: undefined,
    replied: undefined,
    memberPermissions: undefined,
    user: undefined,
    userId: undefined,

    reply: undefined,
    replyFirst: undefined,
    deferReply: undefined,
    delete: undefined,
    deleteReply: undefined,
    editReply: undefined,
    wasDeferred: undefined,
    wasReplied: undefined,
};

/**
 * @param {import('./typings').CommandRequest} request
 * @returns {import('./typings').ComplexCommandRequest}
 */
function extendRequest(request) {
    /**@type {ExtendedCommandRequestPrototype}*/
    const extension = Object.assign({}, extendedCommandRequestPrototype);
    
    if(CommandManager.requestIsMessage(request)) {
        extension.isMessage = true;
        extension.inferAsMessage = () => request;
        extension.inferAsSlash = () => { throw 'Invalid inference of a Message Command into a Slash Command' };

        extension.appPermisions = request.guild.members.me.permissionsIn(request.channel);
        extension.deferred = false;
        extension.replied = false;
        extension.memberPermissions = request.member.permissionsIn(request.channel);
        extension.user = request.author;
        extension.userId = request.author.id;

        extension.deferReply = async() => {
            const initialReply = await request.reply({ content: '...' });
            extension.initialReply = initialReply;
            extension.deferred = true;
            return initialReply;
        };
        extension.deleteReply = async() => extension.initialReply?.delete();
        extension.editReply = async(options) => {
            if(extension.initialReply == undefined)
                throw "No se encontró una respuesta inicial de comando a editar";
            
            extension.replied = true;

            return extension.initialReply.edit(typeof options === 'string' ? options : { content: '', ...options });
        };
        extension.replyFirst = async(options) => {
            const replied = request.reply(options);
            extension.replied = true;
            return replied;
        }
        extension.wasDeferred = () => extension.deferred;
        extension.wasReplied = () => extension.replied;
    } else {
        extension.isInteraction = true;
        extension.inferAsMessage = () => { throw 'Invalid inference of a Slash Command into a Message Command' };
        extension.inferAsSlash = () => request;
        
        extension.activity = null;
        extension.attachments = new Collection();
        extension.userId = request.user.id;

        extension.delete = async() => undefined;
        extension.wasDeferred = () => request.deferred;
        extension.wasReplied = () => request.replied;
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
 * @param {import('./typings').ComplexCommandRequest} request El comando disparado, ya sea de mensaje o Slash
 * @param {import('./typings').CommandArguments} args El administrador de opciones del comando
 * @param {Boolean} [isSlash] Si es un comando Slash (true) o no (false)
 * @param {String} [rawArgs] Argumentos sin modificar, como una sola cadena
 * @returns {Promise<*>}
 */
// eslint-disable-next-line no-unused-vars
async function executeFnSample(request, args, isSlash = false, rawArgs = undefined) {}

/**
 * @typedef {(request: import('./typings').ComplexCommandRequest, args: import('./cmdOpts').CommandOptionSolver, rawArgs?: String | null) => Promise<*>} ExecutionFunction
 */
/**
 * @typedef {Object} InteractionResponseOptions
 * @property {Number} [userFilterIndex] Índice donde se recibirá la ID del único usuario permitido para esta interacción. La misma deberá estar comprimida con la función `compressId`. Si es `null` o `undefined`, esta interacción será pública
 */

/**Representa un comando*/
class CommandManager {
    /**
     * @typedef {typeof executeFnSample} CompatibilityExecutionFunction
     * @typedef {(interaction: import('discord.js').Interaction, ...args: String[]) => Promise<*>} InteractionResponseFunction
     * @typedef {import('discord.js').ModalMessageModalSubmitInteraction<'cached'>} ModalResponseInteraction
     * @typedef {(interaction: import('discord.js').ButtonInteraction<'cached'>, ...args: String[]) => Promise<*>} ButtonResponseFunction
     * @typedef {(interaction: import('discord.js').SelectMenuInteraction<'cached'>, ...args: String[]) => Promise<*>} SelectMenuResponseFunction
     * @typedef {(interaction: ModalResponseInteraction, ...args: String[]) => Promise<*>} ModalResponseFunction
     * @typedef {(String | import('discord.js').MessagePayload | import('discord.js').MessageReplyOptions) & import('discord.js').InteractionReplyOptions & { fetchReply: Boolean }} ReplyOptions
     */

    /**@type {String}*/
    name;
    /**@type {Array<String>?}*/
	aliases;
    /**@type {String}*/
	desc;
    /**@type {String?}*/
	brief;
    /**@type {import('./cmdTags').CommandTags}*/
	flags;
    /**@type {import('./cmdPerms').CommandPermissions}*/
    permissions;
    /**@type {import('./cmdOpts').CommandOptions?}*/
	options;
    /**@type {String?}*/
	callx;
    /**
     * Define si usar una unión `string[] | CommandInteractionOptionResolver` por compatibilidad en lugar de un {@link CommandOptionSolver} para los `args`
     * @type {Boolean?}
     */
	legacy;
    /**@type {Map<String, any>}*/
    memory;
    /**@type {ReplyOptions}*/
    reply;
    /**@type {ExecutionFunction}*/
    execute;
    
    /**
     * Crea un comando
     * @param {String} name El nombre identificador del comando
     * @param {import('./cmdTags').CommandTags} tags Un objeto {@linkcode CommandTags} con las flags del comando
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
        this.legacy = false;
        this.memory = new Map();
        this.execute = request => request.reply(this.reply);
    };

    /**Alias de `<CommandManager>.flags`*/
    get tags() {
        return this.flags;
    }

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
    
    /**@param {import('./cmdPerms').CommandPermissions} permissions*/
    setPermissions(permissions) {
        if(typeof (permissions?.isAllowed) !== 'function')
            throw new TypeError('Las opciones deben ser una instancia de CommandPermissions');

        this.permissions = permissions;
        return this;
    };
    
    /**@param {import('./cmdOpts').CommandOptions} options*/
    setOptions(options) {
        if(!options.options) throw new Error('Las opciones deben ser un CommandOptions');
        this.options = options;
        this.callx = options.callSyntax;
        return this;
    };

    /**@param {ReplyOptions} replyOptions*/
    setReply(replyOptions) {
        this.reply = replyOptions;
        return this;
    }

    /**
     * Habilita {@linkcode CommandManager.legacy} y establece la función de ejecución de este comando
     * @param {CompatibilityExecutionFunction} exeFn
     */
    setLegacyExecution(exeFn) {
        this.legacy = true;
        //@ts-expect-error
        this.execute = exeFn;
        return this;
    }

    /**
     * Establece la función de ejecución de este comando
     * @param {ExecutionFunction} exeFn
     */
    setExecution(exeFn) {
        this.execute = exeFn;
        return this;
    }

    /**
     * @param {Function} fn Una función no anónima
     * @param {InteractionResponseOptions} [options] Opciones de respuesta de interacción
     */
    setFunction(fn, options = {}) {
        const functionName = fn.name;
        this[functionName] = fn;
        fn['userFilterIndex'] = options.userFilterIndex;
        return this;
    }

    /**
     * @param {InteractionResponseFunction} responseFn Una función no anónima a ejecutar al recibir una interacción
     * @param {InteractionResponseOptions} [options] Opciones adicionales para controlar las respuestas de interacción
     */
    setInteractionResponse(responseFn, options = {}) {
        return this.setFunction(responseFn, options);
    };

    /**
     * @param {ButtonResponseFunction} responseFn Una función no anónima a ejecutar al recibir una interacción
     * @param {InteractionResponseOptions} [options] Opciones adicionales para controlar las respuestas de interacción
     */
    setButtonResponse(responseFn, options = {}) {
        return this.setFunction(responseFn, options);
    };

    /**
     * @param {SelectMenuResponseFunction} responseFn Una función no anónima a ejecutar al recibir una interacción
     * @param {InteractionResponseOptions} [options] Opciones adicionales para controlar las respuestas de interacción
     */
    setSelectMenuResponse(responseFn, options = {}) {
        return this.setFunction(responseFn, options);
    };

    /**
     * @param {ModalResponseFunction} responseFn Una función no anónima a ejecutar al recibir una interacción
     * @param {InteractionResponseOptions} [options] Opciones adicionales para controlar las respuestas de interacción
     */
    setModalResponse(responseFn, options = {}) {
        return this.setFunction(responseFn, options);
    };

    /**
     * @param {import('./typings').CommandRequest|import('discord.js').Interaction} request
     * @returns {request is Message<true>}
     */
    static requestIsMessage(request) {
        return request instanceof Message;
    }

    /**
     * @param {import('./typings').CommandRequest|import('discord.js').Interaction} request
     * @returns {request is CommandInteraction<'cached'>}
     */
    static requestIsInteraction(request) {
        return request instanceof CommandInteraction;
    }

    /**@param {import('./typings').CommandRequest} request*/
    static requestize(request) {
        return extendRequest(request);
    }
};

module.exports = {
    CommandManager,
};
