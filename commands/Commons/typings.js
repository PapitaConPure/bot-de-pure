const { Message, User, CommandInteraction, CommandInteractionOptionResolver } = require("discord.js");

/**
 * @typedef {Message | CommandInteraction} CommandRequest
 * @typedef {{user: User, userId: String}} ExtendedCommandRequest
 * @typedef {CommandRequest & ExtendedCommandRequest} ComplexCommandRequest
 * @typedef {Array<*> | CommandInteractionOptionResolver} CommandOptions
 */