import { ValuesOf } from 'types';

import Logger from '../../utils/logs';
import { shortenText, toLowerCaseNormalized } from '../../func';

const { debug, fatal } = Logger('DEBUG', 'MathReader');

export const MathTokenTypes = ({
	NUMBER: 'Number',
	OPERATOR: 'Operator',
	IDENTIFIER: 'Identifier',
	GROUP_OPEN: 'GroupOpen',
	GROUP_CLOSE: 'GroupClose',
	EOF: 'EndOfFile',
}) as const;
type MathTokenType = ValuesOf<typeof MathTokenTypes>;

export const MathOperators = [
	'+',
	'-',
	'*',
	'/',
	'%',
	'^',
] as const;
type OperatorType = typeof MathOperators[number];

interface BaseMathToken<TToken extends MathTokenType> {
	type: TToken;
	value: number | string | undefined;
	start: number;
	end: number;
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

interface MathEndOfFileToken extends BaseMathToken<'EndOfFile'> {
	value: undefined;
}

type MathToken<TToken extends MathTokenType = MathTokenType> = (
	| MathNumberToken
	| MathOperatorToken
	| MathIdentifierToken
	| MathGroupOpenToken
	| MathGroupCloseToken
	| MathEndOfFileToken
) & BaseMathToken<TToken>;

const operatorAliases = new Map<string, OperatorType>();
operatorAliases.set('x', '*');
operatorAliases.set(':', '/');

type MathLexerPatternHandler = (match: string, rawMatch: string) => void;
interface MathLexerPattern {
	match: string | string[] | RegExp;
	handler: MathLexerPatternHandler;
}

export class MathLexer {
	#stream = '';
	#cursor = 0;
	#tokens: MathToken[];

