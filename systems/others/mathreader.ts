import { ValuesOf } from "types";

export const TokenTypes = ({
	NUMBER: 'Number',
	OPERATOR: 'Operator',
	IDENTIFIER: 'Identifier',
	GROUP_OPEN: 'GroupOpen',
	GROUP_CLOSE: 'GroupClose',
}) as const;
type TokenType = ValuesOf<typeof TokenTypes>;

export const MathOperators = [
	'+',
	'-',
	'*',
	'/',
	'%',
	'^',
] as const;
type OperatorType = typeof MathOperators[number];

interface BaseMathToken<TToken extends TokenType> {
	type: TToken;
	value: number | string | undefined;
}

interface MathNumberToken extends BaseMathToken<'Number'> {
	value: number;
}

interface MathOperatorToken extends BaseMathToken<'Operator'> {
	value: OperatorType;
}

interface MathIdentifierToken extends BaseMathToken<'Identifier'> {
	value: string;
}

interface MathGroupOpenToken extends BaseMathToken<'GroupOpen'> {
	value: '(';
}

interface MathGroupCloseToken extends BaseMathToken<'GroupClose'> {
	value: ')';
}

type MathToken =
	| MathNumberToken
	| MathOperatorToken
	| MathIdentifierToken
	| MathGroupOpenToken
	| MathGroupCloseToken;

function createToken<TToken extends TokenType>(type: TToken, value: (MathToken & { type: TToken })['value']): MathToken {
	return {
		type: type,
		value: value,
	} as MathToken;
};

const operatorAliases = new Map<string, OperatorType>();
operatorAliases.set('x', '*');
operatorAliases.set(':', '/');

export class MathLexer {
	#stream = '';
	#cursor = 0;
	#lastToken: MathToken;

