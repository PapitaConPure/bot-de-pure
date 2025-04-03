/**
 * @typedef {import('discord.js').Message<true> | import('discord.js').ChatInputCommandInteraction<'cached'>} CommandRequest
 * @typedef {import('./cmdBuilder').ExtendedCommandRequestPrototype} ExtendedCommandRequest
 * @typedef {CommandRequest & ExtendedCommandRequest} ComplexCommandRequest
 * @typedef {Array<string>} MessageArguments
 * @typedef {import('discord.js').CommandInteractionOptionResolver} SlashArguments
 * @typedef {MessageArguments | import('discord.js').CommandInteractionOptionResolver} CommandArguments
 * @typedef {import('discord.js').ButtonInteraction<'cached'>
 *         | import('discord.js').StringSelectMenuInteraction<'cached'>
 *         | import('discord.js').AutocompleteInteraction<'cached'>
 *         | import('discord.js').MessageContextMenuCommandInteraction<'cached'>
 * } ComponentInteraction
 * @typedef {ComplexCommandRequest | ComponentInteraction} AnyRequest
 */

module.exports = {};
