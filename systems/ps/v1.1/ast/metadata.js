const { Token } = require('../lexer/tokens.js');

/**
 * @typedef {import('./expressions').Expression} Expression
 * @typedef {import('./statements').Statement} Statement
 * @typedef {import('./ast').NodeMetadata} NodeMetadata
 */

/**
 * @param {Token | Statement | Expression} startToken
 * @param {Token | Statement | Expression} [endToken=undefined]
 * @returns {NodeMetadata}
 */
function makeMetadata(startToken, endToken = undefined) {
	const { start, column, line } = startToken;
	const end = (endToken ?? startToken).end;
	return { start, end, column, line };
}

module.exports = {
	makeMetadata,
};
