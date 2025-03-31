const { TokenKinds } = require('../lexer/tokens');
const { ValueKinds, coerceValue, makeNumber, makeText, makeBoolean, toggleBoolean } = require('./values');

/**
 * @typedef {import('../lexer/tokens').TokenKind} TokenKind
 * @typedef {import('../ast/expressions').Expression} Expression
 * @typedef {import('./values').RuntimeValue} RuntimeValue
 * @typedef {import('./values').ValueKind} ValueKind
 */

/**
 * @typedef {(it: import('./interpreter').Interpreter, arg: RuntimeValue, expr: Expression) => RuntimeValue} UnaryExpressionFunction
 * @typedef {(it: import('./interpreter').Interpreter, l: RuntimeValue, r: RuntimeValue, le: Expression, re: Expression) => import('./values').RuntimeValue} BinaryExpressionFunction
 */

/**
 * @param {TokenKind} op
 * @returns {UnaryExpressionFunction}
 */
function makeUnaryOperation(op) {
	/**@type {UnaryExpressionFunction}*/
	let operation;

	switch(op) {
	case TokenKinds.PLUS:
		operation = (it, arg, expr) => {
			it.rememberNode(expr);
			const val = coerceValue(it, arg, ValueKinds.NUMBER);
			it.forgetLastNode();

			return val;
		};
		break;

	case TokenKinds.DASH:
		operation = (it, arg, expr) => {
			it.rememberNode(expr);
			const val = coerceValue(it, arg, ValueKinds.NUMBER);
			it.forgetLastNode();

			val.value *= -1;
			return val;
		};
		break;

	case TokenKinds.NOT:
		operation = (it, arg, expr) => {
			it.rememberNode(expr);
			const val = coerceValue(it, arg, ValueKinds.BOOLEAN);
			it.forgetLastNode();

			return toggleBoolean(val);
		};
		break;

	default:
		throw `Operación inválida: ${op}`;
	}

	return operation;
}

/**@type {Map<TokenKind, UnaryExpressionFunction>}*/
const UnaryOperationLookups = new Map();
UnaryOperationLookups
	.set(TokenKinds.PLUS, makeUnaryOperation(TokenKinds.PLUS))
	.set(TokenKinds.DASH, makeUnaryOperation(TokenKinds.DASH))
	.set(TokenKinds.NOT, makeUnaryOperation(TokenKinds.NOT));

/**@type {BinaryExpressionFunction}*/
function plusBinaryOperation(it, l, r, le, re) {
	if(l.kind === ValueKinds.TEXT || r.kind === ValueKinds.TEXT) {
		it.rememberNode(le);
		const leftVal = coerceValue(it, l, ValueKinds.TEXT).value;
		it.forgetLastNode();

		it.rememberNode(re);
		const rightVal = coerceValue(it, r, ValueKinds.TEXT).value;
		it.forgetLastNode();
		
		return makeText(leftVal + rightVal);
	}

	it.rememberNode(le);
	const leftVal = coerceValue(it, l, ValueKinds.NUMBER).value;
	it.forgetLastNode();

	it.rememberNode(re);
	const rightVal = coerceValue(it, r, ValueKinds.NUMBER).value;
	it.forgetLastNode();

	return makeNumber(leftVal + rightVal);
}

/**
 * @param {TokenKind} op
 * @returns {BinaryExpressionFunction}
 */
function makeArithmeticBinaryOperation(op) {
	let operation;

	switch(op) {
	case TokenKinds.PLUS:        operation = (/**@type {Number}*/ l, /**@type {Number}*/ r) => makeNumber(l + r); break;
	case TokenKinds.DASH:        operation = (/**@type {Number}*/ l, /**@type {Number}*/ r) => makeNumber(l - r); break;
	case TokenKinds.STAR:        operation = (/**@type {Number}*/ l, /**@type {Number}*/ r) => makeNumber(l * r); break;
	case TokenKinds.SLASH:       operation = (/**@type {Number}*/ l, /**@type {Number}*/ r) => makeNumber(l / r); break;
	case TokenKinds.PERCENT:     operation = (/**@type {Number}*/ l, /**@type {Number}*/ r) => makeNumber(l % r); break;
	case TokenKinds.CARET:       operation = (/**@type {Number}*/ l, /**@type {Number}*/ r) => makeNumber(l ** r); break;
	case TokenKinds.DOUBLE_STAR: operation = (/**@type {Number}*/ l, /**@type {Number}*/ r) => makeNumber(l ** r); break;
	default: throw `Operación inválida: ${op}`;
	}

	return function(it, l, r, le, re) {
		it.rememberNode(le);
		const leftRawVal = coerceValue(it, l, ValueKinds.NUMBER).value;
		it.forgetLastNode();
		
		it.rememberNode(re);
		const rightRawVal = coerceValue(it, r, ValueKinds.NUMBER).value;
		it.forgetLastNode();
		
		if((op === TokenKinds.SLASH || op === TokenKinds.PERCENT) && rightRawVal === 0)
			throw it.TuberInterpreterError('División por cero');

		return operation(leftRawVal, rightRawVal);
	};
}

const nonCoercibleKinds = [
	ValueKinds.EMBED,
	ValueKinds.FUNCTION,
	ValueKinds.NATIVE_FN,
];

