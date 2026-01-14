import { Attachment, AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, Collection, CommandInteractionOptionResolver, InteractionDeferReplyOptions, InteractionEditReplyOptions, InteractionReplyOptions, Message, MessageContextMenuCommandInteraction, MessageEditOptions, MessagePayload, PermissionsBitField, Snowflake, StringSelectMenuInteraction, User } from 'discord.js';

/**@description Representa los tipos de petición de comando.*/
export type CommandRequest =
	| Message<true>
	| Omit<ChatInputCommandInteraction<'cached'>, 'reply' | 'deferReply'>;

/**@description Extensiones para {@link CommandRequest}.*/

export interface ExtendedCommandRequest {
	/**The command's initial reply.*/
	initialReply: Message<boolean>;
	/**Whether the command is a message command (true) or not (false).*/
	isMessage: boolean;
	/**Whether the command is an interaction or Slash command (true) or not (false).*/
	isInteraction: boolean;
	/**Infers the command as a guild Message Command. Throws an error if the command isn't really a Message Command.*/
	inferAsMessage: () => Message<true>;
	/**Infers the command as a cached Slash Command Interaction. Throws an error if the command isn't really a Slash Command.*/
	inferAsSlash: () => ChatInputCommandInteraction<'cached'>;
	/**If the command is a message command, returns the message's activity (if any).*/
	activity?: import ('discord.js').MessageActivity;
	/**A collection of the command's attachments, if it's a message command and it has attachments.*/
	attachments: Collection<Snowflake, Attachment>;
	/**The permissions of the application or bot in the current channel.*/
	appPermisions: Readonly<PermissionsBitField>;
	deferred: boolean;
	replied: boolean;
	/**The permissions within the current channel of the member who started the command.*/
	memberPermissions: Readonly<PermissionsBitField>;
	/**The user who started the command.*/
	user: User;
	/**The id of the user who started the command.*/
	userId: string;
	/**If a Slash command, defers the initial reply. Otherwise, sends a message and remembers it as the initial reply.*/
	reply: (options?: (string|MessagePayload)&(MessageEditOptions|InteractionReplyOptions)|{}|undefined) => Promise<Message<boolean>>;
	/**If a Slash command, defers the initial reply. Otherwise, sends a message and remembers it as the initial reply*/
	replyFirst: (options?: (string|MessagePayload)&(MessageEditOptions|InteractionReplyOptions)|{}|undefined) => Promise<Message<boolean>>;
	/**If a Slash command, defers the initial reply. Otherwise, sends a message and remembers it as the initial reply.*/
	deferReply(options?: InteractionDeferReplyOptions & { fetchReply: true }): Promise<Message<boolean>>;
	/**Deletes the original message if the command is a message command.*/
	delete: () => Promise<Message<boolean>>;
	/**Deletes the initial reply.*/
	deleteReply: () => Promise<Message<boolean>>;
	/**Edits the initial reply.*/
	editReply: (options: (string|MessagePayload)&(MessageEditOptions|InteractionEditReplyOptions)|{}|undefined) => Promise<Message<boolean>>;
	/**Determines whether the initial reply was deferred (true) or not (false).*/
	wasDeferred: () => boolean;
	/**Determines whether the initial reply was sent (true) or not (false).*/
	wasReplied: () => boolean;
}

/**@description Interfaz con extensiones para {@link CommandRequest}.*/
export type ComplexCommandRequest = CommandRequest & ExtendedCommandRequest;

/**@description Argumentos de comando de mensaje.*/
export type MessageArguments = string[];

/**@description Argumentos de comando de barra.*/
export type SlashArguments =
	| CommandInteractionOptionResolver
	| Omit<CommandInteractionOptionResolver<'cached'>, 'getMessage' | 'getFocused'>;

/**@description Argumentos de comando de mensaje o barra.*/
export type CommandArguments =
	| MessageArguments
	| SlashArguments;

/**@description .*/
export type ComponentInteraction =
	| ButtonInteraction<'cached'>
	| StringSelectMenuInteraction<'cached'>
	| AutocompleteInteraction<'cached'>
	| MessageContextMenuCommandInteraction<'cached'>;

/**@description Representa los tipos de petición de comando o manejos de interacciones de componentes.*/
export type AnyRequest =
	| ComplexCommandRequest
	| ComponentInteraction;
