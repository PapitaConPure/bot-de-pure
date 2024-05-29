const { TokenKinds, translateTokenKind, Token, translateTokenKinds } = require('../../lexer/tokens.js');
const { BindingPowers } = require('../../ast/ast.js');
const { StatementKinds, ScopeAbortKinds } = require('../../ast/statements.js');
const { ExpressionKinds } = require('../../ast/expressions.js');

/**
 * @param {import('../parser.js').Parser} parser
 * @param {...import('../../lexer/tokens.js').TokenKind} closeTokenKinds
 * @returns {import('../../ast/statements.js').BlockBody}
 */
function parseBlock(parser, ...closeTokenKinds) {
	if(!closeTokenKinds.length)
		closeTokenKinds.push(TokenKinds.BLOCK_CLOSE);

	/**@type {Array<import('../../ast/statements').Statement>}*/
	const body = [];
	
	while(parser.hasTokens && !parser.current.isAny(...closeTokenKinds)) {
		if(!parser.current.isStatement)
			throw parser.TuberParserError(`Se intentó iniciar una nueva sentencia, pero en lugar de un indicador de sentencia se recibió: ${translateTokenKind(parser.current.kind)}, de valor: ${parser.current.value}`);

		body.push(parser.parseStatement());
	}

	const earlyAbortIndex = body.findIndex(stmt => ScopeAbortKinds.includes(stmt.kind));
	if(earlyAbortIndex !== -1)
		return body.slice(0, earlyAbortIndex + 1);

	return body;
}
/**
 * 
 * @param {import('../../ast/statements.js').BlockBody} body 
 * @returns {import('../../ast/statements.js').BlockStatement}
 */
