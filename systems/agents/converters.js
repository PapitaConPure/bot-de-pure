/**
 * @template {boolean} TContentful
 * @typedef {Object} ConverterBasePayload
 * @property {TContentful} contentful
*/

/**
 * @typedef {ConverterBasePayload<false>} EmptyConverterPayload
*/

/**
 * @typedef {Object} ContentfulConverterPayloadData
 * @property {string} content
 * 
 * @typedef {ConverterBasePayload<true> & ContentfulConverterPayloadData} ContentfulConverterPayload
 */

/**
 * @typedef {EmptyConverterPayload | ContentfulConverterPayload} ConverterPayload
 */


/**@type {ConverterPayload}*/
const ConverterEmptyPayload = {
	contentful: false,
};

module.exports = {
	ConverterEmptyPayload,
};
