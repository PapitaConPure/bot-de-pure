const { TokenKinds } = require('../lexer/tokens');
const { ValueKinds, makeValue, makeNumber, makeText, makeBoolean, toggleBoolean } = require('./values');

/**
 * @param {import('../lexer/tokens').TokenKind} op
 * @returns {UnaryExpressionFunction}
 */
function makeUnaryOperation(op) {
	/**@type {UnaryExpressionFunction}*/
	let operation;

	switch(op) {
	case TokenKinds.PLUS:
		operation = (it, arg) => makeValue(it, arg, ValueKinds.NUMBER);
		break;

	case TokenKinds.DASH:
		operation = (it, arg) => {
			const val = makeValue(it, arg, ValueKinds.NUMBER);
			val.value *= -1;
			return val;
		};
		break;

	case TokenKinds.NOT:
		operation = (it, arg) => toggleBoolean(makeValue(it, arg, ValueKinds.BOOLEAN));
		break;

	default:
		throw `Operación inválida: ${op}`;
	}

	return operation;
}

/**
 * @typedef {(it: import('./interpreter').Interpreter, arg: import('./values').RuntimeValue) => import('./values').RuntimeValue} UnaryExpressionFunction
 * @type {Map<import('../lexer/tokens').TokenKind, UnaryExpressionFunction>}
 */
const UnaryExpressionLookups = new Map();
UnaryExpressionLookups
	.set(TokenKinds.PLUS, makeUnaryOperation(TokenKinds.PLUS))
	.set(TokenKinds.DASH, makeUnaryOperation(TokenKinds.DASH))
	.set(TokenKinds.NOT, makeUnaryOperation(TokenKinds.NOT));

/**
 * @param {import("./interpreter").Interpreter} it
 * @param {import("./values").RuntimeValue} l
 * @param {import("./values").RuntimeValue} r
 */
function plusBinaryOperation(it, l, r) {
	if(l.kind === ValueKinds.TEXT || r.kind === ValueKinds.TEXT) {
		const leftVal = makeValue(it, l, ValueKinds.TEXT).value;
		const rightVal = makeValue(it, r, ValueKinds.TEXT).value;
		return makeText(leftVal + rightVal);
	}

	const leftVal = makeValue(it, l, ValueKinds.NUMBER).value;
	const rightVal = makeValue(it, r, ValueKinds.NUMBER).value;
	return makeNumber(leftVal + rightVal);
}

/**
 * @param {import('../lexer/tokens').TokenKind} op
 * @returns {BinaryExpressionFunction}
 */
function makeArithmeticBinaryOperation(op) {
	let operation;

	switch(op) {
	case TokenKinds.PLUS:    operation = (/**@type {Number}*/ l, /**@type {Number}*/ r) => makeNumber(l + r); break;
	case TokenKinds.DASH:    operation = (/**@type {Number}*/ l, /**@type {Number}*/ r) => makeNumber(l - r); break;
	case TokenKinds.STAR:    operation = (/**@type {Number}*/ l, /**@type {Number}*/ r) => makeNumber(l * r); break;
	case TokenKinds.SLASH:   operation = (/**@type {Number}*/ l, /**@type {Number}*/ r) => makeNumber(l / r); break;
	case TokenKinds.PERCENT: operation = (/**@type {Number}*/ l, /**@type {Number}*/ r) => makeNumber(l % r); break;
	case TokenKinds.CARET:   operation = (/**@type {Number}*/ l, /**@type {Number}*/ r) => makeNumber(l ** r); break;
	default: throw `Operación inválida: ${op}`;
	}

	return function(it, l, r) {
		const leftVal = makeValue(it, l, ValueKinds.NUMBER).value;
		const rightVal = makeValue(it, r, ValueKinds.NUMBER).value;
		return operation(leftVal, rightVal);
	};
}

/**
 * @param {import('../lexer/tokens').TokenKind} op
 * @returns {BinaryExpressionFunction}
 */
