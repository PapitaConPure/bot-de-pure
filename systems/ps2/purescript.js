const { stringifyPSAST, logPSAST } = require('./debug');
const { Token } = require('./lexer/tokens');
const { Lexer } = require('./lexer/lexer');
const { Parser } = require('./parser/parser');
const { Interpreter } = require('./interpreter/interpreter');
const { Scope } = require('./interpreter/scope');
const { declareNatives, declareContext } = require('./interpreter/environment/environment');

/**
 * @typedef {Object} TuberInput
 * @property {String} name
 * @property {import('./interpreter/values').ValueKind} kind
 * @property {Boolean} optional
 * @property {Boolean} spread
 * @property {String} [desc]
 */

/**
 * @typedef {Object} BaseTubercle
 * @property {String} id
 * @property {String} author
 * @property {Array<TuberInput>} [inputs]
 */

/**
 * @typedef {Object} PartialBasicTubercleData
 * @property {false} advanced
 * @property {String?} [content]
 * @property {Array<String>} [files]
 * @typedef {import('types').RequireAtLeastOne<PartialBasicTubercleData>} BasicTubercleData
 */

/**
 * @typedef {Object} AdvancedTubercleData
 * @property {true} advanced
 * @property {undefined} [content]
 * @property {undefined} [files]
 * @property {String} script
 */

/**
 * @typedef {BaseTubercle & BasicTubercleData} BasicTubercle
 * @typedef {BaseTubercle & AdvancedTubercleData} AdvancedTubercle
 */

/**@typedef {BasicTubercle | AdvancedTubercle} Tubercle*/

module.exports = {
    Token,
    Lexer,
    Parser,
    Interpreter,
    Scope,
    declareNatives,
    declareContext,
    stringifyPSAST,
    logPSAST,
};