	readonly #patterns: MathLexerPattern[] = [
		{ match: /^\s+/, handler: this.#makeSkipHandler() },
		{ match: [ ...MathOperators, ...operatorAliases.keys() ], handler: this.#makeOperatorHandler() },
		{ match: '(', handler: this.#makeDefaultHandler(MathTokenTypes.GROUP_OPEN) },
		{ match: ')', handler: this.#makeDefaultHandler(MathTokenTypes.GROUP_CLOSE) },
		{ match: /^[A-Za-z_][A-Za-z0-9_]{0,20}/, handler: this.#makeSymbolHandler() },
		{ match: /^[\d.]+/, handler: this.#makeNumberHandler() },
		{ match: '⁰¹²³⁴⁵⁶⁷⁸⁹'.split(''), handler: this.#makeUnicodePowerHandler() },
		{ match: 'π', handler: this.#makeInterpretationHandler(MathTokenTypes.NUMBER, Math.PI) },
		{ match: '∞', handler: this.#makeInterpretationHandler(MathTokenTypes.NUMBER, Number.POSITIVE_INFINITY) },
		{ match: '√', handler: this.#makeInterpretationHandler(MathTokenTypes.IDENTIFIER, 'sqrt') },
	];

	/**@description Devuelve el resto del source desde la posición actual.*/
	get remainder() {
		return this.#stream.slice(this.#cursor);
	}

	tokenize(str: string): MathToken[] {
		debug('A punto de tokenizar stream:', str);

		this.#stream = str;
		this.#cursor = 0;
		this.#tokens = [];

		let match: string;
		let normalizedRemainder: string;

		while(this.#cursor < this.#stream.length) {
			match = null;
			normalizedRemainder = toLowerCaseNormalized(this.remainder);

			for(const pattern of this.#patterns) {
				match = this.#matchPattern(pattern, normalizedRemainder);

				if(match != null) {
					const rawMatch = this.remainder.slice(0, match.length);
					pattern.handler(match, rawMatch);
					break;
				}
			}

			if(match == null) {
				const wsIndex = this.remainder.match(/[\r\s\b]/)?.index ?? this.remainder.length;
				throw new MathLexerError(`Símbolo no reconocido: \`${shortenText(this.remainder.slice(0, wsIndex), 12, ' (…)')}\``);
			}
		}

		this.#addToken(MathTokenTypes.EOF, undefined, 1);

		return [ ...this.#tokens ];
	}

	#addToken<TToken extends MathTokenType>(type: TToken, value: MathToken<TToken>['value'], length: number): MathToken {
		const token = {
			type: type,
			value: value,
			start: this.#cursor + 1,
			end: this.#cursor + length + 1,
		} as MathToken;

		this.#tokens.push(token);

		return token;
	}

	#matchPattern(pattern: MathLexerPattern, source: string) {
		if(typeof pattern.match === 'string')
			return this.#stringPatternMatch(pattern.match, source);

		if(Array.isArray(pattern.match))
			return this.#stringArrayPatternMatch(pattern.match, source);

		return this.#regexPatternMatch(pattern.match, source);
	}

	#stringPatternMatch(matcher: string, source: string): string | null {
		const slicedSource = source.slice(0, matcher.length);

		return (slicedSource === matcher) ? slicedSource : null;
	}

	#stringArrayPatternMatch(matchers: string[] | ReadonlyArray<string>, source: string): string | null {
		let matched: string | null = null;

		for(const matcher of matchers) {
			const slicedSource = source.slice(0, matcher.length);

			if(slicedSource === matcher)
				matched = slicedSource;
		}

		return matched;
	}

	#regexPatternMatch(matcher: RegExp, source: string): string | null {
		const match = matcher.exec(source);

		if(match == null)
			return null;

		if(match.index !== 0)
			return null;

		return match[0];
	}

	#makeSkipHandler(): MathLexerPatternHandler {
		return (matched) => {
			this.#cursor += matched.length;
		};
	}

	#makeDefaultHandler(tokenType: MathTokenType): MathLexerPatternHandler {
		return (_, rawMatch) => {
			const tokenLength = `${rawMatch}`.length;
			this.#addToken(tokenType, rawMatch, tokenLength);
			this.#cursor += tokenLength;
		};
	}

	#makeOperatorHandler(): MathLexerPatternHandler {
		return (matched) => {
			const tokenLength = matched.length;
			const operator: OperatorType = operatorAliases.get(matched) || matched as OperatorType;
			this.#addToken(MathTokenTypes.OPERATOR, operator, tokenLength);
			this.#cursor += tokenLength;
		};
	}

	#makeSymbolHandler(): MathLexerPatternHandler {
		return (matched) => {
			const tokenLength = matched.length;
			matched = matched.toLowerCase();
			switch(matched) {
			case 'pi':
				this.#addToken(MathTokenTypes.NUMBER, Math.PI, tokenLength);
				this.#cursor += matched.length;
				return;

			case 'e':
				this.#addToken(MathTokenTypes.NUMBER, Math.E, tokenLength);
				this.#cursor += matched.length;
				return;

			case 'inf':
				this.#addToken(MathTokenTypes.NUMBER, Number.POSITIVE_INFINITY, tokenLength);
				this.#cursor += matched.length;
				return;

			case 'sqrt':
			case 'sin':
			case 'cos':
			case 'tan':
			case 'rad':
			case 'deg':
				this.#addToken(MathTokenTypes.IDENTIFIER, matched, tokenLength);
				this.#cursor += matched.length;
				return;

			default:
				fatal(new MathLexerError(`Texto inválido en posición ${this.#cursor}: ${matched}`));
			}
		};
	}

	#makeNumberHandler(): MathLexerPatternHandler {
		return (matched) => {
			const tokenLength = matched.length;
			const num = +matched.replace(/_/g, '');

			if(isNaN(num))
				fatal(new MathLexerError(`Número inválido en posición ${this.#cursor}`));

			this.#addToken(MathTokenTypes.NUMBER, num, tokenLength);
			this.#cursor += matched.length;
		};
	}