function makeRelationalBinaryOperation(op) {
	/**@type {BinaryExpressionFunction}*/
	let operation;

	switch(op) {
	case TokenKinds.OR:
		operation = (it, l, r) => makeValue(it, l, ValueKinds.BOOLEAN).value ? l : r;
		break;
	case TokenKinds.AND:
		operation = (it, l, r) => makeValue(it, l, ValueKinds.BOOLEAN).value ? r : l;
		break;
	case TokenKinds.EQUALS:
		operation = (it, l, r) => l.equals(r);
		break;
	case TokenKinds.NOT_EQUALS:
		operation = (it, l, r) => toggleBoolean(l.equals(r));
		break;
	case TokenKinds.LESS:
		operation = (it, l, r) => makeBoolean(l.compareTo(r).value < 0);
		break;
	case TokenKinds.LESS_EQUALS:
		operation = (it, l, r) => makeBoolean(l.compareTo(r).value <= 0);
		break;
	case TokenKinds.GREATER:
		operation = (it, l, r) => makeBoolean(l.compareTo(r).value > 0);
		break;
	case TokenKinds.GREATER_EQUALS:
		operation = (it, l, r) => makeBoolean(l.compareTo(r).value >= 0);
		break;
	default: throw `Operación inválida: ${op}`;
	}

	return operation;
}

/**
 * @typedef {(it: import('./interpreter').Interpreter, l: import('./values').RuntimeValue, r: import('./values').RuntimeValue) => import('./values').RuntimeValue} BinaryExpressionFunction
 * @type {Map<import('../lexer/tokens').TokenKind, BinaryExpressionFunction>}
 */
const BinaryExpressionLookups = new Map();
BinaryExpressionLookups
	.set(TokenKinds.ADD, makeArithmeticBinaryOperation(TokenKinds.PLUS))
	.set(TokenKinds.SUBTRACT, makeArithmeticBinaryOperation(TokenKinds.DASH))
	.set(TokenKinds.MULTIPLY, makeArithmeticBinaryOperation(TokenKinds.STAR))
	.set(TokenKinds.DIVIDE, makeArithmeticBinaryOperation(TokenKinds.SLASH))

	.set(TokenKinds.PLUS, plusBinaryOperation)
	.set(TokenKinds.DASH, makeArithmeticBinaryOperation(TokenKinds.DASH))
	.set(TokenKinds.STAR, makeArithmeticBinaryOperation(TokenKinds.STAR))
	.set(TokenKinds.SLASH, makeArithmeticBinaryOperation(TokenKinds.SLASH))
	.set(TokenKinds.PERCENT, makeArithmeticBinaryOperation(TokenKinds.PERCENT))
	.set(TokenKinds.CARET, makeArithmeticBinaryOperation(TokenKinds.CARET))

	.set(TokenKinds.OR, makeRelationalBinaryOperation(TokenKinds.OR))
	.set(TokenKinds.AND, makeRelationalBinaryOperation(TokenKinds.AND))
	.set(TokenKinds.EQUALS, makeRelationalBinaryOperation(TokenKinds.EQUALS))
	.set(TokenKinds.NOT_EQUALS, makeRelationalBinaryOperation(TokenKinds.NOT_EQUALS))
	.set(TokenKinds.LESS, makeRelationalBinaryOperation(TokenKinds.LESS))
	.set(TokenKinds.LESS_EQUALS, makeRelationalBinaryOperation(TokenKinds.LESS_EQUALS))
	.set(TokenKinds.GREATER, makeRelationalBinaryOperation(TokenKinds.GREATER))
	.set(TokenKinds.GREATER_EQUALS, makeRelationalBinaryOperation(TokenKinds.GREATER_EQUALS));

/**
 * @type {Map<import('../lexer/tokens').TokenKind, import('./values').ValueKind>}
 */
const ValueKindLookups = new Map();
ValueKindLookups
	.set(TokenKinds.NUMBER, ValueKinds.NUMBER)
	.set(TokenKinds.TEXT, ValueKinds.TEXT)
	.set(TokenKinds.BOOLEAN, ValueKinds.BOOLEAN)
	.set(TokenKinds.LIST, ValueKinds.LIST)
	.set(TokenKinds.REGISTRY, ValueKinds.REGISTRY)
	.set(TokenKinds.EMBED, ValueKinds.EMBED)
	.set(TokenKinds.FUNCTION, ValueKinds.FUNCTION)
	.set(TokenKinds.NADA, ValueKinds.NADA);

module.exports = {
	UnaryExpressionLookups,
	BinaryExpressionLookups,
	ValueKindLookups,
};
