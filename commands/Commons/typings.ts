import { AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, CommandInteractionOptionResolver, Message, MessageContextMenuCommandInteraction, StringSelectMenuInteraction } from 'discord.js';
import { ExtendedCommandRequestPrototype } from './cmdBuilder';

export type CommandRequest = Message<true> | ChatInputCommandInteraction<'cached'>;

export type ExtendedCommandRequest = ExtendedCommandRequestPrototype;

export type ComplexCommandRequest = CommandRequest & ExtendedCommandRequest;

export type MessageArguments = Array<string>;

export type SlashArguments = CommandInteractionOptionResolver;

export type CommandArguments = MessageArguments | CommandInteractionOptionResolver | Omit<CommandInteractionOptionResolver<'cached'>, 'getMessage' | 'getFocused'>;

export type ComponentInteraction = ButtonInteraction<'cached'> |
	StringSelectMenuInteraction<'cached'> |
	AutocompleteInteraction<'cached'> |
	MessageContextMenuCommandInteraction<'cached'>;

export type AnyRequest = ComplexCommandRequest | ComponentInteraction;
