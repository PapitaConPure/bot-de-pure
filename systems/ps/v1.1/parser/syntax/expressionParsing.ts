import { toLowerCaseNormalized } from '../../util/utils';
import { TokenKinds } from '../../lexer/tokens';
import { Associativity, BindingPower, BindingPowers } from '../../ast';
import { StatementKinds } from '../../ast/statements';
import { ArgumentExpression, ArrowExpression, BinaryExpression, CallExpression, CastExpression, ConditionalExpression, Expression, ExpressionKinds, FunctionExpression, LambdaExpression, SequenceExpression, UnaryExpression } from '../../ast/expressions';
import { makeMetadata } from '../../ast/metadata';
import { parseBlockBody } from './statementParsing';
import { Parser } from '..';

export function parsePrimaryExpression(parser: Parser): Expression {
	const literal = parser.advance();

	const metadata = {
		line: literal.line,
		column: literal.column,
		start: literal.start,
		end: literal.end,
	};

	switch(literal.kind) {
	case TokenKinds.LIT_NUMBER:
		return {
			kind: ExpressionKinds.NUMBER_LITERAL,
			value: +literal.value,
			...metadata,
		};

	case TokenKinds.LIT_TEXT:
		return {
			kind: ExpressionKinds.TEXT_LITERAL,
			value: literal.value as string,
			...metadata,
		};

	case TokenKinds.LIT_BOOLEAN:
		return {
			kind: ExpressionKinds.BOOLEAN_LITERAL,
			value: (toLowerCaseNormalized(literal.value as string) === 'verdadero' ? true : false),
			...metadata,
		};

	case TokenKinds.IDENTIFIER:
		return {
			kind: ExpressionKinds.IDENTIFIER,
			name: literal.value as string,
			...metadata,
		};

	case TokenKinds.LIST:{
		const elements = parseListElements(parser);
		const end = elements.length
			? elements[elements.length - 1].end
			: literal.end;

		return {
			kind: ExpressionKinds.LIST_LITERAL,
			elements,
			...metadata,
			end,
		};
	}

	case TokenKinds.REGISTRY: {
		const entries = parseRegistryMembers(parser);
		return {
			kind: ExpressionKinds.REGISTRY_LITERAL,
			entries,
			...metadata,
		};
	}

	case TokenKinds.EMBED:
		return {
			kind: ExpressionKinds.EMBED_LITERAL,
			...metadata,
		};

	case TokenKinds.NADA:
		return {
			kind: ExpressionKinds.NADA_LITERAL,
			value: literal.value as null | undefined,
			...metadata,
		};

	default:
		throw new TypeError(`No se puede crear una expresión para: ${literal.translated ?? literal.kind}`);
	}
}

export function canFollowUp(parser: Parser): boolean {
	return parser.hasTokens
		&& !parser.current.isStatement
		&& !parser.current.isAny(
			TokenKinds.PAREN_CLOSE,
			TokenKinds.OPTIONAL,
		);
}

export function makeStoredKey(parser: Parser, expr: Expression): string {
	let value: string;

	switch(expr.kind) {
	case ExpressionKinds.IDENTIFIER:
		value = expr.name;
		break;

	case ExpressionKinds.NUMBER_LITERAL:
	case ExpressionKinds.TEXT_LITERAL:
	case ExpressionKinds.BOOLEAN_LITERAL:
		value = `${expr.value}`;
		break;

	default:
		throw parser.TuberParserError(`Se esperaba un identificador, número, texto o lógico para analizar una clave de miembro de contenedor`);
	}

	return value;
}

export function parseListElements(parser: Parser): Expression[] {
	const elements: Expression[] = [];

	//Si se reciben comas inmediatamente al inicio, se trata de una omisión de valores iniciales, que significa que se debe colocar tantos "Nada" como comas haya en el principio
	while(parser.hasTokens && parser.current.is(TokenKinds.COMMA)) {
		const comma = parser.advance();
		elements.push({
			kind: ExpressionKinds.NADA_LITERAL,
			value: null,
			...makeMetadata(comma),
		});
	}

	if(canFollowUp(parser)) {
		elements.push(parser.parseExpression(BindingPowers.ASSIGNMENT));

		while(parser.hasTokens && parser.current.is(TokenKinds.COMMA)) {
			const comma = parser.advance();

			//Si se recibe un indicador de sentencia después de la coma, se trata de una coma suelta, así que la ignoramos
			if(!canFollowUp(parser))
				break;

			//Si se recibe otra coma inmediatamente, se trata de una omisión de valor, que significa que se debe colocar "Nada" en su lugar
			if(parser.current.is(TokenKinds.COMMA)) {
				elements.push(({
					kind: ExpressionKinds.NADA_LITERAL,
					value: null,
					...makeMetadata(comma),
				}));
				continue;
			}

			elements.push(parser.parseExpression(BindingPowers.ASSIGNMENT));
		}
	}

	return elements;
}

