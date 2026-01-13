export type CommandRequest = import('discord.js').Message<true> | import('discord.js').ChatInputCommandInteraction<'cached'>;

export type ExtendedCommandRequest = import('./cmdBuilder').ExtendedCommandRequestPrototype;

export type ComplexCommandRequest = CommandRequest & ExtendedCommandRequest;

export type MessageArguments = Array<string>;

export type SlashArguments = import('discord.js').CommandInteractionOptionResolver;

export type CommandArguments = MessageArguments | import('discord.js').CommandInteractionOptionResolver;

export type ComponentInteraction = import('discord.js').ButtonInteraction<'cached'> |
	import('discord.js').StringSelectMenuInteraction<'cached'> |
	import('discord.js').AutocompleteInteraction<'cached'> |
	import('discord.js').MessageContextMenuCommandInteraction<'cached'>;

export type AnyRequest = ComplexCommandRequest | ComponentInteraction;