	get #current() {
		return this.#stream.charAt(this.#cursor);
	}

	tokenize(str: string): MathToken[] {
		this.#stream = str;
		this.#cursor = 0;

		const tokens: MathToken[] = [];

		while(this.#cursor < this.#stream.length) {
			if(/\s/.test(this.#current)) {
				this.#cursor++;
				continue;
			}

			if(MathOperators.includes(this.#current as OperatorType) || operatorAliases.has(this.#current)) {
				const actualOperator = operatorAliases.get(this.#current) || this.#current as OperatorType;
				tokens.push(createToken(TokenTypes.OPERATOR, actualOperator));
				this.#cursor++;
				continue;
			}

			if(this.#current === '(') {
				tokens.push(createToken(TokenTypes.GROUP_OPEN, '('));
				this.#cursor++;
				continue;
			}

			if(this.#current === ')') {
				tokens.push(createToken(TokenTypes.GROUP_CLOSE, ')'));
				this.#cursor++;
				continue;
			}

			if(/[\d.]/.test(this.#current)) {
				let numberString = '';

				while(/[\d.]/.test(this.#current) && this.#cursor < this.#stream.length) {
					numberString += this.#current;
					this.#cursor++;
				}

				const finalNumber = parseFloat(numberString);

				if(isNaN(finalNumber))
					throw new MathLexerError(`Número inválido en posición ${this.#cursor}`);

				tokens.push(createToken(TokenTypes.NUMBER, finalNumber));
				continue;
			}

			if(/\w/.test(this.#current)) {
				let text = '';

				while(/\w/.test(this.#current) && this.#cursor < this.#stream.length) {
					text += this.#current;
					this.#cursor++;
				}

				text = text.toLowerCase();

				switch(text) {
					case 'pi':
						tokens.push(createToken(TokenTypes.NUMBER, Math.PI));
						continue;

					case 'e':
						tokens.push(createToken(TokenTypes.NUMBER, Math.E));
						continue;

					case 'inf':
						tokens.push(createToken(TokenTypes.NUMBER, Number.POSITIVE_INFINITY));
						continue;

					case 'sqrt':
					case 'sin':
					case 'cos':
					case 'tan':
					case 'rad':
					case 'deg':
						tokens.push(createToken(TokenTypes.IDENTIFIER, text));
						continue;

					default: {
						throw new MathLexerError(`Texto inválido en posición ${this.#cursor}: ${text}`);
					}
				}
			}

			if('⁰¹²³⁴⁵⁶⁷⁸⁹'.includes(this.#current)) {
				if(this.#lastToken && this.#lastToken.type === TokenTypes.IDENTIFIER && this.#lastToken.value === '^')
					throw new MathLexerError(`Potencia inválida en posición ${this.#cursor}: ${this.#current}\nUsa "^X" o un símbolo exponente, pero no ambos juntos`);

				tokens.push(createToken(TokenTypes.OPERATOR, '^'));

				switch((this.#cursor++, this.#current)) {
				case '⁰':
					tokens.push(createToken(TokenTypes.NUMBER, 0));
					continue;

				case '¹':
					tokens.push(createToken(TokenTypes.NUMBER, 1));
					continue;

				case '²':
					tokens.push(createToken(TokenTypes.NUMBER, 2));
					continue;

				case '³':
					tokens.push(createToken(TokenTypes.NUMBER, 3));
					continue;

				case '⁴':
					tokens.push(createToken(TokenTypes.NUMBER, 4));
					continue;

				case '⁵':
					tokens.push(createToken(TokenTypes.NUMBER, 5));
					continue;

				case '⁶':
					tokens.push(createToken(TokenTypes.NUMBER, 6));
					continue;

				case '⁷':
					tokens.push(createToken(TokenTypes.NUMBER, 7));
					continue;

				case '⁸':
					tokens.push(createToken(TokenTypes.NUMBER, 8));
					continue;

				case '⁹':
					tokens.push(createToken(TokenTypes.NUMBER, 9));
					continue;
				}
			}

			if(this.#current === 'π') {
				tokens.push(createToken(TokenTypes.NUMBER, Math.PI));
				this.#cursor++;
				continue;
			}

			if(this.#current === '∞') {
				tokens.push(createToken(TokenTypes.NUMBER, Number.POSITIVE_INFINITY));
				this.#cursor++;
				continue;
			}

			if(this.#current === '√') {
				tokens.push(createToken(TokenTypes.IDENTIFIER, 'sqrt'));
				this.#cursor++;
				continue;
			}

			throw new MathLexerError(`Caracter inválido en posición ${this.#cursor}: ${this.#current}`);
		}

		return tokens;
	}
}

class MathLexerError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'MathLexerError';
	}
}

const NodeTypes = ({
	LITERAL: 'LiteralExpression',
	UNARY: 'UnaryExpression',
	BINARY: 'BinaryExpression',
	FUNCTION_CALL: 'FunctionCall',
}) as const;
type NodeType = ValuesOf<typeof NodeTypes>;

interface BaseMathNode<TNode extends NodeType> {
	type: TNode;
}

interface MathLiteralExpressionNode extends BaseMathNode<'LiteralExpression'> {
	value: number;
}

interface MathUnaryExpressionNode extends BaseMathNode<'UnaryExpression'> {
	operator: OperatorType;
	argument: MathNode;
}

interface MathBinaryExpressionNode extends BaseMathNode<'BinaryExpression'> {
	operator: OperatorType;
	leftOperand: MathNode;
	rightOperand: MathNode;
}

interface MathFunctionCallNode extends BaseMathNode<'FunctionCall'> {
	identifier: string;
	argument: MathNode; //Solo 1 argumento por simplicidad
}

type MathNode =
	| MathLiteralExpressionNode
	| MathUnaryExpressionNode
	| MathBinaryExpressionNode
	| MathFunctionCallNode;

export class MathParser {
	#tokens: MathToken[] = [];
	#cursor = 0;

	constructor(tokens: MathToken[]) {
		this.#tokens = tokens;
	}

	get #current() {
		return this.#tokens[this.#cursor];
	}

    #makeLiteralExpressionNode(value: number): MathLiteralExpressionNode {
        return {
            type: NodeTypes.LITERAL,
            value,
        };
    }

    #makeUnaryExpressionNode(operator: OperatorType, argument: MathNode): MathUnaryExpressionNode {
        return {
            type: NodeTypes.UNARY,
            operator,
            argument,
        };
    }

    #makeBinaryExpressionNode(operator: OperatorType, leftOperand: MathNode, rightOperand: MathNode): MathBinaryExpressionNode {
        return {
            type: NodeTypes.BINARY,
            operator,
            leftOperand,
            rightOperand,
        };
    }

    #makeFunctionCallNode(identifier: string, argument: MathNode): MathFunctionCallNode {
        return {
            type: NodeTypes.FUNCTION_CALL,
            identifier,
            argument,
        };
    }

	#expect<TToken extends TokenType>(tokenType: TToken): MathToken & { type: TToken } {
		const token = this.#current;

		if(token.type !== tokenType)
			throw new MathParserError(`Se esperaba un token de tipo: ${tokenType}; se encontró: ${this.#current.type}; con valor: ${this.#current.value}`);

		this.#cursor++;

		return token as MathToken & { type: TToken };
	}

	parse(): MathNode {
		return this.#parseCombination();
	}

	//Suma y resta
	#parseCombination(): MathNode {
		let leftOperand = this.#parseFactor();

		while(this.#current.type === TokenTypes.OPERATOR && '+-'.includes(this.#current.value)) {
			const operator = this.#expect(TokenTypes.OPERATOR);
			const rightOperand = this.#parseFactor();
			leftOperand = this.#makeBinaryExpressionNode(operator.value, leftOperand, rightOperand);
		}

		return leftOperand;
	}

	//Multiplicación y división
	#parseFactor(): MathNode {
		let leftOperand = this.#parsePower();

		while(this.#current.type === TokenTypes.OPERATOR && '*/%'.includes(this.#current.value)) {
			const operator = this.#expect(TokenTypes.OPERATOR);
			const rightOperand = this.#parsePower();
			leftOperand = this.#makeBinaryExpressionNode(operator.value, leftOperand, rightOperand);
		}

		return leftOperand;
	}

	//Potencias
	#parsePower(): MathNode {
		let leftOperand = this.#parseHighest();

		while(this.#current.type === TokenTypes.OPERATOR && this.#current.value === '^') {
			const identifier = this.#expect(TokenTypes.OPERATOR);
			const rightOperand = this.#parsePower();
			leftOperand = this.#makeBinaryExpressionNode(identifier.value, leftOperand, rightOperand);
		}

		return leftOperand;
	}

	//Expresiones de mayor precedencia
	#parseHighest(): MathNode {
		if(this.#current.type === TokenTypes.NUMBER) {
			const number = this.#expect(TokenTypes.NUMBER);
			return this.#makeLiteralExpressionNode(number.value);
		}

		if(this.#current.type === TokenTypes.OPERATOR) {
			const operator = this.#expect(TokenTypes.OPERATOR);
			const argument = this.#parseCombination();
			return this.#makeUnaryExpressionNode(operator.value, argument);
		}

		if(this.#current.type === TokenTypes.IDENTIFIER) {
			const identifier = this.#expect(TokenTypes.IDENTIFIER);
			const argument = this.#parseCombination();
			return this.#makeFunctionCallNode(identifier.value, argument);
		}

		if(this.#current.type === TokenTypes.GROUP_OPEN) {
			this.#expect(TokenTypes.GROUP_OPEN);
			const expression = this.#parseCombination();
			this.#expect(TokenTypes.GROUP_CLOSE);
			return expression;
		}

		throw new MathParserError(`Token inesperado en posición ${this.#cursor}: ${this.#current.type} (${this.#current.value})`);
	}
}