export function parseRegistryMembers(parser: Parser): Map<string, Expression> {
	const members = new Map<string, Expression>();

	if(canFollowUp(parser)) {
		const { key, value } = parseRegistryMember(parser);
		members.set(key, value);

		while(parser.hasTokens && parser.current.is(TokenKinds.COMMA)) {
			parser.advance();

			if(canFollowUp(parser)) {
				const { key, value } = parseRegistryMember(parser);
				members.set(key, value);
			}
		}
	}

	return members;
}

interface RawRegistryMember { key: string; value: Expression; }

export function parseRegistryMember(parser: Parser): RawRegistryMember {
	const key = parser.expectAny(TokenKinds.LIT_NUMBER, TokenKinds.LIT_TEXT, TokenKinds.IDENTIFIER).orFail(`Se esperaba un identificador, una cadena o un número en lado izquierdo de expresión literal de miembro para expresión literal de glosario. Sin embargo, se recibió: ${parser.current.translated}`);
	parser.expect(TokenKinds.COLON);
	const value = parser.parseExpression(BindingPowers.COMMA);

	return {
		key: `${key.value}`,
		value,
	};
}

export function parseUnaryExpression(parser: Parser): UnaryExpression {
	const operator = parser.advance();
	const argument = parser.parseExpression(BindingPowers.UNARY);

	return {
		kind: ExpressionKinds.UNARY,
		operator,
		argument,
		...makeMetadata(operator, argument),
	};
}

export function parseBinaryExpression(parser: Parser, left: Expression, bp: BindingPower, ass: Associativity): BinaryExpression {
	const operator = parser.advance();
	const right = parser.parseExpression(bp, ass);

	return {
		kind: ExpressionKinds.BINARY,
		line: operator.line,
		column: operator.column,
		start: left.start,
		end: right.end,
		operator,
		left,
		right,
	};
}

export function parseConditionalExpression(parser: Parser, left: Expression, bp: BindingPower, ass: Associativity): ConditionalExpression {
	const operator = parser.advance();
	const consequent = parser.parseExpression(bp, ass);
	parser.expect(TokenKinds.COLON, `Se esperaba el operador \`:\` luego del operando medio en expresión ternaria. Sin embargo, se recibió: ${parser.current.translated}`);
	const alternate = parser.parseExpression(bp, ass);

	return {
		kind: ExpressionKinds.CONDITIONAL,
		line: operator.line,
		column: operator.column,
		start: left.start,
		end: alternate.end,
		test: left,
		consequent,
		alternate,
	};
}

export function parseCastExpression(parser: Parser): CastExpression {
	const as = parser.advance();
	const argument = parser.parseExpression(BindingPowers.UNARY);

	return {
		kind: ExpressionKinds.CAST,
		argument,
		as,
		...makeMetadata(as, argument),
	};
}

export function parseArrowExpression(parser: Parser, left: Expression, _bp: BindingPower, _ass: Associativity): ArrowExpression {
	parser.advance(); //"->"

	const kind = ExpressionKinds.ARROW;
	const holder = left;

	if(parser.current.is(TokenKinds.PAREN_OPEN)) {
		const key = parseGroupExpression(parser);
		const computed = true;

		return {
			kind,
			holder,
			key,
			computed,
			...makeMetadata(holder, key),
		};
	}

	const primaryExpr = parser.parseExpression(BindingPowers.PRIMARY);
	const key = makeStoredKey(parser, primaryExpr);
	const computed = false;

	return {
		kind,
		line: holder.line,
		column: holder.column,
		start: holder.start,
		end: primaryExpr.end,
		holder,
		key,
		computed,
	};
}

export function parseCallExpression(parser: Parser, left: Expression, _bp: BindingPower, _ass: Associativity): CallExpression {
	parser.advance();

	const args = [];

	if(!parser.current.is(TokenKinds.PAREN_CLOSE)) {
		args.push(parser.parseExpression(BindingPowers.COMMA));

		while(parser.hasTokens && parser.current.is(TokenKinds.COMMA)) {
			parser.advance();

			if(parser.current.is(TokenKinds.COMMA))
				throw parser.TuberParserError('No se pueden tener argumentos vacíos en una expresión de llamado');

			//Si se recibe un indicador de sentencia después de la coma, se trata de una coma suelta, así que la ignoramos
			if(canFollowUp(parser))
				args.push(parser.parseExpression(BindingPowers.COMMA));
		}
	}

	const closingParen = parser.expect(TokenKinds.PAREN_CLOSE);

	return {
		kind: ExpressionKinds.CALL,
		fn: left,
		args,
		...makeMetadata(left, closingParen),
	};
}