	#makeUnicodePowerHandler(): MathLexerPatternHandler {
		return (matched) => {
			const tokenLength = matched.length;

			this.#addToken(MathTokenTypes.OPERATOR, '^', tokenLength);

			switch(matched) {
			case '⁰':
				this.#addToken(MathTokenTypes.NUMBER, 0, tokenLength);
				return;

			case '¹':
				this.#addToken(MathTokenTypes.NUMBER, 1, tokenLength);
				return;

			case '²':
				this.#addToken(MathTokenTypes.NUMBER, 2, tokenLength);
				return;

			case '³':
				this.#addToken(MathTokenTypes.NUMBER, 3, tokenLength);
				return;

			case '⁴':
				this.#addToken(MathTokenTypes.NUMBER, 4, tokenLength);
				return;

			case '⁵':
				this.#addToken(MathTokenTypes.NUMBER, 5, tokenLength);
				return;

			case '⁶':
				this.#addToken(MathTokenTypes.NUMBER, 6, tokenLength);
				return;

			case '⁷':
				this.#addToken(MathTokenTypes.NUMBER, 7, tokenLength);
				return;

			case '⁸':
				this.#addToken(MathTokenTypes.NUMBER, 8, tokenLength);
				return;

			case '⁹':
				this.#addToken(MathTokenTypes.NUMBER, 9, tokenLength);
				return;
			}
		};
	}

	#makeInterpretationHandler<TToken extends MathTokenType>(type: TToken, value: MathToken<TToken>['value']): MathLexerPatternHandler {
		return (matched) => {
			const tokenLength = matched.length;
			this.#addToken<TToken>(type, value, tokenLength);
			this.#cursor += tokenLength;
		};
	}
}

export class MathLexerError extends Error {
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

	#expect<TToken extends MathTokenType>(tokenType: TToken): MathToken & { type: TToken } {
		const token = this.#current;

		if(token.type !== tokenType) {
			const token = this.#current;
			const { start, end, type, value } = token ?? {};
			fatal(new MathParserError(`Se esperaba un token de tipo: ${tokenType}, en posición ${start}; se encontró: ${type}; con valor: ${value}; hasta posición: ${end}`));
		}

		this.#cursor++;

		return token as MathToken & { type: TToken };
	}

	parse(): MathNode {
		const result = this.#parseCombination();

		if(this.#tokens.length && this.#current.type !== MathTokenTypes.EOF) {
			const token = this.#current;
			const { start, end, type, value } = token ?? {};
			fatal(new MathParserError(`Token inesperado en posición ${start}${start + 1 !== end ? ` a ${this.#current?.end}` : ''}: ${type}; con valor: ${value}`));
		}

		return result;
	}

	//Suma y resta
	#parseCombination(): MathNode {
		let leftOperand = this.#parseFactor();

		while(this.#current.type === MathTokenTypes.OPERATOR && '+-'.includes(this.#current.value)) {
			const operator = this.#expect(MathTokenTypes.OPERATOR);
			const rightOperand = this.#parseFactor();
			leftOperand = this.#makeBinaryExpressionNode(operator.value, leftOperand, rightOperand);
		}

		return leftOperand;
	}

	//Multiplicación y división
	#parseFactor(): MathNode {
		let leftOperand = this.#parsePower();

		while(this.#current.type === MathTokenTypes.OPERATOR && '*/%'.includes(this.#current.value)) {
			const operator = this.#expect(MathTokenTypes.OPERATOR);
			const rightOperand = this.#parsePower();
			leftOperand = this.#makeBinaryExpressionNode(operator.value, leftOperand, rightOperand);
		}

		return leftOperand;
	}

	//Potencias
	#parsePower(): MathNode {
		let leftOperand = this.#parseHighest();

		while(this.#current.type === MathTokenTypes.OPERATOR && this.#current.value === '^') {
			const identifier = this.#expect(MathTokenTypes.OPERATOR);
			const rightOperand = this.#parsePower();
			leftOperand = this.#makeBinaryExpressionNode(identifier.value, leftOperand, rightOperand);
		}

		return leftOperand;
	}

	//Expresiones de mayor precedencia
	#parseHighest(): MathNode {
		if(this.#current.type === MathTokenTypes.NUMBER) {
			const number = this.#expect(MathTokenTypes.NUMBER);
			return this.#makeLiteralExpressionNode(number.value);
		}

		if(this.#current.type === MathTokenTypes.OPERATOR) {
			const operator = this.#expect(MathTokenTypes.OPERATOR);
			const argument = this.#parseHighest();
			return this.#makeUnaryExpressionNode(operator.value, argument);
		}

		if(this.#current.type === MathTokenTypes.IDENTIFIER) {
			const identifier = this.#expect(MathTokenTypes.IDENTIFIER);
			const argument = this.#parseHighest();
			return this.#makeFunctionCallNode(identifier.value, argument);
		}

		if(this.#current.type === MathTokenTypes.GROUP_OPEN) {
			this.#expect(MathTokenTypes.GROUP_OPEN);
			const expression = this.#parseCombination();
			this.#expect(MathTokenTypes.GROUP_CLOSE);
			return expression;
		}

		const token = this.#current;
		const { start, end, type, value } = token ?? {};
		fatal(new MathParserError(`Token inesperado en posición ${start}${start + 1 !== end ? ` a ${this.#current?.end}` : ''}: ${type}${value ? ` "${value}"` : ''}`));
	}
}

export class MathParserError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'MathParserError';
	}
}

