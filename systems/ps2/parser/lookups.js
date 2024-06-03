const { TokenKinds } = require('../lexer/tokens');
const { BindingPowers, Associativities } = require('../ast/ast');
const {
    parsePrimaryExpression,
    parseUnaryExpression,
    parseBinaryExpression,
    parseCastExpression,
    parseArrowExpression,
    parseCallExpression,
    parseFunctionExpression,
	parseSequenceExpression,
    parseLambdaExpression,
    parseGroupExpression,
} = require('./syntax/expressionParsing.js');
const {
    parseBlockStatement,
    parseConditionalStatement,
    parseWhileLoopStatement,
    parseDoWhileLoopStatement,
    parseRepeatLoopStatement,
    parseForEachLoopStatement,
    parseForLoopStatement,
    
    parseExpressionStatement,

    parseReadStatement,
    parseDeclarationStatement,
    parseSaveStatement,
    parseAssignmentStatement,
    parseReturnStatement,
    parseEndStatement,
    parseStopStatement,
    parseSendStatement,
} = require('./syntax/statementParsing.js');

/**
 * @typedef {(parser: import('./parser.js').Parser) => import('../ast/statements').Statement} StatementHandler
 * @typedef {(parser: import('./parser.js').Parser) => import('../ast/expressions').Expression} NuDHandler
 * @typedef {(parser: import('./parser.js').Parser, left: import('../ast/expressions').Expression, bp: import('../ast/ast').BindingPower, ass: import('../ast/ast').Associativity) => import('../ast/expressions').Expression} LeDHandler
 */

/**@type {Map<import('../lexer/tokens').TokenKind, StatementHandler>}*/
const stmtLookup = new Map();
/**@type {Map<import('../lexer/tokens').TokenKind, NuDHandler>}*/
const nudLookup = new Map();
/**@type {Map<import('../lexer/tokens').TokenKind, LeDHandler>}*/
const ledLookup = new Map();
/**@type {Map<import('../lexer/tokens').TokenKind, import('../ast/ast').BindingPower>}*/
const bpLookup = new Map();
/**@type {Map<import('../lexer/tokens').TokenKind, import('../ast/ast').Associativity>}*/
const assLookup = new Map();

/**
 * 
 * @param {import('../lexer/tokens').TokenKind} kind 
 * @param {StatementHandler} handler 
 */
function stmt(kind, handler) {
    stmtLookup.set(kind, handler);
}

/**
 * 
 * @param {import('../lexer/tokens').TokenKind} kind 
 * @param {NuDHandler} handler 
 */
function nud(kind, handler) {
    nudLookup.set(kind, handler);
}

/**
 * 
 * @param {import('../lexer/tokens').TokenKind} kind 
 * @param {import('../ast/ast').BindingPower} bp 
 * @param {import('../ast/ast').Associativity} ass 
 * @param {LeDHandler} handler 
 */
function led(kind, bp, ass, handler) {
    bpLookup.set(kind, bp);
    assLookup.set(kind, ass);
    ledLookup.set(kind, handler);
}