/**
 * @param {import("./interpreter").Interpreter} it
 * @param {RuntimeValue} l
 * @param {RuntimeValue} r
 */
function seems(it, l, r) {
	if(l.kind === r.kind)
		return l.equals(r);

	//Evitar fallos de coerciones
	if(it.isAnyOf(l, ...nonCoercibleKinds) || it.isAnyOf(r, ...nonCoercibleKinds))
		return makeBoolean(false);

	if(l.kind === ValueKinds.NADA || r.kind === ValueKinds.NADA) {
		if(l.kind === ValueKinds.NUMBER)
			return makeNumber(0).equals(l);

		if(r.kind === ValueKinds.NUMBER)
			return makeNumber(0).equals(r);

		if(it.isAnyOf(l, ValueKinds.TEXT, ValueKinds.BOOLEAN))
			return coerceValue(it, r, l.kind).equals(l);

		if(it.isAnyOf(r, ValueKinds.TEXT, ValueKinds.BOOLEAN))
			return coerceValue(it, l, r.kind).equals(r);

		return makeBoolean(false);
	}

	let coercedL, coercedR;

	if(it.isAnyOf(l, ValueKinds.TEXT, ValueKinds.LIST, ValueKinds.REGISTRY) || it.isAnyOf(r, ValueKinds.TEXT, ValueKinds.LIST, ValueKinds.REGISTRY)) {
		coercedL = coerceValue(it, l, ValueKinds.TEXT);
		coercedR = coerceValue(it, r, ValueKinds.TEXT);
	} else {
		coercedL = coerceValue(it, l, ValueKinds.NUMBER);
		coercedR = coerceValue(it, r, ValueKinds.NUMBER);
	}

	return coercedL.equals(coercedR);
}

/**
 * @param {TokenKind} op
 * @returns {BinaryExpressionFunction}
 */
function makeRelationalBinaryOperation(op) {
	/**@type {BinaryExpressionFunction}*/
	let operation;

	switch(op) {
	case TokenKinds.OR:
		operation = (it, l, r) => coerceValue(it, l, ValueKinds.BOOLEAN).value ? l : r;
		break;
	case TokenKinds.AND:
		operation = (it, l, r) => coerceValue(it, l, ValueKinds.BOOLEAN).value ? r : l;
		break;
	case TokenKinds.EQUALS:
		operation = (it, l, r) => l.equals(r);
		break;
	case TokenKinds.NOT_EQUALS:
		operation = (it, l, r) => toggleBoolean(l.equals(r));
		break;
	case TokenKinds.SEEMS:
		operation = (it, l, r) => seems(it, l, r);
		break;
	case TokenKinds.NOT_SEEMS:
		operation = (it, l, r) => toggleBoolean(seems(it, l, r));
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

/**@type {Map<TokenKind, BinaryExpressionFunction>}*/
const BinaryOperationLookups = new Map();
BinaryOperationLookups
	.set(TokenKinds.ADD, plusBinaryOperation)
	.set(TokenKinds.SUBTRACT, makeArithmeticBinaryOperation(TokenKinds.DASH))
	.set(TokenKinds.MULTIPLY, makeArithmeticBinaryOperation(TokenKinds.STAR))
	.set(TokenKinds.DIVIDE, makeArithmeticBinaryOperation(TokenKinds.SLASH))

	.set(TokenKinds.PLUS, plusBinaryOperation)
	.set(TokenKinds.DASH, makeArithmeticBinaryOperation(TokenKinds.DASH))
	.set(TokenKinds.STAR, makeArithmeticBinaryOperation(TokenKinds.STAR))
	.set(TokenKinds.SLASH, makeArithmeticBinaryOperation(TokenKinds.SLASH))
	.set(TokenKinds.PERCENT, makeArithmeticBinaryOperation(TokenKinds.PERCENT))
	.set(TokenKinds.CARET, makeArithmeticBinaryOperation(TokenKinds.CARET))
	.set(TokenKinds.DOUBLE_STAR, makeArithmeticBinaryOperation(TokenKinds.DOUBLE_STAR))

	.set(TokenKinds.OR, makeRelationalBinaryOperation(TokenKinds.OR))
	.set(TokenKinds.AND, makeRelationalBinaryOperation(TokenKinds.AND))

	.set(TokenKinds.EQUALS, makeRelationalBinaryOperation(TokenKinds.EQUALS))
	.set(TokenKinds.NOT_EQUALS, makeRelationalBinaryOperation(TokenKinds.NOT_EQUALS))
	.set(TokenKinds.SEEMS, makeRelationalBinaryOperation(TokenKinds.SEEMS))
	.set(TokenKinds.NOT_SEEMS, makeRelationalBinaryOperation(TokenKinds.NOT_SEEMS))	

	.set(TokenKinds.LESS, makeRelationalBinaryOperation(TokenKinds.LESS))
	.set(TokenKinds.LESS_EQUALS, makeRelationalBinaryOperation(TokenKinds.LESS_EQUALS))
	.set(TokenKinds.GREATER, makeRelationalBinaryOperation(TokenKinds.GREATER))
	.set(TokenKinds.GREATER_EQUALS, makeRelationalBinaryOperation(TokenKinds.GREATER_EQUALS));

/**
 * @type {Map<TokenKind, ValueKind>}
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
	UnaryOperationLookups,
	BinaryOperationLookups,
	ValueKindLookups,
};