function makeBlockStmt(body) {
	return {
		kind: StatementKinds.BLOCK,
		body,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').BlockStatement}
 */
function parseBlockStatement(parser) {
	const openToken = parser.advance();
	const body = parseBlock(parser);
	parser.expect(TokenKinds.BLOCK_CLOSE, `Se esperaba un cierre de bloque con Sentencia "FIN" en algún punto después de Sentencia "BLOQUE" en la línea ${openToken.line}, posición ${openToken.start}~${openToken.end}. Sin embargo, no se encontró ninguna`);
	return makeBlockStmt(body);
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').ConditionalStatement}
 */
function parseConditionalStatement(parser) {
	const openToken = parser.advance();
	const test = parser.parseExpression(BindingPowers.LOGICAL_DISJUNCTION);
	const consequent = makeBlockStmt(parseBlock(parser, TokenKinds.BLOCK_CLOSE, TokenKinds.ELSE, TokenKinds.ELSE_IF));

	parser.ensureAny(TokenKinds.BLOCK_CLOSE, TokenKinds.ELSE, TokenKinds.ELSE_IF)
	      .orFail(`Se esperaba un cierre de bloque en algún punto después de Sentencia "SI" en la línea ${openToken.line}, posición ${openToken.start}~${openToken.end}. Sin embargo, no se encontró ninguna`);

	if(parser.current.is(TokenKinds.BLOCK_CLOSE)) {
		parser.advance();
		return {
			kind: StatementKinds.CONDITIONAL,
			test,
			consequent,
		};
	}

	if(parser.current.is(TokenKinds.ELSE)) {
		const alternationToken = parser.advance();
		const alternate = makeBlockStmt(parseBlock(parser, TokenKinds.BLOCK_CLOSE));
		parser.expect(TokenKinds.BLOCK_CLOSE, `Se esperaba un cierre de bloque con Sentencia "FIN" en algún punto después de Sentencia "SINO" en la línea ${alternationToken.line}, posición ${alternationToken.start}~${alternationToken.end}. Sin embargo, no se encontró ninguna`);

		return {
			kind: StatementKinds.CONDITIONAL,
			test,
			consequent,
			alternate,
		}
	}
	
	const alternate = parseConditionalStatement(parser);

	return {
		kind: StatementKinds.CONDITIONAL,
		test,
		consequent,
		alternate,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').WhileStatement}
 */
function parseWhileLoopStatement(parser) {
	const openToken = parser.advance();
	const test = parser.parseExpression(BindingPowers.LOGICAL_DISJUNCTION);
	const body = makeBlockStmt(parseBlock(parser));
	parser.expect(TokenKinds.BLOCK_CLOSE, `Se esperaba un cierre de bloque con Sentencia "FIN" en algún punto después de Sentencia "MIENTRAS" en la línea ${openToken.line}, posición ${openToken.start}~${openToken.end}. Sin embargo, no se encontró ninguna`);

	return {
		kind: StatementKinds.WHILE,
		test,
		body,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').DoUntilStatement}
 */
function parseDoWhileLoopStatement(parser) {
	const openToken = parser.advance();
	const body = makeBlockStmt(parseBlock(parser, TokenKinds.UNTIL));
	parser.expect(TokenKinds.UNTIL, `Se esperaba un cierre de bloque con Sentencia "HASTA" en algún punto después de Sentencia "HACER" en la línea ${openToken.line}, posición ${openToken.start}~${openToken.end}. Sin embargo, no se encontró ninguna`);
	const test = parser.parseExpression(BindingPowers.LOGICAL_DISJUNCTION);

	return {
		kind: StatementKinds.DO_UNTIL,
		test,
		body,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').RepeatStatement}
 */
function parseRepeatLoopStatement(parser) {
	const openToken = parser.advance();
	const times = parser.parseExpression(BindingPowers.LOGICAL_DISJUNCTION);
	parser.expect(TokenKinds.TIMES);

	const body = makeBlockStmt(parseBlock(parser));
	parser.expect(TokenKinds.BLOCK_CLOSE, `Se esperaba un cierre de bloque con Sentencia "FIN" en algún punto después de Sentencia "REPETIR" en la línea ${openToken.line}, posición ${openToken.start}~${openToken.end}. Sin embargo, no se encontró ninguna`);

	return {
		kind: StatementKinds.REPEAT,
		times,
		body,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').ForEachStatement}
 */
function parseForEachLoopStatement(parser) {
	const openToken = parser.advance();
	const identifier = parser.expect(TokenKinds.IDENTIFIER, `Se esperaba un literal de identificador en Sentencia "PARA CADA", pero se recibió: ${parser.current.value}`);
	parser.expect(TokenKinds.IN);
	const container = parser.parseExpression(BindingPowers.COMMA);

	const body = makeBlockStmt(parseBlock(parser));
	parser.expect(TokenKinds.BLOCK_CLOSE, `Se esperaba un cierre de bloque con Sentencia "FIN" en algún punto después de Sentencia "PARA CADA" en la línea ${openToken.line}, posición ${openToken.start}~${openToken.end}. Sin embargo, no se encontró ninguna`);

	return {
		kind: StatementKinds.FOR_EACH,
		identifier: identifier.value,
		container,
		body,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').ForStatement}
 */
function parseForLoopStatement(parser) {
	const openToken = parser.advance();
	const kind = StatementKinds.FOR;
	const identifier = /**@type {String}*/(parser.expect(TokenKinds.IDENTIFIER, `Se esperaba un literal de identificador en Sentencia "PARA", pero se recibió: ${parser.current.value}`).value);
	let full = false;

	if(parser.current.is(TokenKinds.FROM)) {
		parser.advance();
		const from = parser.parseExpression(BindingPowers.COMMA);
		parser.expect(TokenKinds.UNTIL, `Se esperaba operador "hasta" en sentencia "PARA" corta, pero se recibió: ${parser.current.value}`);
		const to = parser.parseExpression(BindingPowers.COMMA);
		
		const body = makeBlockStmt(parseBlock(parser));
		parser.expect(TokenKinds.BLOCK_CLOSE, `Se esperaba un cierre de bloque con Sentencia "FIN" en algún punto después de Sentencia "PARA" en la línea ${openToken.line}, posición ${openToken.start}~${openToken.end}. Sin embargo, no se encontró ninguna`);
		
		return {
			kind,
			identifier,
			body,
			full,
			from,
			to,
		};
	}

	full = true;
	parser.expect(TokenKinds.ASSIGNMENT, `Se esperaba el operador "con" o "desde" luego de identificador en Sentencia "PARA", pero se recibió: ${parser.current.value}`);
	const start = parser.parseExpression(BindingPowers.COMMA);
	parser.expect(TokenKinds.WHILE, `Se esperaba "MIENTRAS" en sentencia "PARA" larga, pero se recibió: ${parser.current.value}`);
	const test = parser.parseExpression(BindingPowers.LOGICAL_DISJUNCTION);
	const step = parser.parseStatement();

	const body = makeBlockStmt(parseBlock(parser));
	parser.expect(TokenKinds.BLOCK_CLOSE, `Se esperaba un cierre de bloque con Sentencia "FIN" en algún punto después de Sentencia "PARA" en la línea ${openToken.line}, posición ${openToken.start}~${openToken.end}. Sin embargo, no se encontró ninguna`);

	return {
		kind,
		identifier,
		body,
		full,
		start,
		test,
		step,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').ExpressionStatement}
 */
function parseExpressionStatement(parser) {
	parser.advance();
	const expression = parser.parseExpression(BindingPowers.COMMA);

	return {
		kind: StatementKinds.EXPRESSION,
		expression,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').ReadStatement}
 */
function parseReadStatement(parser) {
	parser.advance();
	
	const dataKind = parser.expectAny(TokenKinds.NUMBER, TokenKinds.TEXT, TokenKinds.BOOLEAN, TokenKinds.LIST, TokenKinds.EMBED)
		.orFail(`Se esperaba un tipo de entrada antes de expresión receptora en Sentencia "LEER", pero se recibió: ${parser.current.translated}`);

	let optional = false;
	if(parser.hasTokens && parser.current.is(TokenKinds.OPTIONAL)) {
		optional = true;
		parser.advance();
	}
	
	const receptor = parser.parseExpression(BindingPowers.COMMA);

	/**@type {import('../../ast/expressions.js').Expression}*/
	let fallback = null;

	if(!parser.current.is(TokenKinds.ASSIGNMENT)) {
		if(parser.hasTokens && !parser.current.isStatement)
			throw parser.TuberParserError(`Se esperaba "con" y una expresión (o palabra clave "opcional") luego de identificador en Sentencia "LEER". Sin embargo, se recibió: ${parser.current.translated}`);

		return {
			kind: StatementKinds.READ,
			dataKind,
			receptor,
			fallback,
			optional,
		};
	}

	parser.advance(); //Avanzar "con"
	fallback = parser.parseExpression(BindingPowers.COMMA);

	if(parser.hasTokens && parser.current.is(TokenKinds.OPTIONAL)) {
		optional = true;
		parser.advance();
	}

	return {
		kind: StatementKinds.READ,
		dataKind,
		receptor,
		fallback,
		optional,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').DeclarationStatement}
 */
function parseDeclarationStatement(parser) {
	parser.advance();
	
	let dataKind = null;
	if(parser.current.isAny(TokenKinds.NUMBER, TokenKinds.TEXT, TokenKinds.BOOLEAN, TokenKinds.LIST, TokenKinds.REGISTRY, TokenKinds.EMBED))
		dataKind = parser.advance();

	const declaration = [ parser.expect(TokenKinds.IDENTIFIER, 'Se esperaba un identificador luego del tipo de dato en Sentencia "CREAR"').value ];

	if(parser.current.is(TokenKinds.COMMA)) {
		while(parser.current.is(TokenKinds.COMMA)) {
			parser.advance();

			if(!parser.hasTokens || parser.current.isStatement)
				break;

			declaration.push(parser.expect(TokenKinds.IDENTIFIER, 'Se esperaba un identificador luego del tipo de dato en Sentencia "CREAR"').value);
		}

		return {
			kind: StatementKinds.DECLARATION,
			declarations: declaration,
			dataKind: dataKind,
		};
	}

	return {
		kind: StatementKinds.DECLARATION,
		declarations: declaration,
		dataKind: dataKind,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').SaveStatement}
 */
function parseSaveStatement(parser) {
	parser.advance();
	const identifier = /**@type {String}*/(parser.expect(TokenKinds.IDENTIFIER, `Se esperaba un literal de identificador en Sentencia "GUARDAR", pero se recibió: ${parser.current.value}`).value);
	
	parser.expect(TokenKinds.ASSIGNMENT, `Se esperaba "con" y una expresión luego de identificador en Sentencia "GUARDAR", pero se recibió: ${parser.current.value}`);
	const expression = parser.parseExpression(BindingPowers.COMMA);

	return {
		kind: StatementKinds.SAVE,
		identifier,
		expression,
	}
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').AssignmentStatement}
 */
function parseAssignmentStatement(parser) {
	const operator = parser.advance();
	const receptor = parser.parseExpression(BindingPowers.COMMA);

	if(receptor.kind !== ExpressionKinds.IDENTIFIER && receptor.kind !== ExpressionKinds.ARROW)
		throw 'Se esperaba un identificador como receptor en sentencia de asignación';

	if(operator.isAny(TokenKinds.ADD, TokenKinds.SUBTRACT) && !parser.current.is(TokenKinds.ASSIGNMENT)) {
		return ({
			kind: StatementKinds.ASSIGNMENT,
			operator,
			receptor,
			reception: null,
		});
	}

	parser.expect(TokenKinds.ASSIGNMENT, `Se esperaba "con" y una expresión luego de identificador en ${translateTokenKind(operator.kind)}, pero se recibió: ${parser.current.value}`);
	const reception = parser.parseExpression(BindingPowers.COMMA);

	return ({
		kind: StatementKinds.ASSIGNMENT,
		operator,
		receptor,
		reception,
	});
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').ReturnStatement}
 */
function parseReturnStatement(parser) {
	parser.advance();
	const expression = parser.parseExpression(BindingPowers.COMMA);

	return {
		kind: StatementKinds.RETURN,
		expression,
	}
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').EndStatement}
 */
function parseEndStatement(parser) {
	parser.advance();

	return {
		kind: StatementKinds.END,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').StopStatement}
 */
function parseStopStatement(parser) {
	parser.advance();
	parser.expect(TokenKinds.ASSIGNMENT);
	const stopMessage = parser.parseExpression(BindingPowers.COMMA);
	parser.expect(TokenKinds.IF);
	const condition = parser.parseExpression(BindingPowers.COMMA);

	return {
		kind: StatementKinds.STOP,
		stopMessage,
		condition,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').SendStatement}
 */
function parseSendStatement(parser) {
	parser.advance();
	const expression = parser.parseExpression(BindingPowers.COMMA);

	return {
		kind: StatementKinds.SEND,
		expression,
	};
}

module.exports = {
	parseBlock,
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
};
