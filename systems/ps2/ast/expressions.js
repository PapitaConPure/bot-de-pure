const { Token } = require('../lexer/tokens.js');

const ExpressionKinds = /**@type {const}*/({
    NUMBER_LITERAL: 'NumberLiteralExpression',
    TEXT_LITERAL: 'TextLiteralExpression',
    BOOLEAN_LITERAL: 'BooleanLiteralExpression',
    LIST_LITERAL: 'ListLiteralExpression',
    REGISTRY_LITERAL: 'RegistryLiteralExpression',
    NADA_LITERAL: 'NadaLiteralExpression',
    IDENTIFIER: 'Identifier',

    UNARY: 'UnaryExpression',
    BINARY: 'BinaryExpression',
    ARROW: 'ArrowExpression',
    CALL: 'CallExpression',
});
/**@typedef {import('types').ValuesOf<typeof ExpressionKinds>} ExpressionKind*/

/**
 * @template {ExpressionKind} [T=ExpressionKind]
 * @typedef {Object} Expression
 * @property {Readonly<NonNullable<T>>} kind
 */

//#region Literales
/**
 * @typedef {Object} NumberLiteralExpressionData
 * @property {Number} value
 * @typedef {Expression<'NumberLiteralExpression'> & NumberLiteralExpressionData} NumberLiteralExpression
 */

/**
 * @typedef {Object} TextLiteralExpressionData
 * @property {String} value
 * @typedef {Expression<'TextLiteralExpression'> & TextLiteralExpressionData} TextLiteralExpression
 */

/**
 * @typedef {Object} BooleanLiteralExpressionData
 * @property {Boolean} value
 * @typedef {Expression<'BooleanLiteralExpression'> & BooleanLiteralExpressionData} BooleanLiteralExpression
 */

/**
 * @typedef {Object} ListLiteralExpressionData
 * @property {Array<Expression>} elements
 * @typedef {Expression<'ListLiteralExpression'> & ListLiteralExpressionData} ListLiteralExpression
 */

/**
 * @typedef {Object} RegistryLiteralExpressionData
 * @property {Map<String, Expression>} entries
 * @typedef {Expression<'RegistryLiteralExpression'> & RegistryLiteralExpressionData} RegistryLiteralExpression
 */

/**
 * @typedef {Object} NadaLiteralExpressionData
 * @property {null} value
 * @typedef {Expression<'NadaLiteralExpression'> & NadaLiteralExpressionData} NadaLiteralExpression
 */

/**
 * @typedef {Object} IdentifierData
 * @property {String} name
 * @typedef {Expression<'Identifier'> & IdentifierData} Identifier
 */
//#endregion

//#region Expresiones complejas
/**
 * @typedef {Object} UnaryExpressionData
 * @property {Token} operator
 * @property {Expression} argument
 * @typedef {Expression<'UnaryExpression'> & UnaryExpressionData} UnaryExpression
 */

/**
 * @typedef {Object} BinaryExpressionData
 * @property {Token} operator
 * @property {Expression} left
 * @property {Expression} right
 * @typedef {Expression<'BinaryExpression'> & BinaryExpressionData} BinaryExpression
 */

/**
 * @typedef {Object} ArrowExpressionData
 * @property {Expression} holder
 * @property {Expression} key
 * @property {Boolean} computed
 * @typedef {Expression<'ArrowExpression'> & ArrowExpressionData} ArrowExpression
 */

/**
 * @typedef {Object} CallExpressionData
 * @property {Expression} fn
 * @property {Array<Expression>} args
 * @typedef {Expression<'CallExpression'> & CallExpressionData} CallExpression
 */

//#endregion

module.exports = {
    ExpressionKinds,
};
