const { Message, User, CommandInteraction, CommandInteractionOptionResolver } = require("discord.js");

/**
 * @typedef {Message<true> | CommandInteraction<'cached'>} CommandRequest
 * @typedef {import('./cmdBuilder').ExtendedCommandRequestPrototype} ExtendedCommandRequest
 * @typedef {CommandRequest & ExtendedCommandRequest} ComplexCommandRequest
 * @typedef {Array<String> | CommandInteractionOptionResolver} CommandArguments
 */
