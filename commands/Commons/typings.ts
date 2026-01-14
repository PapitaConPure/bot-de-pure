import { AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, CommandInteractionOptionResolver, Message, MessageContextMenuCommandInteraction, StringSelectMenuInteraction } from 'discord.js';
import { ExtendedCommandRequestPrototype } from './cmdBuilder';

/**@description Representa los tipos de petición de comando.*/
export type CommandRequest =
	| Message<true>
	| Omit<ChatInputCommandInteraction<'cached'>, 'deferReply'>;

/**@description Interfaz con extensiones para {@link CommandRequest}.*/
export type ExtendedCommandRequest = ExtendedCommandRequestPrototype;

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
