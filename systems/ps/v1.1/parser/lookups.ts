import { parsePrimaryExpression, parseUnaryExpression, parseBinaryExpression, parseCastExpression, parseArrowExpression, parseCallExpression, parseFunctionExpression, parseSequenceExpression, parseConditionalExpression, parseLambdaExpression, parseGroupExpression } from './syntax/expressionParsing';
import { parseBlockStatement, parseConditionalStatement, parseWhileLoopStatement, parseDoWhileLoopStatement, parseRepeatLoopStatement, parseForEachLoopStatement, parseForLoopStatement, parseExpressionStatement, parseReadStatement, parseDeclarationStatement, parseSaveStatement, parseAssignmentStatement, parseExtendStatement, parseDeleteStatement, parseReturnStatement, parseEndStatement, parseStopStatement, parseSendStatement } from './syntax/statementParsing';
import { BindingPowers, Associativities, BindingPower, Associativity } from '../ast';
import { TokenKind, TokenKinds } from '../lexer/tokens';
import { Expression } from '../ast/expressions';
import { Statement } from '../ast/statements';
import { Parser } from '.';

export type StatementHandler = (parser: Parser) => Statement;

export type NuDHandler = (parser: Parser) => Expression;

export type LeDHandler = (parser: Parser, left: Expression, bp: BindingPower, ass: Associativity) => Expression;

export const stmtLookup = new Map<TokenKind, StatementHandler>();
export const nudLookup = new Map<TokenKind, NuDHandler>();
export const ledLookup = new Map<TokenKind, LeDHandler>();
export const bpLookup = new Map<TokenKind, BindingPower>();
export const assLookup = new Map<TokenKind, Associativity>();

function stmt(kind: TokenKind, handler: StatementHandler) {
	stmtLookup.set(kind, handler);
}

function nud(kind: TokenKind, handler: NuDHandler) {
	nudLookup.set(kind, handler);
}

function led(kind: TokenKind, bp: BindingPower, ass: Associativity, handler: LeDHandler) {
	bpLookup.set(kind, bp);
	assLookup.set(kind, ass);
	ledLookup.set(kind, handler);
}

export function createLookups() {
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
	stmt(TokenKinds.DELETE, parseDeleteStatement);
	stmt(TokenKinds.EXTEND, parseExtendStatement);
	stmt(TokenKinds.RETURN, parseReturnStatement);
	stmt(TokenKinds.END, parseEndStatement);
	stmt(TokenKinds.STOP, parseStopStatement);
	stmt(TokenKinds.SEND, parseSendStatement);

	//Coma
	led(TokenKinds.COMMA, BindingPowers.COMMA, Associativities.LEFT, parseSequenceExpression);

	//Asignación y Misceláneo
	led(TokenKinds.LAMBDA, BindingPowers.ASSIGNMENT, Associativities.RIGHT, parseLambdaExpression);
	led(TokenKinds.QUESTION, BindingPowers.ASSIGNMENT, Associativities.RIGHT, parseConditionalExpression);
	led(TokenKinds.AFTER, BindingPowers.ASSIGNMENT, Associativities.LEFT, parseBinaryExpression);

	//Lógico
	led(TokenKinds.OR, BindingPowers.LOGICAL_DISJUNCTION, Associativities.LEFT, parseBinaryExpression);
	led(TokenKinds.AND, BindingPowers.LOGICAL_CONJUNCTION, Associativities.LEFT, parseBinaryExpression);

	//Equitativo
	led(TokenKinds.EQUALS, BindingPowers.EQUALITY, Associativities.LEFT, parseBinaryExpression);
	led(TokenKinds.NOT_EQUALS, BindingPowers.EQUALITY, Associativities.LEFT, parseBinaryExpression);
	led(TokenKinds.SEEMS, BindingPowers.EQUALITY, Associativities.LEFT, parseBinaryExpression);
	led(TokenKinds.NOT_SEEMS, BindingPowers.EQUALITY, Associativities.LEFT, parseBinaryExpression);

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
	led(TokenKinds.DOUBLE_STAR, BindingPowers.EXPONENTIAL, Associativities.RIGHT, parseBinaryExpression);

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
	led(TokenKinds.DOT,   BindingPowers.MEMBER, Associativities.LEFT, parseArrowExpression);

	//Primarios
	nud(TokenKinds.LIT_NUMBER, parsePrimaryExpression);
	nud(TokenKinds.LIT_TEXT, parsePrimaryExpression);
	nud(TokenKinds.LIT_BOOLEAN, parsePrimaryExpression);
	nud(TokenKinds.LIST, parsePrimaryExpression);
	nud(TokenKinds.REGISTRY, parsePrimaryExpression);
	nud(TokenKinds.EMBED, parsePrimaryExpression);
	nud(TokenKinds.IDENTIFIER, parsePrimaryExpression);
	nud(TokenKinds.NADA, parsePrimaryExpression);

	nud(TokenKinds.FUNCTION, parseFunctionExpression);

	//Agrupamiento
	nud(TokenKinds.PAREN_OPEN, parseGroupExpression);
}
