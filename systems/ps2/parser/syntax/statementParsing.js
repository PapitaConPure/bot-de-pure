const { TokenKinds, translateTokenKind, Token, translateTokenKinds } = require('../../lexer/tokens.js');
const { BindingPowers } = require('../../ast/ast.js');
const { StatementKinds, ScopeAbortKinds } = require('../../ast/statements.js');
const { ExpressionKinds } = require('../../ast/expressions.js');

/**
 * @param {import('../parser.js').Parser} parser
 * @param {...import('../../lexer/tokens.js').TokenKind} closeTokenKinds
 * @returns {import('../../ast/statements.js').BlockBody}
 */
function parseBlockBody(parser, ...closeTokenKinds) {
	if(!closeTokenKinds.length)
		closeTokenKinds.push(TokenKinds.BLOCK_CLOSE);

	/**@type {Array<import('../../ast/statements').Statement>}*/
	const body = [];
	
	while(parser.hasTokens && !parser.current.isAny(...closeTokenKinds)) {
		if(!parser.current.isStatement)
			throw parser.TuberParserError(`Se intentó iniciar una nueva sentencia, pero en lugar de un indicador de sentencia se recibió: *${translateTokenKind(parser.current.kind)}*`);

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
 * @param {Token} startToken 
 * @param {Token} [endToken]
 * @returns {import('../../ast/statements.js').BlockStatement}
 */
function makeBlockStmt(body, startToken, endToken = null) {
	endToken ??= startToken;
	return {
		kind: StatementKinds.BLOCK,
		line: startToken.line,
		start: startToken.start,
		end: endToken.end,
		body,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').BlockStatement}
 */
function parseBlockStatement(parser) {
	const openToken = parser.advance();
	const body = parseBlockBody(parser);
	const closeToken = parser.expect(TokenKinds.BLOCK_CLOSE, `Se esperaba un cierre de bloque con Sentencia \`FIN\` en algún punto después del indicador \`BLOQUE\` en la línea **${openToken.line}**, columnas **${openToken.start}** a **${openToken.end}**. Sin embargo, no se encontró ninguna`);
	return makeBlockStmt(body, openToken, closeToken);
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').ConditionalStatement}
 */
function parseConditionalStatement(parser) {
	const openToken = parser.advance();
	const test = parser.parseExpression(BindingPowers.ASSIGNMENT);
	const consequentBlock = parseBlockBody(parser, TokenKinds.BLOCK_CLOSE, TokenKinds.ELSE, TokenKinds.ELSE_IF);
	const consequent = makeBlockStmt(consequentBlock, openToken, parser.current);

	parser.ensureAny(TokenKinds.BLOCK_CLOSE, TokenKinds.ELSE, TokenKinds.ELSE_IF)
	      .orFail(`Se esperaba un cierre de bloque en algún punto después del indicador \`SI\` en la línea **${openToken.line}**, columnas **${openToken.start}** a **${openToken.end}**. Sin embargo, no se encontró ninguna`);

	if(parser.current.is(TokenKinds.BLOCK_CLOSE)) {
		const closeToken = parser.advance();
		return {
			kind: StatementKinds.CONDITIONAL,
			line: openToken.line,
			start: openToken.start,
			end: closeToken.end,
			test,
			consequent,
		};
	}

	if(parser.current.is(TokenKinds.ELSE)) {
		const alternationToken = parser.advance();
		const alternateBlock = parseBlockBody(parser, TokenKinds.BLOCK_CLOSE);
		const closeToken = parser.expect(TokenKinds.BLOCK_CLOSE, `Se esperaba un cierre de bloque con Sentencia \`FIN\` en algún punto después del indicador \`SINO\` en la línea en la línea **${alternationToken.line}**, columnas **${alternationToken.start}** a **${alternationToken.end}**. Sin embargo, no se encontró ninguna`);
		const alternate = makeBlockStmt(alternateBlock, alternationToken, closeToken);

		return {
			kind: StatementKinds.CONDITIONAL,
			line: openToken.line,
			start: openToken.start,
			end: closeToken.end,
			test,
			consequent,
			alternate,
		}
	}
	
	const alternate = parseConditionalStatement(parser);

	return {
		kind: StatementKinds.CONDITIONAL,
		line: openToken.line,
		start: openToken.start,
		end: alternate.end,
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
	const test = parser.parseExpression(BindingPowers.ASSIGNMENT);
	const whileBlock = parseBlockBody(parser);
	const closeToken = parser.expect(TokenKinds.BLOCK_CLOSE,
		`Se esperaba un cierre de bloque con Sentencia \`FIN\` en algún punto después del indicador \`MIENTRAS\` en la línea **${openToken.line}**, columnas **${openToken.start}** a **${openToken.end}**. Sin embargo, no se encontró ninguna`);
	const body = makeBlockStmt(whileBlock, openToken, closeToken);

	return {
		kind: StatementKinds.WHILE,
		line: openToken.line,
		start: openToken.start,
		end: closeToken.end,
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
	const doWhileBlock = parseBlockBody(parser, TokenKinds.UNTIL);
	const closeToken = parser.expect(TokenKinds.UNTIL, `Se esperaba un cierre de bloque con Sentencia \`HASTA\` en algún punto después del indicador \`HACER\` en la línea **${openToken.line}**, columnas **${openToken.start}** a **${openToken.end}**. Sin embargo, no se encontró ninguna`);
	const body = makeBlockStmt(doWhileBlock, openToken, closeToken);
	const test = parser.parseExpression(BindingPowers.ASSIGNMENT);

	return {
		kind: StatementKinds.DO_UNTIL,
		line: openToken.line,
		start: openToken.start,
		end: test.end,
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
	const times = parser.parseExpression(BindingPowers.ASSIGNMENT);
	
	const blockStartToken = parser.expect(TokenKinds.TIMES);
	const repeatBlock = parseBlockBody(parser);
	const closeToken = parser.expect(TokenKinds.BLOCK_CLOSE, `Se esperaba un cierre de bloque con Sentencia \`FIN\` en algún punto después del indicador \`REPETIR\` en la línea **${openToken.line}**, columnas **${openToken.start}** a **${openToken.end}**. Sin embargo, no se encontró ninguna`);
	const body = makeBlockStmt(repeatBlock, blockStartToken, closeToken);

	return {
		kind: StatementKinds.REPEAT,
		line: openToken.line,
		start: openToken.start,
		end: closeToken.end,
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
	const identifier = parser.expect(TokenKinds.IDENTIFIER, `Se esperaba un identificador en Sentencia \`PARA CADA\`, pero se recibió: *${parser.current.value}*`);
	parser.expect(TokenKinds.IN);
	const container = parser.parseExpression(BindingPowers.COMMA);

	const blockStartToken = parser.current;
	const forEachBlock = parseBlockBody(parser);
	const closeToken = parser.expect(TokenKinds.BLOCK_CLOSE,
		`Se esperaba un cierre de bloque con Sentencia "FIN" en algún punto después del indicador \`PARA CADA\` en la línea **${openToken.line}**, columnas **${openToken.start}** a **${openToken.end}**. Sin embargo, no se encontró ninguna`);
	const body = makeBlockStmt(forEachBlock, blockStartToken, closeToken);

	return {
		kind: StatementKinds.FOR_EACH,
		line: openToken.line,
		start: openToken.start,
		end: closeToken.end,
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
	const identifier = /**@type {String}*/(parser.expect(TokenKinds.IDENTIFIER, `Se esperaba un literal de identificador en Sentencia \`PARA\`, pero se recibió: *${parser.current.value}*`).value);
	let full = false;

	if(parser.current.is(TokenKinds.FROM)) {
		const openToken = parser.advance();
		const from = parser.parseExpression(BindingPowers.COMMA);
		parser.expect(TokenKinds.UNTIL, `Se esperaba operador \`hasta\` en sentencia \`PARA\` corta, pero se recibió: *${parser.current.value}*`);
		const to = parser.parseExpression(BindingPowers.COMMA);
		
		const blockStart = parser.current;
		const forBlock = parseBlockBody(parser);
		const closeToken = parser.expect(TokenKinds.BLOCK_CLOSE, `Se esperaba un cierre de bloque con Sentencia \`FIN\` en algún punto después del indicador \`PARA\` en la línea **${openToken.line}**, columnas **${openToken.start}** a **${openToken.end}**. Sin embargo, no se encontró ninguna`);
		const body = makeBlockStmt(forBlock, blockStart, closeToken);
		
		return {
			kind: StatementKinds.FOR,
			line: openToken.line,
			start: openToken.start,
			end: closeToken.end,
			identifier,
			body,
			full,
			from,
			to,
		};
	}

	full = true;
	parser.expect(TokenKinds.ASSIGNMENT, `Se esperaba el operador \`con\` o \`desde\` luego de identificador en Sentencia \`PARA\`, pero se recibió: *${parser.current.value}*`);
	const init = parser.parseExpression(BindingPowers.COMMA);
	parser.expect(TokenKinds.WHILE, `Se esperaba \`MIENTRAS\` en sentencia \`PARA\` larga, pero se recibió: *${parser.current.value}*`);
	const test = parser.parseExpression(BindingPowers.ASSIGNMENT);
	const step = parser.parseStatement();

	const blockStartToken = parser.current;
	const forBody = parseBlockBody(parser);
	const closeToken = parser.expect(TokenKinds.BLOCK_CLOSE, `Se esperaba un cierre de bloque con Sentencia \`FIN\` en algún punto después de Sentencia \`PARA\` en la línea **${openToken.line}**, columnas **${openToken.start}** a **${openToken.end}**. Sin embargo, no se encontró ninguna`);
	const body = makeBlockStmt(forBody, blockStartToken, closeToken);

	return {
		kind: StatementKinds.FOR,
		line: openToken.line,
		start: openToken.start,
		end: closeToken.end,
		identifier,
		body,
		full,
		init,
		test,
		step,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').ExpressionStatement}
 */
function parseExpressionStatement(parser) {
	const startToken = parser.advance();

	if(!parser.hasTokens || parser.current.isStatement)
		throw parser.TuberParserError(`Se esperaba una expresión a ejecutar inmediatamente después de indicador \`${startToken.value}\`. Sin embargo, se recibió: *${parser.current.translated}*`);

	const expression = parser.parseExpression(BindingPowers.COMMA);

	return {
		kind: StatementKinds.EXPRESSION,
		line: startToken.line,
		start: startToken.start,
		end: expression.end,
		expression,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').ReadStatement}
 */
function parseReadStatement(parser) {
	const startToken = parser.advance();
	
	const dataKind = parser.expectAny(TokenKinds.NUMBER, TokenKinds.TEXT, TokenKinds.BOOLEAN, TokenKinds.LIST, TokenKinds.EMBED)
		.orFail(`Se esperaba un tipo de Entrada antes de expresión receptora en Sentencia \`LEER\`, pero se recibió: *${parser.current.translated}*`);

	let optional = false;
	if(!parser.hasTokens || parser.current.isStatement)
		throw parser.TuberParserError(`Se esperaba una expresión receptora en Sentencia \`LEER\`, pero se recibió: *${parser.current.translated}*`);

	if(parser.hasTokens && parser.current.is(TokenKinds.OPTIONAL)) {
		optional = true;
		parser.advance();
	}
	
	const receptor = parser.parseExpression(BindingPowers.COMMA);

	/**@type {import('../../ast/expressions.js').Expression}*/
	let fallback = null;

	if(!parser.current.is(TokenKinds.ASSIGNMENT)) {
		if(parser.hasTokens && !parser.current.isStatement)
			throw parser.TuberParserError(
				`Se esperaba \`con\` y una expresión (o palabra clave \`opcional\`) luego de expresión receptora en Sentencia \`LEER\`. Sin embargo, se recibió: *${parser.current.translated}*`);

		return {
			kind: StatementKinds.READ,
			line: startToken.line,
			start: startToken.start,
			end: receptor.end,
			dataKind,
			receptor,
			fallback,
			optional,
		};
	}

	parser.advance(); //Avanzar "con"

	if(!parser.hasTokens || parser.current.isStatement)
		throw parser.TuberParserError(
			`Se esperaba una expresión de valor de respaldo luego de \`con\` en Sentencia \`LEER\`, pero la instrucción finalizó sin más con: *${parser.current.translated}*`);

	fallback = parser.parseExpression(BindingPowers.COMMA);

	return {
		kind: StatementKinds.READ,
		line: startToken.line,
		start: startToken.start,
		end: fallback.end,
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
	const startToken = parser.advance();
	
	let dataKind = null;
	if(parser.current.isAny(TokenKinds.NUMBER, TokenKinds.TEXT, TokenKinds.BOOLEAN, TokenKinds.LIST, TokenKinds.REGISTRY, TokenKinds.EMBED))
		dataKind = parser.advance();

	let lastIdentifier = parser.expect(TokenKinds.IDENTIFIER, `Se esperaba un identificador luego del tipo de dato (o solamente el identificador) en Sentencia \`CREAR\`. Sin embargo, se recibió: *${parser.current.translated}*`);
	const declarations = [ lastIdentifier.value ];

	if(parser.current.is(TokenKinds.COMMA)) {
		while(parser.current.is(TokenKinds.COMMA)) {
			parser.advance();

			if(!parser.hasTokens || parser.current.isStatement)
				break;

			lastIdentifier = parser.expect(TokenKinds.IDENTIFIER, `Se esperaban identificadores separados por \`,\` luego del tipo de dato en Sentencia \`CREAR\`. Sin embargo, se recibió: *${parser.current.translated}*`);
			declarations.push(lastIdentifier.value);
		}

		return {
			kind: StatementKinds.DECLARATION,
			line: startToken.line,
			start: startToken.start,
			end: lastIdentifier.end,
			declarations,
			dataKind: dataKind,
		};
	}

	return {
		kind: StatementKinds.DECLARATION,
		line: startToken.line,
		start: startToken.start,
		end: lastIdentifier.end,
		declarations,
		dataKind: dataKind,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').SaveStatement}
 */
function parseSaveStatement(parser) {
	const startToken = parser.advance();
	const identifier = parser.expect(TokenKinds.IDENTIFIER, `Se esperaba un identificador en Sentencia \`GUARDAR\`, pero se recibió: *${parser.current.value}*`);
	
	/**@type {import('../../ast/expressions.js').Expression}*/
	let expression;
	if(parser.current.is(TokenKinds.ASSIGNMENT)) {
		parser.advance();
		expression = parser.parseExpression(BindingPowers.COMMA);
	} else
		expression = {
			kind: ExpressionKinds.IDENTIFIER,
			line: identifier.line,
			start: identifier.start,
			end: identifier.end,
			name: identifier.value,
		};

	return {
		kind: StatementKinds.SAVE,
		line: startToken.line,
		start: startToken.start,
		end: expression.end,
		identifier: identifier.value,
		expression,
	}
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').AssignmentStatement}
 */
function parseAssignmentStatement(parser) {
	const operator = parser.advance();

	if(!parser.hasTokens || parser.current.isStatement)
		throw parser.TuberParserError(
			`Se esperaba una expresión receptora válida luego del indicador \`${`${operator.value}`.toUpperCase()}\`. Sin embargo, se recibió: *${parser.current.translated}*`,
			parser.previous);
	const receptor = parser.parseExpression(BindingPowers.COMMA);

	if(receptor.kind !== ExpressionKinds.IDENTIFIER && receptor.kind !== ExpressionKinds.ARROW)
		throw parser.TuberParserError(`Se esperaba una expresión receptora asignable en ${operator.translated}. Sin embargo, se recibió: *${parser.current.translated}*`);

	if(operator.isAny(TokenKinds.ADD, TokenKinds.SUBTRACT) && !parser.current.is(TokenKinds.ASSIGNMENT)) {
		return ({
			kind: StatementKinds.ASSIGNMENT,
			line: operator.line,
			start: operator.start,
			end: receptor.end,
			operator,
			receptor,
			reception: null,
		});
	}

	parser.expect(TokenKinds.ASSIGNMENT, `Se esperaba "con" y una expresión luego de expresión receptora en ${operator.translated}. Sin embargo, se recibió: ${parser.current.translated}`);

	if(!parser.hasTokens || parser.current.isStatement)
		throw parser.TuberParserError(
			`Se esperaba una expresión de recepción válida luego del operador \`con\` en ${operator.translated}. Sin embargo, se recibió: *${parser.current.translated}*`,
			parser.previous);
	const reception = parser.parseExpression(BindingPowers.COMMA);

	return ({
		kind: StatementKinds.ASSIGNMENT,
		line: operator.line,
		start: operator.start,
		end: reception.end,
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
	const startToken = parser.advance();

	if(!parser.hasTokens || parser.current.isStatement)
		throw parser.TuberParserError(`Se esperaba una expresión a devolver inmediatamente después de indicador \`${`${startToken.value}`.toUpperCase()}\`. Sin embargo, se recibió: *${parser.current.translated}*`);
	const expression = parser.parseExpression(BindingPowers.COMMA);

	return {
		kind: StatementKinds.RETURN,
		line: startToken.line,
		start: startToken.start,
		end: expression.end,
		expression,
	}
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').EndStatement}
 */
function parseEndStatement(parser) {
	const token = parser.advance();

	return {
		kind: StatementKinds.END,
		line: token.line,
		start: token.start,
		end: token.end,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').StopStatement}
 */
function parseStopStatement(parser) {
	const startToken = parser.advance();
	parser.expect(TokenKinds.ASSIGNMENT, `Se esperaba \`con\` en Sentencia \`PARAR\`, pero se recibió: *${parser.current.translated}*`);

	if(!parser.hasTokens || parser.current.isStatement)
		throw parser.TuberParserError(`Se esperaba un mensaje de corte luego de \`con\` en Sentencia \`PARAR\`. Sin embargo, se recibió: *${parser.current.translated}*`);
	const stopMessage = parser.parseExpression(BindingPowers.COMMA);

	parser.expect(TokenKinds.IF, `Se esperaba \`SI\` y una condición luego de mensaje de corte en Sentencia \`PARAR\`. Sin embargo, se recibió: *${parser.current.translated}*`);
	
	if(!parser.hasTokens || parser.current.isStatement)
		throw parser.TuberParserError(`Se esperaba una expresión lógica luego de \`SI\` en Sentencia \`PARAR\`. Sin embargo, se recibió: *${parser.current.translated}*`);
	const condition = parser.parseExpression(BindingPowers.COMMA);

	return {
		kind: StatementKinds.STOP,
		line: startToken.line,
		start: startToken.start,
		end: condition.end,
		stopMessage,
		condition,
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').SendStatement}
 */
function parseSendStatement(parser) {
	const startToken = parser.advance();

	if(!parser.hasTokens || parser.current.isStatement)
		throw parser.TuberParserError(`Se esperaba una expresión a enviar inmediatamente después de indicador \`${startToken.value}\`. Sin embargo, se recibió: *${parser.current.translated}*`);
	const expression = parser.parseExpression(BindingPowers.COMMA);

	return {
		kind: StatementKinds.SEND,
		line: startToken.line,
		start: startToken.start,
		end: expression.end,
		expression,
	};
}

module.exports = {
	parseBlock: parseBlockBody,
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