export function parseArgument(parser: Parser, expression: Expression): ArgumentExpression {
	if(expression.kind !== ExpressionKinds.IDENTIFIER)
		throw parser.TuberParserError('Se esperaba un identificador como argumento en expresión de Función');

	const identifier = expression.name;

	if(parser.current.is(TokenKinds.COLON)) {
		parser.advance();
		const fallback = parser.parseExpression(BindingPowers.ASSIGNMENT);
		return {
			kind: ExpressionKinds.ARGUMENT,
			optional: true,
			identifier,
			fallback,
			...makeMetadata(expression, fallback),
		};
	}

	return {
		kind: ExpressionKinds.ARGUMENT,
		optional: false,
		identifier,
		...makeMetadata(expression),
	};
}

export function parseFunctionExpression(parser: Parser): FunctionExpression {
	const fnToken = parser.advance();

	parser.expect(TokenKinds.PAREN_OPEN, `Se esperaba una apertura de paréntesis inmediatamente luego de indicación de expresión de Función, pero se recibió: ${parser.current.translated}`);

	const args = [];

	if(!parser.current.is(TokenKinds.PAREN_CLOSE)) {
		args.push(parseArgument(parser, parser.parseExpression(BindingPowers.ASSIGNMENT)));

		while(parser.hasTokens && parser.current.is(TokenKinds.COMMA)) {
			parser.advance();

			if(parser.current.is(TokenKinds.COMMA))
				throw parser.TuberParserError('No se pueden tener argumentos vacíos en una expresión de Función');

			//Si se recibe un indicador de sentencia después de la coma, se trata de una coma suelta, así que la ignoramos
			if(canFollowUp(parser))
				args.push(parseArgument(parser, parser.parseExpression(BindingPowers.ASSIGNMENT)));
		}
	}

	parser.expect(TokenKinds.PAREN_CLOSE, `Se esperaba un cierre de paréntesis luego de los parámetros de Función para proceder al cuerpo de la Función, pero se recibió: ${parser.current.translated}`);

	const blockStart = parser.current;
	const blockBody = parseBlockBody(parser);
	const blockEnd = parser.expect(TokenKinds.BLOCK_CLOSE,
		`Se esperaba a que eventualmente se cerrara el bloque de expresión de Función en la línea: ${fnToken.line}, posición: ${fnToken.start}~${fnToken.end}. Sin embargo, eso nunca ocurrió`);

	const body = {
		kind: StatementKinds.BLOCK,
		body: blockBody,
		...makeMetadata(blockStart, blockEnd),
	};

	return {
		kind: ExpressionKinds.FUNCTION,
		expression: false,
		args,
		body,
		...makeMetadata(fnToken, blockEnd),
	};
}

export function parseSequenceExpression(parser: Parser, left: Expression, _bp: BindingPower, _ass: Associativity): SequenceExpression {
	const expressions = [ left ];

	do {
		parser.advance();

		if(!parser.hasTokens || parser.current.is(TokenKinds.COMMA))
			throw parser.TuberParserError('Se esperaba una expresión después del operador de coma en expresión de secuencia');

		//Ignorar comas sueltas
		if(canFollowUp(parser))
			expressions.push(parser.parseExpression(BindingPowers.ASSIGNMENT));
	} while(parser.hasTokens && parser.current.is(TokenKinds.COMMA));

	return {
		kind: ExpressionKinds.SEQUENCE,
		expressions,
		...makeMetadata(left, expressions[expressions.length - 1]),
	};
}

export function parseLambdaExpression(parser: Parser, left: Expression, _bp: BindingPower, _ass: Associativity): LambdaExpression {
	parser.advance();

	if(left.kind !== ExpressionKinds.SEQUENCE && left.kind !== ExpressionKinds.IDENTIFIER)
		throw parser.TuberParserError('Se esperaba una expresión de secuencia o un identificador antes del operador "tal que" en expresión lambda');

	const args = (left.kind === ExpressionKinds.SEQUENCE)
		? left.expressions.map(expression => parseArgument(parser, expression))
		: [ parseArgument(parser, left) ];

	const body = parser.parseExpression(BindingPowers.DEFAULT);
	return {
		kind: ExpressionKinds.FUNCTION,
		expression: true,
		args,
		body,
		...makeMetadata(left, body),
	};
}

export function parseGroupExpression(parser: Parser): Expression {
	const parenOpen = parser.advance();

	if(parser.current.is(TokenKinds.PAREN_CLOSE)) {
		const parenClose = parser.advance();
		return {
			kind: ExpressionKinds.SEQUENCE,
			expressions: [],
			...makeMetadata(parenOpen, parenClose),
		};
	}

	const expression = parser.parseExpression(BindingPowers.DEFAULT);
	const parenClose = parser.expect(TokenKinds.PAREN_CLOSE);
	expression.start = parenOpen.start;
	expression.end = parenClose.end;
	return expression;
}
