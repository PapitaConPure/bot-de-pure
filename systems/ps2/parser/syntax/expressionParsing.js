const { TokenKinds } = require('../../lexer/tokens');
const { BindingPowers, Associativities } = require('../../ast/ast');
const { ExpressionKinds } = require('../../ast/expressions');

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/expressions').Expression}
 */
function parsePrimaryExpression(parser) {
	switch(parser.current.kind) {
	case TokenKinds.NUMBER:
		return /**@type {import('../../ast/expressions').NumberLiteralExpression}*/({
			kind: ExpressionKinds.NUMBER_LITERAL,
			value: +parser.advance().value,
		});

	case TokenKinds.STRING:
		return /**@type {import('../../ast/expressions').TextLiteralExpression}*/({
			kind: ExpressionKinds.TEXT_LITERAL,
			value: parser.advance().value,
		});

	case TokenKinds.BOOLEAN:
		return /**@type {import('../../ast/expressions').BooleanLiteralExpression}*/({
			kind: ExpressionKinds.BOOLEAN_LITERAL,
			value: parser.advance().value,
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
		elements.push(parser.parseExpression(BindingPowers.COMMA));

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

			elements.push(parser.parseExpression(BindingPowers.COMMA));
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
	const key = parser.expectAny(TokenKinds.NUMBER, TokenKinds.STRING, TokenKinds.IDENTIFIER).orFail(`Se esperaba un identificador, una cadena o un número en lado izquierdo de expresión literal de miembro para expresión literal de glosario. Sin embargo, se recibió: ${parser.current.value}`);
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
 * @param {import('../../ast/expressions').Expression} left
 * @param {import('../../ast/ast').BindingPower} bp
 * @param {import('../../ast/ast').Associativity} _ass
 * @returns {import('../../ast/expressions').ArrowExpression}
 */
function parseArrowExpression(parser, left, bp, _ass) {
	parser.advance();
	
	let computed = false;
	let key;

	if(parser.current.is(TokenKinds.PAREN_OPEN)) {
		key = parseGroupExpression(parser);
		computed = true;
	} else
		key = parsePrimaryExpression(parser);

	return {
		kind: ExpressionKinds.ARROW,
		holder: left,
		key,
		computed,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @param {import('../../ast/expressions').Expression} left
 * @param {import('../../ast/ast').BindingPower} bp
 * @param {import('../../ast/ast').Associativity} ass
 * @returns {import('../../ast/expressions').CallExpression}
 */
function parseCallExpression(parser, left, bp, ass) {
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

	parser.expect(TokenKinds.PAREN_CLOSE);

	return {
		kind: ExpressionKinds.CALL,
		fn: left,
		args,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/expressions').Expression}
 */
function parseGroupExpression(parser) {
	parser.advance();
	const expression = parser.parseExpression(BindingPowers.DEFAULT);
	parser.expect(TokenKinds.PAREN_CLOSE);
	return expression;
}

module.exports = {
	parsePrimaryExpression,
	parseUnaryExpression,
	parseBinaryExpression,
	parseArrowExpression,
	parseCallExpression,
	parseGroupExpression,
};
