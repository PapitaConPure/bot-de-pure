const ExpressionKinds = /**@type {const}*/({
    NUMBER_LITERAL: 'NumberLiteralExpression',
    TEXT_LITERAL: 'TextLiteralExpression',
    BOOLEAN_LITERAL: 'BooleanLiteralExpression',
    LIST_LITERAL: 'ListLiteralExpression',
    REGISTRY_LITERAL: 'RegistryLiteralExpression',
    NADA_LITERAL: 'NadaLiteralExpression',
    IDENTIFIER: 'Identifier',

    ARGUMENT: 'Argument',
    UNARY: 'UnaryExpression',
    CAST: 'CastExpression',
    BINARY: 'BinaryExpression',
    ARROW: 'ArrowExpression',
    CALL: 'CallExpression',
    FUNCTION: 'FunctionExpression',
    SEQUENCE: 'SequenceExpression',
});
/**@typedef {import('../util/types.js').ValuesOf<typeof ExpressionKinds>} ExpressionKind*/

/**
 * @template {ExpressionKind} T
 * @typedef {Object} EmptyExpression
 * @property {Readonly<NonNullable<T>>} kind
 */

/**
 * @template {ExpressionKind} [T=ExpressionKind]
 * @typedef {EmptyExpression<T> & import('./ast').NodeMetadata} BaseExpressionData
 */

//#region Literales
/**
 * @typedef {Object} NumberLiteralExpressionData
 * @property {Number} value
 * @typedef {BaseExpressionData<'NumberLiteralExpression'> & NumberLiteralExpressionData} NumberLiteralExpression
 */

/**
 * @typedef {Object} TextLiteralExpressionData
 * @property {String} value
 * @typedef {BaseExpressionData<'TextLiteralExpression'> & TextLiteralExpressionData} TextLiteralExpression
 */

/**
 * @typedef {Object} BooleanLiteralExpressionData
 * @property {Boolean} value
 * @typedef {BaseExpressionData<'BooleanLiteralExpression'> & BooleanLiteralExpressionData} BooleanLiteralExpression
 */

/**
 * @typedef {Object} ListLiteralExpressionData
 * @property {Array<Expression>} elements
 * @typedef {BaseExpressionData<'ListLiteralExpression'> & ListLiteralExpressionData} ListLiteralExpression
 */

/**
 * @typedef {Object} RegistryLiteralExpressionData
 * @property {Map<String, Expression>} entries
 * @typedef {BaseExpressionData<'RegistryLiteralExpression'> & RegistryLiteralExpressionData} RegistryLiteralExpression
 */

/**
 * @typedef {Object} NadaLiteralExpressionData
 * @property {null} value
 * @typedef {BaseExpressionData<'NadaLiteralExpression'> & NadaLiteralExpressionData} NadaLiteralExpression
 */

/**
 * @typedef {Object} IdentifierData
 * @property {String} name
 * @typedef {BaseExpressionData<'Identifier'> & IdentifierData} Identifier
 */
//#endregion

//#region Expresiones complejas
/**
 * @typedef {Object} UnaryExpressionData
 * @property {import('../lexer/tokens.js').Token} operator
 * @property {Expression} argument
 * @typedef {BaseExpressionData<'UnaryExpression'> & UnaryExpressionData} UnaryExpression
 */

/**
 * @typedef {Object} CastExpressionData
 * @property {Expression} argument
 * @property {import('../lexer/tokens.js').Token} as
 * @typedef {BaseExpressionData<'CastExpression'> & CastExpressionData} CastExpression
 */

/**
 * @typedef {Object} BinaryExpressionData
 * @property {import('../lexer/tokens.js').Token} operator
 * @property {Expression} left
 * @property {Expression} right
 * @typedef {BaseExpressionData<'BinaryExpression'> & BinaryExpressionData} BinaryExpression
 */

/**
 * @typedef {Object} BaseArrowExpressionData
 * @property {Expression} holder
 * @property {Boolean} computed
 * @typedef {BaseExpressionData<'ArrowExpression'> & BaseArrowExpressionData} BaseArrowExpression
 * 
 * @typedef {Object} StoredArrowExpressionData
 * @property {false} computed
 * @property {String} key
 * @typedef {BaseArrowExpression & StoredArrowExpressionData} StoredArrowExpression
 * 
 * @typedef {Object} ComputedArrowExpressionData
 * @property {true} computed
 * @property {Expression} key
 * @typedef {BaseArrowExpression & ComputedArrowExpressionData} ComputedArrowExpression
 * 
 * @typedef {StoredArrowExpression | ComputedArrowExpression} ArrowExpressionData
 * 
 * @typedef {BaseExpressionData<'ArrowExpression'> & ArrowExpressionData} ArrowExpression
 */

/**
 * @typedef {Object} CallExpressionData
 * @property {Expression} fn
 * @property {Array<Expression>} args
 * @typedef {BaseExpressionData<'CallExpression'> & CallExpressionData} CallExpression
 */

/**
 * @typedef {Object} BaseArgumentExpressionData
 * @property {String} identifier
 * 
 * @typedef {Object} RequiredArgumentData
 * @property {false} optional
 * 
 * @typedef {Object} OptionalArgumentData
 * @property {true} optional
 * @property {Expression} fallback
 * 
 * @typedef {BaseArgumentExpressionData & (RequiredArgumentData | OptionalArgumentData)} ArgumentExpressionData
 * @typedef {BaseExpressionData<'Argument'> & ArgumentExpressionData} ArgumentExpression
 */

/**
 * @typedef {Object} BaseFunctionExpressionData
 * @property {Array<ArgumentExpression>} args
 * @typedef {BaseExpressionData<'FunctionExpression'> & BaseFunctionExpressionData} BaseFunctionExpression
 * 
 * @typedef {Object} StandardFunctionExpressionData
 * @property {false} expression
 * @property {import('./statements').BlockStatement} body
 * @typedef {BaseFunctionExpression & StandardFunctionExpressionData} StandardFunctionExpression
 * 
 * @typedef {Object} LambdaExpressionData
 * @property {true} expression
 * @property {import('./expressions').Expression} body
 * @typedef {BaseFunctionExpression & LambdaExpressionData} LambdaExpression
 * 
 * @typedef {StandardFunctionExpression | LambdaExpression} FunctionExpression
 */

/**
 * @typedef {Object} SequenceExpressionData
 * @property {Array<Expression>} expressions
 * @typedef {BaseExpressionData<'SequenceExpression'> & SequenceExpressionData} SequenceExpression
 */

/**
 * @typedef {NumberLiteralExpression
 *          |TextLiteralExpression
 *          |BooleanLiteralExpression
 *          |ListLiteralExpression
 *          |RegistryLiteralExpression
 *          |NadaLiteralExpression
 *          |Identifier
 * } PrimaryExpression
 */

/**
 * @typedef {UnaryExpression
 *          |BinaryExpression
 *          |CastExpression
 *          |ArrowExpression
 *          |CallExpression
 *          |SequenceExpression
 *          |ArgumentExpression
 *          |FunctionExpression
 * } ComplexExpression
 */

/**
 * @typedef {PrimaryExpression|ComplexExpression} Expression
 */
//#endregion

module.exports = {
    ExpressionKinds,
};
