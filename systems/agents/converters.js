/**
 * @typedef {Object} ConverterPayload
 * @property {boolean} shouldReplace
 * @property {boolean} shouldReply
 * @property {string?} [content]
 * @property {Array<import('discord.js').EmbedBuilder>?} [embeds]
 * @property {Array<import('discord.js').Attachment>?} [files]
 */

/**@type {ConverterPayload}*/
const ConverterEmptyPayload = {
	shouldReplace: false,
	shouldReply: false,
};

module.exports = {
	ConverterEmptyPayload,
};
