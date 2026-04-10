import { Expression } from '../ast/expressions';
import { TokenKind, TokenKinds } from '../lexer/tokens';
import { Interpreter } from '.';
import {
	ValueKinds,
	coerceValue,
	makeNumber,
	makeText,
	makeBoolean,
	toggleBoolean,
	RuntimeValue,
	NumberValue,
	TextValue,
	ValueKind,
} from './values';

export type UnaryExpressionFunction = (
	interpreter: Interpreter,
	arg: RuntimeValue,
	expr: Expression,
) => RuntimeValue;

export type BinaryExpressionFunction = (
	interpreter: Interpreter,
	left: RuntimeValue,
	right: RuntimeValue,
	leftExpression: Expression,
	rightExpression: Expression,
) => RuntimeValue;

function makeUnaryOperation(op: TokenKind): UnaryExpressionFunction {
	let operation: UnaryExpressionFunction;

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

export const UnaryOperationLookups = new Map<TokenKind, UnaryExpressionFunction>()
	.set(TokenKinds.PLUS, makeUnaryOperation(TokenKinds.PLUS))
	.set(TokenKinds.DASH, makeUnaryOperation(TokenKinds.DASH))
	.set(TokenKinds.NOT, makeUnaryOperation(TokenKinds.NOT));

const plusBinaryOperation: BinaryExpressionFunction = (
	interpreter,
	leftValue,
	rightValue,
	leftExpression,
	rightExpression,
) => {
	if(leftValue.kind === ValueKinds.TEXT || rightValue.kind === ValueKinds.TEXT) {
		interpreter.rememberNode(leftExpression);
		const leftVal = coerceValue(interpreter, leftValue, ValueKinds.TEXT).value;
		interpreter.forgetLastNode();

		interpreter.rememberNode(rightExpression);
		const rightVal = coerceValue(interpreter, rightValue, ValueKinds.TEXT).value;
		interpreter.forgetLastNode();

		return makeText(leftVal + rightVal);
	}

	interpreter.rememberNode(leftExpression);
	const leftVal = coerceValue(interpreter, leftValue, ValueKinds.NUMBER).value;
	interpreter.forgetLastNode();

	interpreter.rememberNode(rightExpression);
	const rightVal = coerceValue(interpreter, rightValue, ValueKinds.NUMBER).value;
	interpreter.forgetLastNode();

	return makeNumber(leftVal + rightVal);
};

function makeArithmeticBinaryOperation(op: TokenKind): BinaryExpressionFunction {
	let operation: (leftOperand: number, rightOperand: number) => RuntimeValue;

	switch(op) {
	case TokenKinds.PLUS:
		operation = (l, r) => makeNumber(l + r);
		break;
	case TokenKinds.DASH:
		operation = (l, r) => makeNumber(l - r);
		break;
	case TokenKinds.STAR:
		operation = (l, r) => makeNumber(l * r);
		break;
	case TokenKinds.SLASH:
		operation = (l, r) => makeNumber(l / r);
		break;
	case TokenKinds.PERCENT:
		operation = (l, r) => makeNumber(l % r);
		break;
	case TokenKinds.CARET:
		operation = (l, r) => makeNumber(l ** r);
		break;
	case TokenKinds.DOUBLE_STAR:
		operation = (l, r) => makeNumber(l ** r);
		break;
	default:
		throw `Operación inválida: ${op}`;
	}

	return function (interpreter, leftValue, rightValue, leftExpression, rightExpression) {
		interpreter.rememberNode(leftExpression);
		const leftRawVal = coerceValue(interpreter, leftValue, ValueKinds.NUMBER).value;
		interpreter.forgetLastNode();

		interpreter.rememberNode(rightExpression);
		const rightRawVal = coerceValue(interpreter, rightValue, ValueKinds.NUMBER).value;
		interpreter.forgetLastNode();

		if((op === TokenKinds.SLASH || op === TokenKinds.PERCENT) && rightRawVal === 0)
			throw interpreter.TuberInterpreterError('División por cero');

		return operation(leftRawVal, rightRawVal);
	};
}

const nonCoercibleKinds = [ ValueKinds.EMBED, ValueKinds.FUNCTION, ValueKinds.NATIVE_FN ];

function seems(interpreter: Interpreter, leftOperand: RuntimeValue, rightOperand: RuntimeValue) {
	if(leftOperand.kind === rightOperand.kind) return leftOperand.equals(rightOperand);

	//Evitar fallos de coerciones
	if(
		interpreter.isAnyOf(leftOperand, ...nonCoercibleKinds) ||
		interpreter.isAnyOf(rightOperand, ...nonCoercibleKinds)
	)
		return makeBoolean(false);

	if(leftOperand.kind === ValueKinds.NADA || rightOperand.kind === ValueKinds.NADA) {
		if(leftOperand.kind === ValueKinds.NUMBER) return makeNumber(0).equals(leftOperand);

		if(rightOperand.kind === ValueKinds.NUMBER) return makeNumber(0).equals(rightOperand);

		if(interpreter.isAnyOf(leftOperand, ValueKinds.TEXT, ValueKinds.BOOLEAN))
			return coerceValue(interpreter, rightOperand, leftOperand.kind).equals(leftOperand);

		if(interpreter.isAnyOf(rightOperand, ValueKinds.TEXT, ValueKinds.BOOLEAN))
			return coerceValue(interpreter, leftOperand, rightOperand.kind).equals(rightOperand);

		return makeBoolean(false);
	}

	let coercedLeft: NumberValue | TextValue, coercedRight: NumberValue | TextValue;

	if(
		interpreter.isAnyOf(leftOperand, ValueKinds.TEXT, ValueKinds.LIST, ValueKinds.REGISTRY) ||
		interpreter.isAnyOf(rightOperand, ValueKinds.TEXT, ValueKinds.LIST, ValueKinds.REGISTRY)
	) {
		coercedLeft = coerceValue(interpreter, leftOperand, ValueKinds.TEXT);
		coercedRight = coerceValue(interpreter, rightOperand, ValueKinds.TEXT);
	} else {
		coercedLeft = coerceValue(interpreter, leftOperand, ValueKinds.NUMBER);
		coercedRight = coerceValue(interpreter, rightOperand, ValueKinds.NUMBER);
	}

	return coercedLeft.equals(coercedRight);
}

function makeRelationalBinaryOperation(op: TokenKind): BinaryExpressionFunction {
	let operation: BinaryExpressionFunction;

	switch(op) {
	case TokenKinds.OR:
		operation = (interpreter, leftValue, rightValue) =>
			coerceValue(interpreter, leftValue, ValueKinds.BOOLEAN).value
				? leftValue
				: rightValue;
		break;
	case TokenKinds.AND:
		operation = (interpreter, leftValue, rightValue) =>
			coerceValue(interpreter, leftValue, ValueKinds.BOOLEAN).value
				? rightValue
				: leftValue;
		break;
	case TokenKinds.EQUALS:
		operation = (_interpreter, leftValue, rightValue) => leftValue.equals(rightValue);
		break;
	case TokenKinds.NOT_EQUALS:
		operation = (_interpreter, leftValue, rightValue) =>
			toggleBoolean(leftValue.equals(rightValue));
		break;
	case TokenKinds.SEEMS:
		operation = (interpreter, leftValue, rightValue) =>
			seems(interpreter, leftValue, rightValue);
		break;
	case TokenKinds.NOT_SEEMS:
		operation = (interpreter, leftValue, rightValue) =>
			toggleBoolean(seems(interpreter, leftValue, rightValue));
		break;
	case TokenKinds.LESS:
		operation = (_interpreter, leftValue, rightValue) =>
			makeBoolean(leftValue.compareTo(rightValue).value < 0);
		break;
	case TokenKinds.LESS_EQUALS:
		operation = (_interpreter, leftValue, rightValue) =>
			makeBoolean(leftValue.compareTo(rightValue).value <= 0);
		break;
	case TokenKinds.GREATER:
		operation = (_interpreter, leftValue, rightValue) =>
			makeBoolean(leftValue.compareTo(rightValue).value > 0);
		break;
	case TokenKinds.GREATER_EQUALS:
		operation = (_interpreter, leftValue, rightValue) =>
			makeBoolean(leftValue.compareTo(rightValue).value >= 0);
		break;
	default:
		throw `Operación inválida: ${op}`;
	}

	return operation;
}

export const BinaryOperationLookups = new Map<TokenKind, BinaryExpressionFunction>()
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

export const ValueKindLookups = new Map<TokenKind, ValueKind>()
	.set(TokenKinds.NUMBER, ValueKinds.NUMBER)
	.set(TokenKinds.TEXT, ValueKinds.TEXT)
	.set(TokenKinds.BOOLEAN, ValueKinds.BOOLEAN)
	.set(TokenKinds.LIST, ValueKinds.LIST)
	.set(TokenKinds.REGISTRY, ValueKinds.REGISTRY)
	.set(TokenKinds.EMBED, ValueKinds.EMBED)
	.set(TokenKinds.FUNCTION, ValueKinds.FUNCTION)
	.set(TokenKinds.NADA, ValueKinds.NADA);
