const { toLowerCaseNormalized } = require('../../../../func');
const { TokenKinds } = require('../../lexer/tokens');
const { BindingPowers } = require('../../ast/ast');
const { StatementKinds } = require('../../ast/statements');
const { ExpressionKinds } = require('../../ast/expressions');
const { parseBlock } = require('./statementParsing');

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/expressions').Expression}
 */
function parsePrimaryExpression(parser) {
	switch(parser.current.kind) {
	case TokenKinds.LIT_NUMBER:
		return /**@type {import('../../ast/expressions').NumberLiteralExpression}*/({
			kind: ExpressionKinds.NUMBER_LITERAL,
			value: +parser.advance().value,
		});

	case TokenKinds.LIT_TEXT:
		return /**@type {import('../../ast/expressions').TextLiteralExpression}*/({
			kind: ExpressionKinds.TEXT_LITERAL,
			value: parser.advance().value,
		});

	case TokenKinds.LIT_BOOLEAN:
		return /**@type {import('../../ast/expressions').BooleanLiteralExpression}*/({
			kind: ExpressionKinds.BOOLEAN_LITERAL,
			value: toLowerCaseNormalized(parser.advance().value) === 'verdadero' ? true : false,
		});

	case TokenKinds.IDENTIFIER:
		return /**@type {import('../../ast/expressions').Identifier}*/({
			kind: ExpressionKinds.IDENTIFIER,
			name: parser.advance().value,
		});

	case TokenKinds.LIST:
		parser.advance();

		return /**@type {import('../../ast/expressions').ListLiteralExpression}*/({
			kind: ExpressionKinds.LIST_LITERAL,
			elements: parseListElements(parser),
		});

	case TokenKinds.REGISTRY:
		parser.advance();

		return /**@type {import('../../ast/expressions').RegistryLiteralExpression}*/({
			kind: ExpressionKinds.REGISTRY_LITERAL,
			entries: parseRegistryMembers(parser),
		});

	case TokenKinds.NADA:
		return /**@type {import('../../ast/expressions').NadaLiteralExpression}*/({
			kind: ExpressionKinds.NADA_LITERAL,
			value: parser.advance().value,
		});

	default:
		throw 'No se puede crear una expresión para: ' + parser.current.kind;
	}
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {Boolean}
 */
function canFollowUp(parser) {
	return parser.hasTokens
		&& !parser.current.isStatement
		&& !parser.current.isAny(
			TokenKinds.PAREN_CLOSE,
			TokenKinds.OPTIONAL,
		);
}

/**
 * @param {import('../parser.js').Parser} parser
 * @param {import('../../ast/expressions').Expression} expr
 * @returns {String}
 */
function makeStoredKey(parser, expr) {
	let value;

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
		throw parser.TuberParserError(`Se esperaba un identificador, número, texto o dupla para analizar una clave de miembro de contenedor`);
	}

	return value;
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {Array<import('../../ast/expressions').Expression>}
 */
function parseListElements(parser) {
	const elements = [];
	
	//Si se reciben comas inmediatamente al inicio, se trata de una omisión de valores iniciales, que significa que se debe colocar tantos "Nada" como comas haya en el principio
	while(parser.hasTokens && parser.current.is(TokenKinds.COMMA)) {
		parser.advance();
		elements.push(/**@type {import('../../ast/expressions').NadaLiteralExpression}*/({
			kind: ExpressionKinds.NADA_LITERAL,
			value: null,
		}));
	}

	if(canFollowUp(parser)) {
		elements.push(parser.parseExpression(BindingPowers.ASSIGNMENT));

		while(parser.hasTokens && parser.current.is(TokenKinds.COMMA)) {
			parser.advance();

			//Si se recibe un indicador de sentencia después de la coma, se trata de una coma suelta, así que la ignoramos
			if(!canFollowUp(parser))
				break;

			//Si se recibe otra coma inmediatamente, se trata de una omisión de valor, que significa que se debe colocar "Nada" en su lugar
			if(parser.current.is(TokenKinds.COMMA)) {
				elements.push(/**@type {import('../../ast/expressions').NadaLiteralExpression}*/({
					kind: ExpressionKinds.NADA_LITERAL,
					value: null,
				}));
				continue;
			}

			elements.push(parser.parseExpression(BindingPowers.ASSIGNMENT));
		}
	}

	return elements;
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {Map<String, import('../../ast/expressions').Expression>}
 */
function parseRegistryMembers(parser) {
	const members = new Map();

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

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {{ key: String, value: import('../../ast/expressions').Expression }}
 */
function parseRegistryMember(parser) {
	const key = parser.expectAny(TokenKinds.LIT_NUMBER, TokenKinds.LIT_TEXT, TokenKinds.IDENTIFIER).orFail(`Se esperaba un identificador, una cadena o un número en lado izquierdo de expresión literal de miembro para expresión literal de glosario. Sin embargo, se recibió: ${parser.current.value}`);
	parser.expect(TokenKinds.COLON);
	const value = parser.parseExpression(BindingPowers.COMMA);

	return {
		key: `${key.value}`,
		value,
	}
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/expressions').UnaryExpression}
 */
function parseUnaryExpression(parser) {
	const operator = parser.advance();
	const argument = parser.parseExpression(BindingPowers.UNARY);

	return {
		kind: ExpressionKinds.UNARY,
		operator,
		argument,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @param {import('../../ast/expressions').Expression} left
 * @param {import('../../ast/ast').BindingPower} bp
 * @param {import('../../ast/ast').Associativity} ass
 * @returns {import('../../ast/expressions').BinaryExpression}
 */
function parseBinaryExpression(parser, left, bp, ass) {
	const operator = parser.advance();
	const right = parser.parseExpression(bp, ass);

	return {
		kind: ExpressionKinds.BINARY,
		operator,
		left,
		right,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/expressions').CastExpression}
 */
function parseCastExpression(parser) {
	const as = parser.advance();
	const argument = parser.parseExpression(BindingPowers.UNARY);
	
	return {
		kind: ExpressionKinds.CAST,
		argument,
		as,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @param {import('../../ast/expressions').Expression} left
 * @param {import('../../ast/ast').BindingPower} _bp
 * @param {import('../../ast/ast').Associativity} _ass
 * @returns {import('../../ast/expressions').ArrowExpression}
 */
function parseArrowExpression(parser, left, _bp, _ass) {
	parser.advance();

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
		};
	}

	const primaryExpr = parsePrimaryExpression(parser);
	const key = makeStoredKey(parser, primaryExpr);
	const computed = false;

	return {
		kind,
		holder,
		key,
		computed,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @param {import('../../ast/expressions').Expression} left
 * @param {import('../../ast/ast').BindingPower} _bp
 * @param {import('../../ast/ast').Associativity} _ass
 * @returns {import('../../ast/expressions').CallExpression}
 */
function parseCallExpression(parser, left, _bp, _ass) {
	parser.advance();

	const args = [];

	if(!parser.current.is(TokenKinds.PAREN_CLOSE)) {
		args.push(parser.parseExpression(BindingPowers.ASSIGNMENT));

		while(parser.hasTokens && parser.current.is(TokenKinds.COMMA)) {
			parser.advance();

			if(parser.current.is(TokenKinds.COMMA))
				throw parser.TuberParserError('No se pueden tener argumentos vacíos en una expresión de llamado');

			//Si se recibe un indicador de sentencia después de la coma, se trata de una coma suelta, así que la ignoramos
			if(canFollowUp(parser))
				args.push(parser.parseExpression(BindingPowers.ASSIGNMENT));
		}
	}

	parser.expect(TokenKinds.PAREN_CLOSE);

	return {
		kind: ExpressionKinds.CALL,
		fn: left,
		args,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @param {import('../../ast/expressions').Expression} expression
 * @returns {import('../../ast/expressions').ArgumentExpression}
 */
function parseArgument(parser, expression) {
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
		};
	}

	return {
		kind: ExpressionKinds.ARGUMENT,
		optional: false,
		identifier,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/expressions').FunctionExpression}
 */
function parseFunctionExpression(parser) {
	const fnToken = parser.advance();

	parser.expect(TokenKinds.PAREN_OPEN, `Se esperaba una apertura de paréntesis inmediatamente luego de indicación de expresión de Función, pero se recibió: ${parser.current.value}`);

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

	parser.expect(TokenKinds.PAREN_CLOSE, `Se esperaba un cierre de paréntesis luego de los parámetros de Función para proceder al cuerpo de la Función, pero se recibió: ${parser.current.value}`);

	const body = {
		kind: StatementKinds.BLOCK,
		body: parseBlock(parser),
	};

	parser.expect(TokenKinds.BLOCK_CLOSE,
		`Se esperaba a que eventualmente se cerrara el bloque de expresión de Función en la línea: ${fnToken.line}, posición: ${fnToken.start}~${fnToken.end}. Sin embargo, eso nunca ocurrió`);

	return {
		kind: ExpressionKinds.FUNCTION,
		expression: false,
		args,
		body,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @param {import('../../ast/expressions').Expression} left
 * @param {import('../../ast/ast').BindingPower} bp
 * @param {import('../../ast/ast').Associativity} ass
 * @returns {import('../../ast/expressions').SequenceExpression}
 */
function parseSequenceExpression(parser, left, bp, ass) {
	const expressions = [ left ];

	do {
		parser.advance();

		if(!parser.hasTokens || parser.current.is(TokenKinds.COMMA))
			throw parser.TuberParserError('Se esperaba una expresión después del operador de coma en expresión de secuencia');

		//Ignorar comas sueltas
		if(canFollowUp(parser))
			expressions.push(parser.parseExpression(BindingPowers.ASSIGNMENT));
	} while(parser.hasTokens && parser.current.is(TokenKinds.COMMA))

	return {
		kind: ExpressionKinds.SEQUENCE,
		expressions,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @param {import('../../ast/expressions').Expression} left
 * @param {import('../../ast/ast').BindingPower} bp
 * @param {import('../../ast/ast').Associativity} ass
 * @returns {import('../../ast/expressions').LambdaExpression}
 */
function parseLambdaExpression(parser, left, bp, ass) {
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
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/expressions').Expression}
 */
function parseGroupExpression(parser) {
	parser.advance();
	
	if(parser.current.is(TokenKinds.PAREN_CLOSE)) {
		parser.advance();
		return {
			kind: ExpressionKinds.SEQUENCE,
			expressions: [],
		};
	}
	
	const expression = parser.parseExpression(BindingPowers.DEFAULT);
	parser.expect(TokenKinds.PAREN_CLOSE);
	return expression;
}

module.exports = {
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
};