function createLookups() {
    //Sentencias de Control
    stmt(TokenKinds.BLOCK_OPEN, parseBlockStatement);
    stmt(TokenKinds.IF, parseConditionalStatement);
    stmt(TokenKinds.WHILE, parseWhileLoopStatement);
    stmt(TokenKinds.DO, parseDoWhileLoopStatement);
    stmt(TokenKinds.REPEAT, parseRepeatLoopStatement);
    stmt(TokenKinds.FOR_EACH, parseForEachLoopStatement);
    stmt(TokenKinds.FOR, parseForLoopStatement);

    //Sentencias Comunes
    stmt(TokenKinds.EXECUTE, parseExpressionStatement);
    stmt(TokenKinds.READ, parseReadStatement);
    stmt(TokenKinds.CREATE, parseDeclarationStatement);
    stmt(TokenKinds.SAVE, parseSaveStatement);
    stmt(TokenKinds.LOAD, parseAssignmentStatement);
    stmt(TokenKinds.ADD, parseAssignmentStatement);
    stmt(TokenKinds.SUBTRACT, parseAssignmentStatement);
    stmt(TokenKinds.MULTIPLY, parseAssignmentStatement);
    stmt(TokenKinds.DIVIDE, parseAssignmentStatement);
    stmt(TokenKinds.EXTEND, parseAssignmentStatement);
    stmt(TokenKinds.RETURN, parseReturnStatement);
    stmt(TokenKinds.END, parseEndStatement);
    stmt(TokenKinds.STOP, parseStopStatement);
    stmt(TokenKinds.SEND, parseSendStatement);

    //Coma
    led(TokenKinds.COMMA, BindingPowers.COMMA, Associativities.LEFT, parseSequenceExpression);

    //Asignación y Misceláneo
    led(TokenKinds.LAMBDA, BindingPowers.ASSIGNMENT, Associativities.RIGHT, parseLambdaExpression);

    //Lógico
    led(TokenKinds.OR, BindingPowers.LOGICAL_DISJUNCTION, Associativities.LEFT, parseBinaryExpression);
    led(TokenKinds.AND, BindingPowers.LOGICAL_CONJUNCTION, Associativities.LEFT, parseBinaryExpression);
    
    //Equitativo
    led(TokenKinds.EQUALS, BindingPowers.EQUALITY, Associativities.LEFT, parseBinaryExpression);
    led(TokenKinds.NOT_EQUALS, BindingPowers.EQUALITY, Associativities.LEFT, parseBinaryExpression);

    //Relacional
    led(TokenKinds.LESS, BindingPowers.RELATIONAL, Associativities.LEFT, parseBinaryExpression);
    led(TokenKinds.LESS_EQUALS, BindingPowers.RELATIONAL, Associativities.LEFT, parseBinaryExpression);
    led(TokenKinds.GREATER, BindingPowers.RELATIONAL, Associativities.LEFT, parseBinaryExpression);
    led(TokenKinds.GREATER_EQUALS, BindingPowers.RELATIONAL, Associativities.LEFT, parseBinaryExpression);
    
    //Aditivo
    led(TokenKinds.PLUS, BindingPowers.ADDITIVE, Associativities.LEFT, parseBinaryExpression);
    led(TokenKinds.DASH, BindingPowers.ADDITIVE, Associativities.LEFT, parseBinaryExpression);
    
    //Multiplicativo
    led(TokenKinds.STAR, BindingPowers.MULTIPLICATIVE, Associativities.LEFT, parseBinaryExpression);
    led(TokenKinds.SLASH, BindingPowers.MULTIPLICATIVE, Associativities.LEFT, parseBinaryExpression);
    led(TokenKinds.PERCENT, BindingPowers.MULTIPLICATIVE, Associativities.LEFT, parseBinaryExpression);

    //Exponencial
    led(TokenKinds.CARET, BindingPowers.EXPONENTIAL, Associativities.RIGHT, parseBinaryExpression);

    //Unarios
    nud(TokenKinds.NOT, parseUnaryExpression);
    nud(TokenKinds.PLUS, parseUnaryExpression);
    nud(TokenKinds.DASH, parseUnaryExpression);
    nud(TokenKinds.NUMBER, parseCastExpression);
    nud(TokenKinds.TEXT, parseCastExpression);
    nud(TokenKinds.BOOLEAN, parseCastExpression);
    
    //Llamadas
    led(TokenKinds.PAREN_OPEN, BindingPowers.CALL, Associativities.LEFT, parseCallExpression);

    //Miembros
    led(TokenKinds.ARROW, BindingPowers.MEMBER, Associativities.LEFT, parseArrowExpression);
    
    //Primarios
    nud(TokenKinds.LIT_NUMBER, parsePrimaryExpression);
    nud(TokenKinds.LIT_TEXT, parsePrimaryExpression);
    nud(TokenKinds.LIT_BOOLEAN, parsePrimaryExpression);
    nud(TokenKinds.LIST, parsePrimaryExpression);
    nud(TokenKinds.REGISTRY, parsePrimaryExpression);
    nud(TokenKinds.IDENTIFIER, parsePrimaryExpression);
    nud(TokenKinds.NADA, parsePrimaryExpression);

    nud(TokenKinds.FUNCTION, parseFunctionExpression)

    //Agrupamiento
    nud(TokenKinds.PAREN_OPEN, parseGroupExpression);
}

module.exports = {
    stmtLookup,
    nudLookup,
    ledLookup,
    bpLookup,
    assLookup,
    createLookups,
};
