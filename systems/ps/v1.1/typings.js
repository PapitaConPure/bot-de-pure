/**
 * @template {'url'|'buffer'|'stream'} T
 * @typedef {Object} PSBaseAttachment
 * @property {T} type
 */

/**
 * @typedef {PSBaseAttachment<'url'> & { url: string }} PSURLAttachment
 * @typedef {PSBaseAttachment<'buffer'> & { buffer: Buffer | Uint8Array }} PSBufferAttachment
 */

/**
 * @typedef {PSURLAttachment | PSBufferAttachment} PSAttachment
 */

module.exports = {};
