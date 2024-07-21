const { TokenKinds, translateTokenKind, Token, translateTokenKinds } = require('../../lexer/tokens.js');
const { BindingPowers } = require('../../ast/ast.js');
const { StatementKinds, ScopeAbortKinds } = require('../../ast/statements.js');
const { ExpressionKinds } = require('../../ast/expressions.js');
const { makeMetadata } = require('../../ast/metadata.js')
const { makeText, makeNumber, ValueKinds } = require('../../interpreter/values.js');
const { toLowerCaseNormalized, clamp } = require('../../../../func.js');

/**
 * Parsea un cuerpo de bloque. Se analizan Sentencias secuencialmente desde el Token actual hasta que se encuentra uno de los Tokens de cierre indicados (o `EOF`).
 * 
 * Las sentencias analizadas se agrupan en orden y son devueltas al detectar el cierre del bloque actual. NO se consume el Token de cierre detectado.
 * 
 * Si se encuentra una sentencia que haría que las secuencias subsecuentes no se ejecuten al interpretar el código, las mismas se descartan en este paso (justo antes de devolver el Array).
 * @param {import('../parser.js').Parser} parser
 * @param {...import('../../lexer/tokens.js').TokenKind} closeTokenKinds
 * @returns {import('../../ast/statements.js').BlockBody}
 */