type UnaryOperation = (argument: number) => number;
const unaryOperations: Record<string, UnaryOperation> = {
	'+':    argument => argument,
	'-':    argument => (-argument),
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
export class MathEvaluator {
	#tree: MathNode;
	#functions: Record<string, ((x: number) => number)> = {
		sqrt: argument => Math.sqrt(argument),
		sin:  argument => Math.sin(argument),
		cos:  argument => Math.cos(argument),
		tan:  argument => Math.tan(argument),
		rad:  argument => argument * (Math.PI / 180),
		deg:  argument => argument * (180 / Math.PI),
	};

	constructor(tree: MathNode) {
		this.#tree = tree;
	}

	/**@returns {Number} El resultado de la operación del árbol.*/
	evaluate(): number {
		return this.#evaluateNode(this.#tree);
	}

	/**@returns El resultado de la operación del Token.*/
	#evaluateNode(node: MathNode): number {
		switch(node.type) {
		case NodeTypes.LITERAL:
			return node.value;

		case NodeTypes.UNARY:
			return this.#evaluateUnaryExpression(node.operator, node.argument);

		case NodeTypes.BINARY:
			return this.#evaluateBinaryExpression(node.operator, node.leftOperand, node.rightOperand);

		case NodeTypes.FUNCTION_CALL:
			return this.#evaluateFunctionCall(node.identifier, node.argument);

		default:
			fatal(new MathEvaluatorError(`Nodo inesperado: ${(node as MathNode)?.type}`));
		}
	}

	/**
	 * @description Evalúa una operación unaria
	 * @returns El resultado de la operación
	 */
	#evaluateUnaryExpression(operator: OperatorType, argument: MathNode): number {
		const evaluatedArgument = this.#evaluateNode(argument);
		return unaryOperations[operator](evaluatedArgument);
	}

	/**
	 * @description Evalúa una operación binaria.
	 * @returns El resultado de la operación.
	 */
	#evaluateBinaryExpression(operator: OperatorType, leftOperand: MathNode, rightOperand: MathNode): number {
		const evaluatedLeftOperand = this.#evaluateNode(leftOperand);
		const evaluatedRightOperand = this.#evaluateNode(rightOperand);
		return binaryOperations[operator](evaluatedLeftOperand, evaluatedRightOperand);
	}

	/**
	 * @description Evalúa una llamada de función.
	 * @returns El resultado de la operación.
	 */
	#evaluateFunctionCall(identifier: string, argument: MathNode): number {
		const evaluationFunction = this.#functions[identifier];

		if(!evaluationFunction)
			throw new MathEvaluatorError('Nigger hijo de puta');

		const evaluatedArgument = this.#evaluateNode(argument);

		return evaluationFunction(evaluatedArgument);
	}
}

export class MathEvaluatorError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'MathEvaluatorError';
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

	const calculator = new MathEvaluator(tree);
	const result = calculator.evaluate();

	return result;
}