class MathParserError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'MathParserError';
	}
}

type UnaryOperation = (argument: number) => number;
const unaryOperations: Record<string, UnaryOperation> = {
	'+':    argument => argument,
	'-':    argument => (-argument),
	'sqrt': argument => Math.sqrt(argument),
	'sin':  argument => Math.sin(argument),
	'cos':  argument => Math.cos(argument),
	'tan':  argument => Math.tan(argument),
	'rad':  argument => argument * (Math.PI / 180),
	'deg':  argument => argument * (180 / Math.PI),
};

type BinaryOperation = (leftOperand: number, rightOperand: number) => number;
const binaryOperations: Record<OperatorType, BinaryOperation> = {
	'+': (leftOperand, rightOperand) => leftOperand + rightOperand,
	'-': (leftOperand, rightOperand) => leftOperand - rightOperand,
	'*': (leftOperand, rightOperand) => leftOperand * rightOperand,
	'/': (leftOperand, rightOperand) => leftOperand / rightOperand,
	'%': (leftOperand, rightOperand) => leftOperand % rightOperand,
	'^': (leftOperand, rightOperand) => Math.pow(leftOperand, rightOperand),
};

/**@class*/
export class MathCalculator {
	#tree: MathNode;

	constructor(tree: MathNode) {
		this.#tree = tree;
	}

	/**@returns {Number} El resultado de la operación del árbol.*/
	calculate(): number {
		return this.#calculateNode(this.#tree);
	}

	/**@returns El resultado de la operación del Token.*/
	#calculateNode(token: MathNode): number {
		switch(token.type) {
		case NodeTypes.LITERAL:
			return token.value;

		case NodeTypes.UNARY:
			return this.#operateUnary(token.operator, token.argument);

		case NodeTypes.BINARY:
			return this.#operateBinary(token.operator, token.leftOperand, token.rightOperand);

		default:
			throw new MathCalculatorError(`Nodo inesperado: ${token.type}`);
		}
	}

	/**
	 * @description Realiza una operación unaria
	 * @returns El resultado de la operación
	 */
	#operateUnary(operator: OperatorType, argument: MathNode): number {
		const numericArgument = this.#calculateNode(argument);
		return unaryOperations[operator](numericArgument);
	}

	/**
	 * @description Realiza una operación binaria.
	 * @returns El resultado de la operación.
	 */
	#operateBinary(operator: OperatorType, leftOperand: MathNode, rightOperand: MathNode): number {
		const numericLeftOperand = this.#calculateNode(leftOperand);
		const numericRightOperand = this.#calculateNode(rightOperand);
		return binaryOperations[operator](numericLeftOperand, numericRightOperand);
	}
}

class MathCalculatorError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'MathCalculatorError';
	}
}

/**
 * @description Realiza un cálculo en base al string ingresado.
 * @param operation La operación a realizar.
 * @returns El resultado de la operación.
 */
export function calc(operation: string): number {
	const lexer = new MathLexer();
	const tokens = lexer.tokenize(operation);

	const parser = new MathParser(tokens);
	const tree = parser.parse();

	const calculator = new MathCalculator(tree);
	const result = calculator.calculate();

	return result;
}
