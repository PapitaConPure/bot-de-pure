import { Message, CommandInteraction, Collection, ChatInputCommandInteraction, Snowflake, Attachment, PermissionsBitField, MessagePayload, MessageEditOptions, InteractionReplyOptions, InteractionDeferReplyOptions, InteractionEditReplyOptions, User, MessageComponentInteraction, MessageActionRowComponentBuilder, Interaction, ModalMessageModalSubmitInteraction, ButtonInteraction, SelectMenuInteraction, MessageReplyOptions, MessageFlags, InteractionCallbackResponse, BooleanCache, InteractionResponse, Client, InteractionCallback, InteractionCallbackResource, BaseInteraction, ContextMenuCommandInteraction, InteractionType } from 'discord.js';
import { CommandTags } from './cmdTags';
import { CommandArguments, CommandRequest, ComplexCommandRequest, ComponentInteraction, ExtendedCommandRequest } from './typings';
import { CommandOptions, CommandOptionSolver } from './cmdOpts';
import { CommandPermissions } from './cmdPerms';

const extendedCommandRequestBlank: ExtendedCommandRequest = {
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

function extendRequest(request: CommandRequest | ComponentInteraction): ComplexCommandRequest {
	const extension: ExtendedCommandRequest = Object.assign({}, extendedCommandRequestBlank);

	if(Command.requestIsMessage(request)) {
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
		extension.inferAsSlash = () => {
			if(request.isChatInputCommand())
				return request;
			else
				throw 'Invalid inference of a non-Slash Command Interaction into a Slash Command';
			};

		extension.activity = null;
		extension.attachments = new Collection();
		extension.userId = request.user.id;

		extension.delete = async() => undefined;
		extension.wasDeferred = () => request.isCommand() && request.deferred;
		extension.wasReplied = () => request.isCommand() && request.replied;
	}

	for(const [k, v] of Object.entries(extension)) {
		if(v !== undefined)
			request[k] = v;
	}

	return request as ComplexCommandRequest;
}

type ExecutionFunction = (request: ComplexCommandRequest, args: CommandOptionSolver, rawArgs?: string) => Promise<any>;

type InteractionResponseFunction = (interaction: Interaction, ...args: string[]) => Promise<any>;

interface InteractionResponseOptions {
	userFilterIndex?: number;
}

type ButtonResponseFunction = (interaction: ButtonInteraction<'cached'>, ...args: string[]) => Promise<any>;

type SelectMenuResponseFunction = (interaction: SelectMenuInteraction<'cached'>, ...args: string[]) => Promise<any>;

type ModalResponseFunction = (interaction: ModalMessageModalSubmitInteraction<'cached'>, ...args: string[]) => Promise<any>;

export type CommandReplyOptions = (string | MessagePayload | MessageReplyOptions) & InteractionReplyOptions & { fetchReply: boolean; };

export type WikiComponentEvaluator = (request: ComplexCommandRequest | MessageComponentInteraction<'cached'>) => MessageActionRowComponentBuilder;

export type WikiRowDefinition = WikiComponentEvaluator[];

type WikiComponentResolvable = MessageActionRowComponentBuilder | WikiComponentEvaluator;

interface CommandWikiData {
	rows: WikiRowDefinition[];
}

/**@class Representa un comando.*/
export class Command {
	name: string;
	aliases: string[] | null;
	desc: string;
	brief: string | null;
	flags: CommandTags;
	permissions: CommandPermissions;
	options: CommandOptions | null;
	callx: string | null;
	/**@type {Map<string, any>}*/
	memory: Map<string, any>;
	/**@type {CommandWikiData}*/
	wiki: CommandWikiData;
	/**@type {CommandReplyOptions}*/
	reply: CommandReplyOptions;
	execute: ExecutionFunction;

	/**
	 * @description Crea un comando.
	 * @param name El nombre identificador del comando
	 * @param tags Un objeto {@linkcode CommandTags} con las flags del comando
	 */
	constructor(name: string, tags: CommandTags) {
		if(typeof name !== 'string') throw new TypeError('El nombre debe ser un string');
		if(!name.length)             throw new Error('El nombre del comando no puede estar vacío');
		if(!tags)                    throw new TypeError('Debes suministrar CommandTags para el comando');
		if(!tags.bitfield)           throw new TypeError('Las flags deben ser un CommandTags');
		this.name = name;
		this.aliases = [];
		this.flags = tags;
		this.memory = new Map();
		this.wiki = {
			rows: [],
		};
		this.execute = request => request.reply(this.reply);
	};

	/**Alias de `<Command>.flags`.*/
	get tags() {
		return this.flags;
	}

	setAliases(...aliases: string[]) {
		if(!aliases.length) throw new Error('Debes pasar al menos un alias');
		this.aliases = aliases;
		return this;
	};

	setBriefDescription(desc: string) {
		if(typeof desc !== 'string') throw new TypeError('La descripción debe ser un string');
		if(!desc.length)             throw new Error('Debes escribir una descripción válida');
		this.brief = desc;
		return this;
	};

	setLongDescription(...desc: string[]) {
		if(!desc.length) throw new Error('Debes especificar una descripción');
		this.desc = desc.join('\n');
		return this;
	};

	setDescription(...desc: string[]) {
		return this.setLongDescription(...desc);
	};

	addWikiRow(...components: WikiComponentResolvable[]) {
		if(!components.length) throw new Error('Debes pasar al menos un botón');
		if(components.length > 5) throw new Error('No puedes pasar más de 5 botones a la vez');

		const row = components.map(c => typeof c === 'function' ? c : (() => c));
		this.wiki.rows.push(row);

		return this;
	}

	setPermissions(permissions: import('./cmdPerms').CommandPermissions) {
		if(typeof (permissions?.isAllowed) !== 'function')
			throw new TypeError('Las opciones deben ser una instancia de CommandPermissions');

		this.permissions = permissions;
		return this;
	};

	setOptions(options: import('./cmdOpts').CommandOptions) {
		if(!options.options) throw new Error('Las opciones deben ser un CommandOptions');
		this.options = options;
		this.callx = options.callSyntax;
		return this;
	};

	setReply(replyOptions: CommandReplyOptions) {
		this.reply = replyOptions;
		return this;
	}

	/**@description Establece la función de ejecución de este comando.*/
	setExecution(exeFn: ExecutionFunction) {
		this.execute = exeFn;
		return this;
	}

	/**
	 * @param fn Una función NO anónima
	 * @param options Opciones de respuesta de interacción
	 */
	setFunction(fn: Function, options: InteractionResponseOptions = {}) {
		const functionName = fn.name;
		this[functionName] = fn;
		fn['userFilterIndex'] = options.userFilterIndex;
		return this;
	}

	/**
	 * @param responseFn Una función NO anónima a ejecutar al recibir una interacción
	 * @param options Opciones adicionales para controlar las respuestas de interacción
	 */
	setInteractionResponse(responseFn: InteractionResponseFunction, options: InteractionResponseOptions = {}) {
		return this.setFunction(responseFn, options);
	};

	/**
	 * @param responseFn Una función NO anónima a ejecutar al recibir una interacción
	 * @param options Opciones adicionales para controlar las respuestas de interacción
	 */
	setButtonResponse(responseFn: ButtonResponseFunction, options: InteractionResponseOptions = {}) {
		return this.setFunction(responseFn, options);
	};

	/**
	 * @param responseFn Una función NO anónima a ejecutar al recibir una interacción
	 * @param options Opciones adicionales para controlar las respuestas de interacción
	 */
	setSelectMenuResponse(responseFn: SelectMenuResponseFunction, options: InteractionResponseOptions = {}) {
		return this.setFunction(responseFn, options);
	};

	/**
	 * @param responseFn Una función NO anónima a ejecutar al recibir una interacción
	 * @param options Opciones adicionales para controlar las respuestas de interacción
	 */
	setModalResponse(responseFn: ModalResponseFunction, options: InteractionResponseOptions = {}) {
		return this.setFunction(responseFn, options);
	};

	static requestIsMessage(request: CommandRequest | Interaction): request is Message<true> {
		return request instanceof Message;
	}

	static requestIsInteraction(request: CommandRequest | Interaction): request is Interaction {
		if(this.requestIsMessage(request))
			return false;

		const interactionTypes = [
			InteractionType.ApplicationCommand,
			InteractionType.ApplicationCommandAutocomplete,
			InteractionType.MessageComponent,
			InteractionType.ModalSubmit,
			InteractionType.Ping,
		];

		return interactionTypes.some(interactionType => request.type === interactionType);
	}

	static requestize(request: CommandRequest | ComponentInteraction) {
		return extendRequest(request);
	}
};