function parseBlockBody(parser, ...closeTokenKinds) {
	if(!closeTokenKinds.length)
		closeTokenKinds.push(TokenKinds.BLOCK_CLOSE);

	/**@type {import('../../ast/statements.js').BlockBody}*/
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
 * Crea un nodo de Sentencia de Bloque (`kind`: {@linkcode StatementKinds.BLOCK}) a partir del cuerpo de bloque especificado.
 * 
 * El bloque contiene metadatos de rango de inicio y fin según los Tokens ingresados. `startToken` y `endToken` respectivamente
 * @param {import('../../ast/statements.js').BlockBody} body 
 * @param {Token} startToken 
 * @param {Token} [endToken]
 * @returns {import('../../ast/statements.js').BlockStatement}
 */
function makeBlockStmt(body, startToken, endToken = null) {
	endToken ??= startToken;
	return {
		kind: StatementKinds.BLOCK,
		body,
		...makeMetadata(startToken, endToken),
	};
}

/**
 * Parsea una Sentencia de Bloque
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
 * Parsea una Sentencia Condicional
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').ConditionalStatement}
 */
function parseConditionalStatement(parser) {
	const openToken = parser.advance();

	parser.ensureExpression(`Se esperaba una expresión luego de indicador \`SI\`, pero la Sentencia finalizó con: *${parser.current.translated}*`);
	const test = parser.parseExpression(BindingPowers.ASSIGNMENT);

	const consequentBlock = parseBlockBody(parser, TokenKinds.BLOCK_CLOSE, TokenKinds.ELSE, TokenKinds.ELSE_IF);
	const consequent = makeBlockStmt(consequentBlock, openToken, parser.current);

	parser.ensureAny(TokenKinds.BLOCK_CLOSE, TokenKinds.ELSE, TokenKinds.ELSE_IF)
	      .orFail(`Se esperaba un cierre de bloque en algún punto después del indicador \`SI\` en la línea **${openToken.line}**, columnas **${openToken.start}** a **${openToken.end}**. Sin embargo, no se encontró ninguna`);

	if(parser.current.is(TokenKinds.BLOCK_CLOSE)) {
		const closeToken = parser.advance();
		return {
			kind: StatementKinds.CONDITIONAL,
			test,
			consequent,
			...makeMetadata(openToken, closeToken),
		};
	}

	if(parser.current.is(TokenKinds.ELSE)) {
		const alternationToken = parser.advance();
		const alternateBlock = parseBlockBody(parser, TokenKinds.BLOCK_CLOSE);
		const closeToken = parser.expect(TokenKinds.BLOCK_CLOSE, `Se esperaba un cierre de bloque con Sentencia \`FIN\` en algún punto después del indicador \`SINO\` en la línea en la línea **${alternationToken.line}**, columnas **${alternationToken.start}** a **${alternationToken.end}**. Sin embargo, no se encontró ninguna`);
		const alternate = makeBlockStmt(alternateBlock, alternationToken, closeToken);

		return {
			kind: StatementKinds.CONDITIONAL,
			test,
			consequent,
			alternate,
			...makeMetadata(openToken, closeToken),
		}
	}
	
	const alternate = parseConditionalStatement(parser);

	return {
		kind: StatementKinds.CONDITIONAL,
		test,
		consequent,
		alternate,
		...makeMetadata(openToken, alternate),
	};
}

/**
 * Parsea una Sentencia de Iteración Condicional
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').WhileStatement}
 */
function parseWhileLoopStatement(parser) {
	const openToken = parser.advance();

	parser.ensureExpression(`Se esperaba una expresión luego de indicador \`MIENTRAS\`, pero la Sentencia finalizó con: *${parser.current.translated}*`);
	const test = parser.parseExpression(BindingPowers.ASSIGNMENT);
	
	const whileBlock = parseBlockBody(parser);
	const closeToken = parser.expect(TokenKinds.BLOCK_CLOSE,
		`Se esperaba un cierre de bloque con Sentencia \`FIN\` en algún punto después del indicador \`MIENTRAS\` en la línea **${openToken.line}**, columnas **${openToken.start}** a **${openToken.end}**. Sin embargo, no se encontró ninguna`);
	const body = makeBlockStmt(whileBlock, openToken, closeToken);

	return {
		kind: StatementKinds.WHILE,
		test,
		body,
		...makeMetadata(openToken, closeToken),
	};
}

/**
 * Parsea una Sentencia de Iteración Condicional con cuerpo consecuente de frente
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').DoUntilStatement}
 */
function parseDoWhileLoopStatement(parser) {
	const openToken = parser.advance();
	const doWhileBlock = parseBlockBody(parser, TokenKinds.UNTIL);
	const closeToken = parser.expect(TokenKinds.UNTIL, `Se esperaba un cierre de bloque con Sentencia \`HASTA\` en algún punto después del indicador \`HACER\` en la línea **${openToken.line}**, columnas **${openToken.start}** a **${openToken.end}**. Sin embargo, no se encontró ninguna`);
	const body = makeBlockStmt(doWhileBlock, openToken, closeToken);

	parser.ensureExpression(`Se esperaba una expresión luego de indicador \`HASTA\`, pero la Sentencia \`HACER\` asociada finalizó con: *${parser.current.translated}*`);
	const test = parser.parseExpression(BindingPowers.ASSIGNMENT);

	return {
		kind: StatementKinds.DO_UNTIL,
		test,
		body,
		...makeMetadata(openToken, test),
	};
}

/**
 * Parsea una Sentencia de Iteración Programada
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').RepeatStatement}
 */
function parseRepeatLoopStatement(parser) {
	const openToken = parser.advance();

	parser.ensureExpression(`Se esperaba una expresión luego de indicador \`REPETIR\`, pero la Sentencia finalizó con: *${parser.current.translated}*`);
	const times = parser.parseExpression(BindingPowers.ASSIGNMENT);
	
	const blockStartToken = parser.expect(TokenKinds.TIMES);
	const repeatBlock = parseBlockBody(parser);
	const closeToken = parser.expect(TokenKinds.BLOCK_CLOSE, `Se esperaba un cierre de bloque con Sentencia \`FIN\` en algún punto después del indicador \`REPETIR\` en la línea **${openToken.line}**, columnas **${openToken.start}** a **${openToken.end}**. Sin embargo, no se encontró ninguna`);
	const body = makeBlockStmt(repeatBlock, blockStartToken, closeToken);

	return {
		kind: StatementKinds.REPEAT,
		times,
		body,
		...makeMetadata(openToken, closeToken),
	};
}

/**
 * Parsea una Sentencia de Iteración sobre Contenedor
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').ForEachStatement}
 */
function parseForEachLoopStatement(parser) {
	const openToken = parser.advance();
	const identifier = parser.expect(TokenKinds.IDENTIFIER, `Se esperaba un identificador en Sentencia \`PARA CADA\`, pero se recibió: *${parser.current.value}*`);
	parser.expect(TokenKinds.IN);
	parser.ensureExpression(`Se esperaba una expresión de contenedor luego de operador \`en\` en Sentencia \`PARA CADA\`, pero la misma finalizó con: *${parser.current.translated}*`);
	const container = parser.parseExpression(BindingPowers.COMMA);

	const blockStartToken = parser.current;
	const forEachBlock = parseBlockBody(parser);
	const closeToken = parser.expect(TokenKinds.BLOCK_CLOSE,
		`Se esperaba un cierre de bloque con Sentencia \`FIN\` en algún punto después del indicador \`PARA CADA\` en la línea **${openToken.line}**, columnas **${openToken.start}** a **${openToken.end}**. Sin embargo, no se encontró ninguna`);
	const body = makeBlockStmt(forEachBlock, blockStartToken, closeToken);

	return {
		kind: StatementKinds.FOR_EACH,
		identifier: identifier.value,
		container,
		body,
		...makeMetadata(openToken, closeToken),
	};
}

/**
 * Parsea una Sentencia de Iteración Compleja
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').ForStatement}
 */
function parseForLoopStatement(parser) {
	const openToken = parser.advance();
	const identifier = /**@type {String}*/(parser.expect(TokenKinds.IDENTIFIER, `Se esperaba un literal de identificador en Sentencia \`PARA\`, pero se recibió: *${parser.current.value}*`).value);
	let full = false;

	if(parser.current.is(TokenKinds.FROM)) {
		const openToken = parser.advance();
		parser.ensureExpression(`Se esperaba una expresión luego de operador \`desde\` en Sentencia \`PARA\` corta, pero la misma finalizó con: *${parser.current.translated}*`);
		const from = parser.parseExpression(BindingPowers.COMMA);
		parser.expect(TokenKinds.UNTIL, `Se esperaba operador \`hasta\` en Sentencia \`PARA\` corta, pero se recibió: *${parser.current.value}*`);
		parser.ensureExpression(`Se esperaba una expresión luego de operador \`hasta\` en Sentencia \`PARA\` corta, pero la misma finalizó con: *${parser.current.translated}*`);
		const to = parser.parseExpression(BindingPowers.COMMA);
		
		const blockStart = parser.current;
		const forBlock = parseBlockBody(parser);
		const closeToken = parser.expect(TokenKinds.BLOCK_CLOSE, `Se esperaba un cierre de bloque con Sentencia \`FIN\` en algún punto después del indicador \`PARA\` en la línea **${openToken.line}**, columnas **${openToken.start}** a **${openToken.end}**. Sin embargo, no se encontró ninguna`);
		const body = makeBlockStmt(forBlock, blockStart, closeToken);
		
		return {
			kind: StatementKinds.FOR,
			identifier,
			body,
			full,
			from,
			to,
			...makeMetadata(openToken, closeToken),
		};
	}

	full = true;
	parser.expect(TokenKinds.ASSIGNMENT, `Se esperaba el operador \`con\` o \`desde\` luego de identificador en Sentencia \`PARA\`, pero se recibió: *${parser.current.value}*`);
	parser.ensureExpression(`Se esperaba una expresión luego de operador \`con\` en paso de inicialización de Sentencia \`PARA\` larga, pero la misma finalizó con: *${parser.current.translated}*`);
	const init = parser.parseExpression(BindingPowers.COMMA);
	parser.expect(TokenKinds.WHILE, `Se esperaba \`MIENTRAS\` en sentencia \`PARA\` larga, pero se recibió: *${parser.current.value}*`);
	parser.ensureExpression(`Se esperaba una expresión en paso de condición de Sentencia \`PARA\` larga, pero la misma finalizó con: *${parser.current.translated}*`);
	const test = parser.parseExpression(BindingPowers.ASSIGNMENT);
	parser.ensureStatement(`Se esperaba una Sentencia en paso de actualización de Sentencia \`PARA\` larga, pero la misma finalizó con: *${parser.current.translated}*`);
	const step = parser.parseStatement();

	const blockStartToken = parser.current;
	const forBody = parseBlockBody(parser);
	const closeToken = parser.expect(TokenKinds.BLOCK_CLOSE, `Se esperaba un cierre de bloque con Sentencia \`FIN\` en algún punto después de Sentencia \`PARA\` en la línea **${openToken.line}**, columnas **${openToken.start}** a **${openToken.end}**. Sin embargo, no se encontró ninguna`);
	const body = makeBlockStmt(forBody, blockStartToken, closeToken);

	return {
		kind: StatementKinds.FOR,
		identifier,
		body,
		full,
		init,
		test,
		step,
		...makeMetadata(openToken, closeToken),
	};
}

/**
 * Parsea una Sentencia de Expresión
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').ExpressionStatement}
 */
function parseExpressionStatement(parser) {
	const startToken = parser.advance();

	parser.ensureExpression(`Se esperaba una expresión a ejecutar inmediatamente después de indicador \`${startToken.value}\`. Sin embargo, se recibió: *${parser.current.translated}*`);
	const expression = parser.parseExpression(BindingPowers.COMMA);

	return {
		kind: StatementKinds.EXPRESSION,
		expression,
		...makeMetadata(startToken, expression),
	};
}

/**
 * Parsea una Sentencia de Lectura de Entrada
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').ReadStatement}
 */
function parseReadStatement(parser) {
	const startToken = parser.advance();
	
	const dataKind = parser.expectAny(TokenKinds.NUMBER, TokenKinds.TEXT, TokenKinds.BOOLEAN, TokenKinds.LIST, TokenKinds.EMBED)
		.orFail(`Se esperaba un tipo de Entrada antes de expresión receptora en Sentencia \`LEER\`, pero se recibió: *${parser.current.translated}*`);

	let optional = false;
	parser.ensureExpression(`Se esperaba una expresión receptora en Sentencia \`LEER\`, pero se recibió: *${parser.current.translated}*`);

	if(parser.hasTokens && parser.current.is(TokenKinds.OPTIONAL)) {
		optional = true;
		parser.advance();
		parser.ensureExpression(`Se esperaba una expresión receptora en Sentencia \`LEER\`, pero se recibió: *${parser.current.translated}*`);
	}
	
	const receptor = parser.parseExpression(BindingPowers.COMMA);

	/**@type {import('../../ast/expressions.js').Expression}*/
	let fallback = null;

	if(!parser.current.is(TokenKinds.ASSIGNMENT)) {
		const modifier = parseReadStmtModifier(parser, dataKind);

		if(this.hasTokens && !this.current.isStatement)
			throw parser.TuberParserError(`Se esperaba \`con\` y una expresión (o palabra clave \`opcional\`) luego de expresión receptora en Sentencia \`LEER\`. Sin embargo, se recibió: *${parser.current.translated}*`);
		

		//Sin valor de respaldo
		return {
			kind: StatementKinds.READ,
			dataKind,
			receptor,
			fallback,
			optional,
			modifier,
			...makeMetadata(startToken, receptor),
		};
	}

	parser.advance(); //Avanzar "con"
	parser.ensureExpression(`Se esperaba una expresión de valor de respaldo luego de \`con\` en Sentencia \`LEER\`, pero la instrucción finalizó sin más con: *${parser.current.translated}*`);
	fallback = parser.parseExpression(BindingPowers.COMMA);

	const modifier = parseReadStmtModifier(parser, dataKind);

	return {
		kind: StatementKinds.READ,
		dataKind,
		receptor,
		fallback,
		optional,
		modifier,
		...makeMetadata(startToken, fallback),
	};
}

/**
 * @param {import('../parser.js').Parser} parser
 * @param {Token} dataKind
 * @returns {import('../../ast/statements.js').ReadStatementModifier}
 */
function parseReadStmtModifier(parser, dataKind) {
	if(!parser.hasTokens || parser.current.isStatement)
		return v => v;
	
	if(dataKind.is(TokenKinds.TEXT)) {
		parser.expect(TokenKinds.IN, `Se esperaba un operador de formato para la definición de Entrada de Usuario, pero se recibió: *${parser.current.translated}*`);
		const caseToken = parser.expect(TokenKinds.IDENTIFIER, `Se esperaba: \`mayusculas\`, \`minusculas\` o similares en definición de formato de Entrada de Usuario, pero se recibió un símbolo inválido`);
		const textCase = toLowerCaseNormalized(caseToken.value);

		const upperCaseWords = [ 'mayus', 'mayuscula', 'mayusculas' ];
		const lowerCaseWords = [ 'minus', 'minuscula', 'minusculas' ];

		if(!upperCaseWords.includes(textCase) && !lowerCaseWords.includes(textCase))
			throw parser.TuberParserError(`Se esperaba: \`mayusculas\`, \`minusculas\` o similares en definición de formato de Entrada de Usuario. Sin embargo, se recibió: \`${textCase}\``, caseToken);

		const upperCase = upperCaseWords.includes(textCase);
		return upperCase
			? (/**@type {import('../../interpreter/values.js').TextValue}*/ v) => makeText(v.value.toUpperCase())
			: (/**@type {import('../../interpreter/values.js').TextValue}*/ v) => makeText(v.value.toLowerCase());
	}

	const opToken = parser.expect(TokenKinds.IDENTIFIER, `Se esperaba un operador de formato para la definición de Entrada de Usuario, pero se recibió: *${parser.current.translated}*`);
	const name = toLowerCaseNormalized(opToken.value);

	if(dataKind.is(TokenKinds.NUMBER) && name === 'entre') {
		const left = parser.parseExpression(BindingPowers.LOGICAL_CONJUNCTION);
		parser.expect(TokenKinds.AND);
		const right = parser.parseExpression(BindingPowers.LOGICAL_CONJUNCTION);

		return (/**@type {import('../../interpreter/values.js').NumberValue}*/ v, it, scope) => {
			it.rememberNode(left);
			const leftVal = it.evaluateAs(left, scope, ValueKinds.NUMBER);
			it.forgetLastNode();
			it.rememberNode(right);
			const rightVal = it.evaluateAs(right, scope, ValueKinds.NUMBER);
			it.forgetLastNode();

			if(v.value < leftVal.value)
				return leftVal;
			
			if(v.value > rightVal.value)
				return rightVal;

			return v;
		};
	}

	throw parser.TuberParserError(`El operador \`${name}\` no es válido para una Entrada de ${dataKind.translated}`, opToken);
}

/**
 * Parsea una Sentencia de Declaración de Variable
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
			declarations,
			dataKind,
			...makeMetadata(startToken, lastIdentifier),
		};
	}

	return {
		kind: StatementKinds.DECLARATION,
		declarations,
		dataKind,
		...makeMetadata(startToken, lastIdentifier),
	};
}

/**
 * Parsea una Sentencia de Guardado de Dato
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
		parser.ensureExpression(`Se esperaba una expresión a guardar luego de \`con\` en Sentencia \`GUARDAR\`, pero se recibió: *${parser.current.value}*`);
		expression = parser.parseExpression(BindingPowers.COMMA);
	} else
		expression = {
			kind: ExpressionKinds.IDENTIFIER,
			name: identifier.value,
			...makeMetadata(identifier),
		};

	return {
		kind: StatementKinds.SAVE,
		identifier: identifier.value,
		expression,
		...makeMetadata(startToken, expression),
	}
}

/**
 * Parsea una Sentencia de Asignación de Variable
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').AssignmentStatement|import('../../ast/statements.js').LoadStatement}
 */
function parseAssignmentStatement(parser) {
	const operator = parser.advance();
	const operatorString = `\`${`${operator.value}`.toUpperCase()}\``;

	parser.ensureExpression(
		`Se esperaba una expresión receptora válida luego del indicador ${operatorString}. Sin embargo, se recibió: *${parser.current.translated}*`,
		parser.previous);
	
	const receptorToken = parser.current;
	const receptor = parser.parseExpression(BindingPowers.COMMA);

	if(receptor.kind !== ExpressionKinds.IDENTIFIER && receptor.kind !== ExpressionKinds.ARROW)
		throw parser.TuberParserError(`Se esperaba una expresión receptora asignable en Sentencia ${operatorString}. Sin embargo, se recibió: *${receptorToken.translated}*`, receptorToken);

	if(!parser.current.is(TokenKinds.ASSIGNMENT)) {
		if(operator.isAny(TokenKinds.ADD, TokenKinds.SUBTRACT)) {
			return ({
				kind: StatementKinds.ASSIGNMENT,
				operator,
				receptor,
				reception: null,
				...makeMetadata(operator, receptor),
			});
		}

		if(operator.is(TokenKinds.LOAD) && parser.current.isStatement && receptor.kind === ExpressionKinds.IDENTIFIER) {
			return ({
				kind: StatementKinds.LOAD,
				identifier: receptor.name,
				...makeMetadata(operator, receptor),
			});
		}
	}

	parser.expect(TokenKinds.ASSIGNMENT, `Se esperaba "con" y una expresión luego de expresión receptora en Sentencia ${operatorString}. Sin embargo, se recibió: ${parser.current.translated}`);

	parser.ensureExpression(
		`Se esperaba una expresión de recepción válida luego del operador \`con\` en Sentencia ${operatorString}. Sin embargo, se recibió: *${parser.current.translated}*`,
		parser.previous);
	const reception = parser.parseExpression(BindingPowers.COMMA);

	return ({
		kind: StatementKinds.ASSIGNMENT,
		operator,
		receptor,
		reception,
		...makeMetadata(operator, receptor),
	});
}

/**
 * Parsea una Sentencia de Retorno de Valor
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').ReturnStatement}
 */
function parseReturnStatement(parser) {
	const startToken = parser.advance();

	parser.ensureExpression(`Se esperaba una expresión a devolver inmediatamente después de indicador \`${`${startToken.value}`.toUpperCase()}\`. Sin embargo, se recibió: *${parser.current.translated}*`);
	const expression = parser.parseExpression(BindingPowers.COMMA);

	return {
		kind: StatementKinds.RETURN,
		expression,
		...makeMetadata(startToken, expression),
	};
}

/**
 * Parsea una Sentencia de Terminación Inmediata de Función o Programa
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').EndStatement}
 */
function parseEndStatement(parser) {
	const token = parser.advance();

	return {
		kind: StatementKinds.END,
		...makeMetadata(token),
	};
}

/**
 * Parsea una Sentencia de Terminación Condicional de Programa
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').StopStatement}
 */
function parseStopStatement(parser) {
	const startToken = parser.advance();
	parser.expect(TokenKinds.ASSIGNMENT, `Se esperaba \`con\` en Sentencia \`PARAR\`, pero se recibió: *${parser.current.translated}*`);

	parser.ensureExpression(`Se esperaba un mensaje de corte luego de \`con\` en Sentencia \`PARAR\`. Sin embargo, se recibió: *${parser.current.translated}*`);
	const stopMessage = parser.parseExpression(BindingPowers.COMMA);

	parser.expect(TokenKinds.IF, `Se esperaba \`SI\` y una condición luego de mensaje de corte en Sentencia \`PARAR\`. Sin embargo, se recibió: *${parser.current.translated}*`);
	
	parser.ensureExpression(`Se esperaba una expresión lógica luego de \`SI\` en Sentencia \`PARAR\`. Sin embargo, se recibió: *${parser.current.translated}*`);
	const condition = parser.parseExpression(BindingPowers.COMMA);

	return {
		kind: StatementKinds.STOP,
		stopMessage,
		condition,
		...makeMetadata(startToken, condition),
	};
}

/**
 * Parsea una Sentencia de Envío de Valor
 * @param {import('../parser.js').Parser} parser
 * @returns {import('../../ast/statements.js').SendStatement}
 */
function parseSendStatement(parser) {
	const startToken = parser.advance();

	parser.ensureExpression(`Se esperaba una expresión a enviar inmediatamente después de indicador \`${`${startToken.value}`.toUpperCase()}\`. Sin embargo, se recibió: *${parser.current.translated}*`);
	const expression = parser.parseExpression(BindingPowers.COMMA);

	return {
		kind: StatementKinds.SEND,
		expression,
		...makeMetadata(startToken, expression),
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
