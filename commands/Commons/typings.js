const { Message, CommandInteractionOptionResolver, ChatInputCommandInteraction } = require("discord.js");

/**
 * @typedef {Message<true> | ChatInputCommandInteraction<'cached'>} CommandRequest
 * @typedef {import('./cmdBuilder').ExtendedCommandRequestPrototype} ExtendedCommandRequest
 * @typedef {CommandRequest & ExtendedCommandRequest} ComplexCommandRequest
 * @typedef {Array<string>} MessageArguments
 * @typedef {CommandInteractionOptionResolver} SlashArguments
 * @typedef {MessageArguments | CommandInteractionOptionResolver} CommandArguments
 */
