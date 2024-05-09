const {
	LexerTokenTypes,
	ParserExpressionNodeTypes,
	LanguageToLexerType,
	LexerToParserType,
	ParserToLanguageType,
	LexerToLanguageType,
	ParserNodeTypes,
	LanguageDataToParserType,
	ParserLiteralNodeTypes,
	ParserStatementNodeTypes,
	parserNodeWithin,
} = require('./commons.js');

/**@class Clase para parsear tokens de PuréScript*/
class TuberParser {
	#tokens = [];
	#cursor = 0;
	#statement = '';
	#statementNumber = 1;
	#insideTemplate;
	#insideListing;

	/**
	 * @constructor
	 * @param {Array<import('./commons.js').LexerToken>} tokens Los tokens a parsear
	 */
	constructor(tokens) {
		this.#tokens = tokens;
		this.#insideListing = false;
		this.#insideTemplate = false;
	}

	/**
	 * El Token en la posición actual del cursor
	 * @returns {import('./commons.js').LexerToken}
	 */
	get #current() {
		return this.#tokens[this.#cursor];
	}

	/**
	 * Para que Typescript no se confunda
	 * @param {import('./commons.js').LexerToken} token
	 * @returns {import('./commons.js').LexerToken}
	 */
	#assert(token) {
		if(token === this.#current)
			return this.#current;
		
		if(token === this.#next)
			return this.#next;

		throw new Error(`Ocurrió un error inesperado al leer un símbolo de lenguaje. No se sabe qué pasó`);
	}

	/**
	 * El Token en la siguiente posición del cursor
	 * @returns {import('./commons.js').LexerToken}
	 */
	get #next() {
		return this.#tokens[this.#cursor + 1];
	}

	get #endOfStatement() {
		return this.#current.type !== LexerTokenTypes.Statement && this.#current.type !== LexerTokenTypes.EoF;
	}

	TuberParserError(message = `Se encontró un Token inesperado [${LexerToLanguageType.get(this.#current.type)}] con el valor: ${this.#current.value}`) {
		const specifier = `Línea: ${this.#current.line} / Posición: (${this.#current.start}:${this.#current.end}) - `;
		const err = new Error(specifier + message);
		err.name = 'TuberParserError';
		return err;
	}

	/**
	 * Digiere un Token
	 * @returns {import('./commons.js').LexerToken}
	 */
	#digest() {
		const current = this.#current;
		// console.log('Se digerió', this.#current);
		this.#cursor++;
		return current;
	}

	/**
	 * Digiere un Token y verifica que sea del tipo correcto
	 * @template {import('./commons.js').LexerTokenType} T
	 * @param {T} tokenType Un string de `TokenTypes` especificando el tipo de Token
	 * @param {String} [errorMessage] Mensaje de error al fallar la verificación de Token
	 * @returns {import('./commons.js').LexerToken<T>}
	 */
	#expect(tokenType, errorMessage) {
		if(this.#current.type !== tokenType)
			throw this.TuberParserError(errorMessage ?? `Se esperaba un Token de tipo [${LexerToLanguageType.get(tokenType) ?? tokenType}], pero se encontró [${LexerToLanguageType.get(this.#current.type) ?? this.#current.type}] con el valor: ${this.#current.value ?? 'Nada'}`);

		const current = this.#current;
		this.#cursor++;
		return /**@type {import('./commons.js').LexerToken<T>}*/(current);
	}

	/**
	 * @template {import('./commons.js').LexerTokenType} T
	 * @param {Array<T>} tokenTypes 
	 * @param {String} [errorMessage]
	 * @returns {import('./commons.js').LexerToken<T>}
	 */
	#expectAny(tokenTypes, errorMessage) {
		if(!tokenTypes.some(tokenType => this.#current.type !== tokenType)) {
			const tokenTypesExpr = tokenTypes.map(tokenType => LexerToLanguageType.get(tokenType) ?? tokenType).join(' o ');
			throw this.TuberParserError(errorMessage ?? `Se esperaba un Token de tipo: ${tokenTypesExpr}; se encontró: ${LexerToLanguageType.get(this.#current.type) ?? this.#current.type}; con valor: ${this.#current.value ?? 'Nada'}`);
		}

		const current = this.#current;
		this.#cursor++;
		return /**@type {import('./commons.js').LexerToken<T>}*/(current);
	}

	/**
	 * @template {import('./commons.js').LexerTokenType} T
	 * @param {Readonly<Array<T>>} tokenTypes
	 * @returns {this is { #current: { type: T, value: * } }}
	 */
	#verify(...tokenTypes) {
		return /**@type {Readonly<Array<import('./commons.js').LexerTokenType>>}*/(tokenTypes).includes(this.#current.type);
	}

	/**
	 * @template {import('./commons.js').LexerTokenType} T
	 * @param {Readonly<Array<T>>} tokenTypes
	 * @returns {this is { #next: { type: T, value: * } }}
	 */
	#verifyNext(...tokenTypes) {
		return /**@type {Readonly<Array<import('./commons.js').LexerTokenType>>}*/(tokenTypes).includes(this.#next.type);
	}

	/**@param {Boolean} hasToReturn*/
	#ommitRemainingScope(hasToReturn) {
		const openStatements = [
			LexerTokenTypes.BlockOpen,
			LexerTokenTypes.ConditionOpen,
			LexerTokenTypes.DoOpen,
			LexerTokenTypes.While,
			LexerTokenTypes.DoOpen,
			LexerTokenTypes.For,
		];
		const originalCursor = this.#cursor;
		let blockLevels = 0;
		do {
			if(this.#verify(...openStatements) && this.#current.value !== 'cada')
				blockLevels++;
				
			if(blockLevels === 0 || this.#verify(LexerTokenTypes.BlockClose, LexerTokenTypes.ConditionChange))
				blockLevels--;
			
			if(this.#verify(LexerTokenTypes.DoOpen, LexerTokenTypes.DoClose)) {
				this.#cursor = originalCursor;
				break;
			}
			
			if(this.#verify(LexerTokenTypes.EoF)) {
				if(hasToReturn)
					throw this.TuberParserError('DEVOLVER no puede ser usado en el bloque Programa');
				break;
			}
		} while(blockLevels >= 0 && this.#digest());
	}

	/**
	 * Parsea Tokens de PuréScript y devuelve un árbol de Tokens listos para ejecutar
	 * Si la sintaxis es incorrecta, se alzará un error
	 * @typedef {{ type: 'PROGRAM', body: Array<import('./commons.js').LexerToken> }} Program
	 * @returns {import('./commons.js').ParserProgramNode} El programa devuelto
	 */
	parse() {
		return this.#parseProgram()
	}

	/**
	 * Parsea un programa
	 * @returns {import('./commons.js').ParserProgramNode}
	 */
	#parseProgram() {
		const program = {
			type: ParserNodeTypes.Program,
			body: [],
		};

		while(this.#current.type !== LexerTokenTypes.EoF) {
			const statementNumber = this.#statementNumber++;
			const statement = this.#parseStatement();
			program.body.push({ ...statement, number: statementNumber });
		}

		return program;
	}

	/**
	 * Parsea una sentencia
	 * @returns {import('./commons.js').ParserStatementNode|import('./commons.js').ParserBasicScopeNode}
	 */
	#parseStatement() {
		switch(this.#current.type) {
		case LexerTokenTypes.BlockOpen:
		case LexerTokenTypes.ConditionOpen: {
			const statement = this.#parseConditional();
			this.#expect(LexerTokenTypes.BlockClose);
			return statement;
		}
		case LexerTokenTypes.While: {
			const statement = this.#parseWhile();
			this.#expect(LexerTokenTypes.BlockClose);
			return statement;
		}
		case LexerTokenTypes.DoOpen: {
			const statement = this.#parseDoWhile();
			return statement;
		}
		case LexerTokenTypes.For: {
			const statement = this.#parseFor();
			this.#expect(LexerTokenTypes.BlockClose);
			return statement;
		}
		case LexerTokenTypes.GroupOpen: {
			return {
				type: ParserNodeTypes.Expression,
				expression: this.#parseExpression(),
			};
		}
		case LexerTokenTypes.DataType:
		case LexerTokenTypes.Identifier:
			return {
				type: ParserNodeTypes.Expression,
				expression: this.#parseGlossary()
			};
		}

		let statement = this.#expect(LexerTokenTypes.Statement);
		this.#statement = statement.value;

		switch(statement.value) {
		case 'crear':
			return this.#parseDeclare();
		
		case 'registrar': {
			const registryTypeNode = this.#expect(LexerTokenTypes.DataType);
			const registryValue = LanguageDataToParserType.get(registryTypeNode.value);

			if(registryValue !== ParserNodeTypes.CallExpression
			&& registryValue !== ParserNodeTypes.Input
			&& registryValue !== ParserNodeTypes.List)
				throw this.TuberParserError(`Tipo de registro inesperado en sentencia de registro: ${registryTypeNode.value}`);

			const assignment = this.#parseAssign(registryTypeNode);

			if(assignment.type !== ParserNodeTypes.AssignExpression)
				throw this.TuberParserError(`Expresión inesperada en sentencia de registro: ${ParserToLanguageType.get(assignment?.type) ?? 'Nada'}`);

			return {
				type: ParserNodeTypes.Registry,
				initialize: assignment,
				as: registryValue,
			};
		}

		case 'sumar':
		case 'restar':
			if(this.#next.type !== LexerTokenTypes.Assign)
				return {
					type: ParserNodeTypes.Expression,
					expression: this.#parseUpdate()
				};

		case 'multiplicar':
		case 'dividir':
		case 'guardar':
		case 'cargar':
		case 'extender': {
			const assignment = this.#parseAssign();

			if(assignment.type !== ParserNodeTypes.AssignExpression)
				throw this.TuberParserError(`Expresión inesperada en sentencia de registro: ${ParserToLanguageType.get(assignment?.type) ?? 'Nada'}`);

			return {
				type: ParserNodeTypes.Relational,
				operator: statement.value,
				expression: assignment,
			};
		}
		
		case 'usar':
		case 'ejecutar': {
			let expression = this.#parseMemberCall();
			if(expression.type === ParserNodeTypes.Identifier)
				expression = {
					type: ParserNodeTypes.CallExpression,
					emitter: expression,
					arguments: [],
				};
			return {
				type: ParserNodeTypes.Expression,
				expression,
			};
		}

		case 'decir':
		case 'enviar':
			return {
				type: ParserNodeTypes.Send,
				value: this.#parseExpression(),
			};

		case 'devolver': {
			const returnValue = this.#parseExpression();
			this.#ommitRemainingScope(true);
			return {
				type: ParserNodeTypes.Return,
				value: returnValue,
			};
		}

		case 'terminar':
			this.#ommitRemainingScope(false);
			return { type: ParserNodeTypes.Break };

		case 'parar':
			return this.#parseStop();

		case 'comentar':
			return { type: ParserNodeTypes.Comment };
		}

		return {
			type: ParserNodeTypes.Expression,
			expression: this.#parseExpression(),
		};
	}

	/**
	 * @returns {import('./commons.js').ParserBasicScopeNode|import('./commons.js').ParserConditionalStatementNode}
	 */
	#parseConditional() {
		let statement = this.#parseBlock();

		if(this.#current.type === LexerTokenTypes.ConditionOpen && this.#digest()) {
			const test = /**@type {import('./commons.js').ParserExpressionNode}*/(this.#parseOr());

			/**@type {Array<import('./commons.js').ParserBlockItem>}*/
			const body = [];

			while(!/**@type {Array<import('./commons.js').LexerTokenType>}*/([ LexerTokenTypes.ConditionChange, LexerTokenTypes.BlockClose ]).includes(this.#current.type))
				body.push({ ...this.#parseStatement(), number: this.#statementNumber++ });

			/**@type {import('./commons.js').ParserBlockNode}*/
			const consequent = { type: ParserNodeTypes.Block, body };

			const conditionalStatement = /**@type {import('./commons.js').ParserConditionalStatementNode}*/({
				type: ParserNodeTypes.Conditional,
				test,
				consequent,
			});

			if(this.#verify(LexerTokenTypes.ConditionChange)) {
				const alternateNumber = this.#statementNumber++;
				const alternateBlock = this.#parseBlock();

				if(alternateBlock.type !== ParserNodeTypes.Block && alternateBlock.type !== ParserNodeTypes.Conditional)
					throw this.TuberParserError(`Se esperaba un bloque o condicional simples luego de sentencia de condición alternativa, pero se recibió: ${ParserToLanguageType.get(alternateBlock.type)}`);

				conditionalStatement.alternate = { ...alternateBlock, number: alternateNumber };
			}

			return conditionalStatement;
		}

		return statement;
	}

	/**
	 * 
	 * @returns {import('./commons.js').ParserWhileStatementNode}
	 */
	#parseWhile() {
		const statement = this.#parseBlock();

		this.#expect(LexerTokenTypes.While);

		const test = /**@type {import('./commons.js').ParserExpressionNode}*/(this.#parseOr());
		if(!parserNodeWithin(ParserExpressionNodeTypes, test.type))
			throw this.TuberParserError(`Se esperaba una expresión lógica o verificable en condición de repetición`);

		if(statement.type === ParserNodeTypes.Conditional)
			throw this.TuberParserError('Sentencia condicional inesperada en medio del análisis una sentencia MIENTRAS');

		const body = /**@type {import('./commons.js').ParserBlockBody}*/(statement.body);

		while(this.#current.type !== LexerTokenTypes.BlockClose)
			body.push({ ...this.#parseStatement(), number: this.#statementNumber++ });
		
		return {
			...statement,
			type: ParserNodeTypes.WhileLoop,
			test: test,
			body,
		};
	}

	/**
	 * 
	 * @returns {import('./commons.js').ParserWhileStatementNode}
	 */
	#parseDoWhile() {
		const statement = this.#parseBlock();

		this.#expect(LexerTokenTypes.DoOpen);

		if(statement.type === ParserNodeTypes.Conditional)
			throw this.TuberParserError('Sentencia condicional inesperada en medio del análisis una sentencia HACER...YSEGUIR MIENTRAS');

		const body = /**@type {import('./commons.js').ParserBlockBody}*/(statement.body);

		while(this.#current.type !== LexerTokenTypes.DoClose)
			body.push({ ...this.#parseStatement(), number: this.#statementNumber++ });
		
		this.#digest();
		this.#expect(LexerTokenTypes.While);

		const test = /**@type {import('./commons.js').ParserExpressionNode}*/(this.#parseOr());
		if(!parserNodeWithin(ParserExpressionNodeTypes, test.type))
			throw this.TuberParserError(`Se esperaba una expresión lógica o verificable en condición de repetición`);
		
		return {
			...statement,
			type: ParserNodeTypes.DoWhileLoop,
			test: test,
			body,
		};
	}

	/**
	 * 
	 * @returns {import('./commons.js').ParserForStatementNode|import('./commons.js').ParserForInStatementNode}
	 */
	#parseFor() {
		let statement = /**@type {import('./commons.js').ParserForStatementNode|import('./commons.js').ParserForInStatementNode}*/
			(this.#parseSimpleFor());
			
		const body = /**@type {import('./commons.js').ParserBlockBody}*/(statement.body);

		if(this.#verify(LexerTokenTypes.For) && this.#current.value === 'cada' && this.#digest()) {
			const element = this.#parseExpression();
			if(element.type !== ParserNodeTypes.Identifier)
				throw this.TuberParserError(`Se esperaba un identificador como elemento de iteración de sentencia PARA CADA, pero se recibió: ${ParserToLanguageType.get(element.type) ?? 'Nada'}`);

			this.#expect(LexerTokenTypes.In, 'Se esperaba el operador "en" entre el identificador de elemento y el identificador de Lista en estructura PARA CADA');

			const list = this.#parseExpression();

			while(this.#assert(this.#current).type !== LexerTokenTypes.BlockClose)
				body.push({ ...this.#parseStatement(), number: this.#statementNumber++ });

			return {
				type: ParserNodeTypes.ForInLoop,
				element,
				list,
				body,
			};
		}

		while(this.#current.type !== LexerTokenTypes.BlockClose)
			body.push({ ...this.#parseStatement(), number: this.#statementNumber++ });
		
		return statement;
	}

	#parseSimpleFor() {
		let statement = this.#parseBlock();

		if(statement.type !== ParserNodeTypes.Block)
			throw this.TuberParserError(`Se esperaba un bloque en sentencia PARA, pero se recibió: ${statement?.type ?? 'Nada'}`);

		this.#expect(LexerTokenTypes.For);

		if(this.#current.type !== LexerTokenTypes.For) {
			const assignment = /**@type {import('./commons.js').ParserAssignmentExpressionNode}*/(this.#parseAssign());
			if(assignment.type !== ParserNodeTypes.AssignExpression)
				throw this.TuberParserError(`Se esperaba una expresión de asignación como primer expresión de sentencia PARA`);

			this.#expect(LexerTokenTypes.While);
			const test = /**@type {import('./commons.js').ParserExpressionNode}*/(this.#parseOr());
			if(!parserNodeWithin(ParserExpressionNodeTypes, test.type))
				throw this.TuberParserError(`Se esperaba una expresión condicional, lógica o verificable como segunda expresión de sentencia PARA`);
			
			const step = this.#parseStatement();
			if(step.type !== ParserNodeTypes.Expression)
				throw this.TuberParserError(`Se esperaba una sentencia de expresión como tercer componente de estructura PARA, pero se recibió: ${ParserToLanguageType.get(step.type) ?? 'Nada'}`);
			
			if(/**@type {import('./commons.js').ParserExpressionStatementNode}*/(step).expression.type !== ParserNodeTypes.UpdateExpression)
				throw this.TuberParserError('Se esperaba una sentencia de expresión de actualización como tercer componente de estructura PARA');

			/**@type {import('./commons.js').ParserForStatementNode}*/
			const forStatement = {
				type: ParserNodeTypes.ForLoop,
				body: statement.body,
				assignment,
				test,
				step,
			};

			return forStatement;
		}

		return statement;
	}

	/**
	 * @returns {import('./commons.js').ParserBasicScopeNode|(import('./commons.js').ParserConditionalStatementNode&import('./commons.js').ParserStatementMetadata)}
	 */
	#parseBlock() {
		/**@type {import('./commons.js').ParserBlockBody}*/
		const body = [];

		if(this.#current.type === LexerTokenTypes.BlockOpen && this.#digest()) {
			while(/**@type {import('./commons.js').LexerTokenType}*/(this.#current.type) !== LexerTokenTypes.BlockClose) {
				const statementNumber = this.#statementNumber++;
				body.push({ ...this.#parseStatement(), number: statementNumber });
			}
			this.#statementNumber++;
		}

		if(this.#current.type === LexerTokenTypes.ConditionChange && this.#digest()) {
			if(/**@type {import('./commons.js').LexerTokenType}*/(this.#current.type) === LexerTokenTypes.ConditionOpen)
				return /**@type {import('./commons.js').ParserBlockItem}*/
					({ ...this.#parseConditional(), number: this.#statementNumber++ });

			if(/**@type {import('./commons.js').LexerTokenType}*/(this.#current.type) !== LexerTokenTypes.BlockClose)
				body.push({ ...this.#parseStatement(), number: this.#statementNumber++ });

			this.#statementNumber++;
		}
		
		let block = {
			type: ParserNodeTypes.Block,
			body: [],
		};

		return block;
	}

	/**
	 * Parsea una expresión
	 * @returns {import('./commons.js').ParserExpressionNode}
	 */
	#parseExpression() {
		let block = this.#parseAssign();

		return /**@type {import('./commons.js').ParserExpressionNode}*/(block);
	}

	/**
	 * Parsea una asignación
	 * @returns {import('./commons.js').ParserStatementNode}
	 */
	#parseDeclare() {
		const typeToken = this.#expect(LexerTokenTypes.DataType);
		const identifier = this.#expect(LexerTokenTypes.Identifier);
		const idType = LanguageToLexerType.get(typeToken.value);

		if(idType === LexerTokenTypes.Input)
			throw this.TuberParserError(`Tipo inválido en declaración: ${typeToken.value}`);

		/**@type {import('./commons.js').ParserStatementNode}*/
		const result = {
			type: ParserNodeTypes.Declare,
			identifier: {
				type: ParserNodeTypes.Identifier,
				name: identifier.value,
			},
			as: /**@type {import('./commons.js').ParserDataNodeType}*/(LexerToParserType.get(idType)),
		};

		return result;
	}

	/**
	 * Parsea una actualización de valor
	 * @returns {import('./commons.js').ParserNode}
	 */
	#parseUpdate() {
		let argument = this.#parseGlossary();

		if(argument.type !== LexerToParserType.get(LexerTokenTypes.Identifier))
			throw this.TuberParserError('El receptor de la asignación debe ser un identificador');

		argument = {
			type: ParserNodeTypes.UpdateExpression,
			operator: this.#statement,
			argument,
		};

		return argument;
	}

	/**
	 * Parsea un verificador de interrupción
	 * @returns {import('./commons.js').ParserStopStatementNode}
	 */
	#parseStop() {
		this.#expect(LexerTokenTypes.Assign);
		
		const stopMessage = this.#parseText();
		this.#expect(LexerTokenTypes.ConditionOpen);
		const test = /**@type {import('./commons.js').ParserExpressionNode}*/(this.#parseOr());
		if(!parserNodeWithin(ParserExpressionNodeTypes, test.type))
			throw this.TuberParserError(`Se esperaba una expresión condicional, lógica o verificable como condición de corte en sentencia PARAR`);

		return {
			type: ParserNodeTypes.Stop,
			test,
			stopMessage,
		};
	}

	/**
	 * Parsea una asignación
	 * @param {import('./commons.js').LexerToken} [registryType]
	 * @returns {import('./commons.js').ParserNode|import('./commons.js').ParserFunctionAssignmentExpressionNode}
	 */
	#parseAssign(registryType) {
		let receptor = this.#parseText();

		if(this.#verify(LexerTokenTypes.Assign)) {
			this.#digest();

			if(registryType && registryType.value === 'funcion') {
				if(receptor.type !== 'CallExpression')
					throw this.TuberParserError('El receptor de la asignación debe ser una maqueta de Función');
				
				return this.#parseRegistryAssignment(receptor);
			}

			if(receptor.type !== ParserNodeTypes.Identifier && receptor.type !== ParserNodeTypes.ArrowExpression)
				throw this.TuberParserError('El receptor de la asignación debe ser un identificador, elemento de lista o propiedad de glosario');

			if(this.#verify(LexerTokenTypes.DataType) && this.#assert(this.#current).value === 'funcion' && this.#digest())
				return this.#parseFunctionAssignment(receptor);
			else
				return this.#parseExpressionAssignment(receptor);
		}

		return receptor;
	}

	/**@param {import('./commons.js').ParserCallExpressionNode} receptor*/
	/**@returns {import('./commons.js').ParserFunctionAssignmentExpressionNode}*/
	#parseRegistryAssignment(receptor) {
		const reception = /**@type {import('./commons.js').ParserBlockNode}*/(this.#parseBlock());
		this.#expect(LexerTokenTypes.BlockClose, 'Se esperaba un cierre de cuerpo de Función');

		if(reception.type !== ParserNodeTypes.Block)
			throw this.TuberParserError('Se esperaba un cuerpo de función en modo de registro de función, en sentencia de registro');

		return {
			type: ParserNodeTypes.AssignExpression,
			receptor,
			reception,
		};
	}

	/**@returns {import('./commons.js').ParserFunctionAssignmentExpressionNode}*/
	#parseFunctionAssignment(receptor) {
		let identifier = receptor;
		if(this.#verify(LexerTokenTypes.Identifier))
			identifier = this.#parsePrimary();

		const args = this.#parseArguments();

		const call = {
			type: ParserNodeTypes.CallExpression,
			emitter: receptor,
			arguments: args,
		};
		
		const { type, ...restOfBlock } = this.#parseBlock();
		const reception = /**@type {import('./commons.js').ParserNamedBlockNode}*/({ type, identifier, ...restOfBlock });
		this.#expect(LexerTokenTypes.BlockClose, 'Se esperaba un cierre de Función');

		if(reception.type !== ParserNodeTypes.Block)
			throw this.TuberParserError(`Se esperaba un cuerpo de función como recepción para la expresión de función receptora en sentencia de asignación. Sin embargo, se recibió: ${reception.type}`);

		return {
			type: ParserNodeTypes.AssignExpression,
			receptor: call,
			reception,
		};
	}

	/**@returns {import('./commons.js').ParserAssignmentExpressionNode}*/
	#parseExpressionAssignment(receptor) {
		const reception = /**@type {import('./commons.js').ParserExpressionNode}*/(this.#parseAssign());
		if(!parserNodeWithin(ParserLiteralNodeTypes, reception.type)
		&& !parserNodeWithin(ParserExpressionNodeTypes, reception.type))
			throw this.TuberParserError(`Se esperaba una expresión como recepción en sentencia de asignación, pero se recibió: ${ParserToLanguageType.get(reception.type)}`);

		return {
			type: ParserNodeTypes.AssignExpression,
			receptor,
			reception,
		};
	}

	/**
	 * Parsea un texto
	 * @returns {import('./commons.js').ParserExpressionNode}
	 */
	#parseText() {
		if(this.#current.type !== LexerTokenTypes.DataType)
			return this.#parseOr();

		if(this.#current.value === LexerTokenTypes.Input)
			throw this.TuberParserError(`Tipo de asignación inválido: ${this.#current.value}`);

		const tokenType = LanguageToLexerType.get(this.#current.value);
		if(tokenType !== LexerTokenTypes.Text)
			return this.#parseGlossary();

		this.#digest();
		let expectGroupClose = false;
		if(this.#current.value === LexerTokenTypes.GroupOpen) {
			this.#digest();
			expectGroupClose = true;
		}
		const text = this.#parseTextTemplate();
		if(expectGroupClose)
			this.#expect(LexerTokenTypes.GroupClose);

		return text;
	}

	/**
	 * Parsea un glosario
	 * @returns {import('./commons.js').ParserExpressionNode}
	 */
	#parseGlossary() {
		if(this.#current.type !== LexerTokenTypes.DataType)
			return this.#parseOr();

		if(this.#current.value === LexerTokenTypes.Input)
			throw this.TuberParserError(`Tipo de asignación inválido: ${this.#current.value}`);

		const tokenType = LanguageToLexerType.get(this.#current.value);
		if(tokenType !== LexerTokenTypes.Glossary)
			return this.#parseList();

		this.#digest();
		let expectGroupClose = false;
		if(this.#current.value === LexerTokenTypes.GroupOpen) {
			this.#digest();
			expectGroupClose = true;
		}

		const properties = /**@type {Array<import('./commons.js').ParserPropertyExpressionNode>}*/([]);
		this.#insideListing = true;
		while(!this.#verify(LexerTokenTypes.Statement, LexerTokenTypes.GroupClose, LexerTokenTypes.EoF)) {
			let key = this.#parseExpression();
			if(key.type !== ParserNodeTypes.Identifier)
				throw this.TuberParserError('Se esperaba un identificador de miembro de Glosario');
			this.#expect(LexerTokenTypes.Colon);
			const value = this.#parseExpression();
			properties.push({
				type: ParserNodeTypes.Property,
				key,
				value,
			});
			
			if(!this.#verify(LexerTokenTypes.Comma))
				break;
			this.#digest();
			if(this.#verify(LexerTokenTypes.Comma))
				throw this.TuberParserError('No se pueden añadir comas extra en expresiones de Glosario');
		}
		this.#insideListing = false;

		if(expectGroupClose)
			this.#expect(LexerTokenTypes.GroupClose);

		return {
			type: ParserNodeTypes.Glossary,
			properties,
		}
	}

	/**
	 * Parsea una lista
	 * @returns {import('./commons.js').ParserExpressionNode}
	 */
	#parseList() {
		if(this.#current.type !== LexerTokenTypes.DataType)
			return this.#parseMember();
		
		const tokenType = LanguageToLexerType.get(this.#current.value);
		if(tokenType !== LexerTokenTypes.List)
			return this.#parseLiteral();

		this.#digest();
		let expectGroupClose = false;
		if(this.#current.value === LexerTokenTypes.GroupOpen) {
			this.#digest();
			expectGroupClose = true;
		}

		/**@type {Array<import('./commons.js').ParserEvaluableExpressionNode>}*/
		const elements = [];
		this.#insideListing = true;
		while(!Object.values(ParserStatementNodeTypes).includes(this.#current.value)) {
			const expression = this.#parseExpression();

			if(expression.type === ParserNodeTypes.AssignExpression)
				throw this.TuberParserError(`Se esperaba una expresión que pudiera evaluarse a un valor primitivo u de estructura, pero se recibió: ${expression.type}`);

			elements.push(expression);

			if(this.#verify(LexerTokenTypes.Comma))
				break;
			this.#digest();
			while(this.#verify(LexerTokenTypes.Comma) && this.#digest())
				elements.push(null);
		}
		this.#insideListing = false;
		
		if(expectGroupClose)
			this.#expect(LexerTokenTypes.GroupClose);

		return {
			type: ParserNodeTypes.List,
			elements,
		}
	}

	/**
	 * Parsea un literal
	 * @returns {import('./commons.js').ParserExpressionNode}
	 */
	#parseLiteral() {
		if(this.#current.type !== LexerTokenTypes.DataType)
			return this.#parseOr();
		
		const dataTypeValue = this.#digest().value;
		const targetType = LanguageDataToParserType.get(dataTypeValue);
		if(targetType == undefined)
			throw this.TuberParserError(`Se esperaba un literal de tipo de dato, pero se recibió: ${dataTypeValue}`);

		const reception = /**@type {import('./commons.js').ParserExpressionNode}*/(this.#parseCombination());

		if(!parserNodeWithin(ParserExpressionNodeTypes, reception.type))
			throw this.TuberParserError(`Se esperaba una expresión literal, pero se recibió: ${ParserToLanguageType.get(reception.type) ?? 'Nada'}`);
		
		return /**@type {import('./commons.js').ParserEvaluableExpressionNode}*/({
			...reception,
			as: targetType,
		});
	}

	/**
	 * Parsea un "O" lógico
	 * @returns {import('./commons.js').ParserExpressionNode}
	 */
	#parseOr() {
		let leftOperand = this.#parseAnd();

		while(this.#current.type === LexerTokenTypes.Or) {
			this.#digest();
			const rightOperand = this.#parseAnd();
			leftOperand = {
				type: ParserNodeTypes.LogicalExpression,
				leftOperand,
				operator: 'o',
				rightOperand,
			};
		}
		
		return leftOperand;
	}
	
	/**
	 * Parsea un "Y" lógico
	 * @returns {import('./commons.js').ParserExpressionNode}
	*/
	#parseAnd() {
		let leftOperand = this.#parseEquality();

		while(this.#current.type === LexerTokenTypes.And) {
			this.#digest();
			const rightOperand = this.#parseEquality();
			leftOperand = {
				type: ParserNodeTypes.LogicalExpression,
				leftOperand,
				operator: 'y',
				rightOperand,
			};
		}

		return leftOperand;
	}

	/**
	 * Parsea una igualdad lógica
	 * @returns {import('./commons.js').ParserExpressionNode}
	*/
	#parseEquality() {
		let leftOperand = this.#parseComparison();

		while(this.#verify(LexerTokenTypes.Equals, LexerTokenTypes.Not)) {
			let operator = this.#digest().value;
			if(operator === 'no')
				operator += ` ${this.#expect(LexerTokenTypes.Equals).value}`;

			const rightOperand = this.#parseComparison();
			leftOperand = {
				type: ParserNodeTypes.LogicalExpression,
				leftOperand,
				operator,
				rightOperand,
			};
		}

		if(this.#verify(LexerTokenTypes.Not) && !/**@type {Array<import('./commons.js').LexerTokenType>}*/([ LexerTokenTypes.Equals, LexerTokenTypes.Compare ]).includes(this.#next.type))
			throw this.TuberParserError('Operador lógico inválido');

		return leftOperand;
	}

	/**
	 * Parsea una comparación lógica
	 * @returns {import('./commons.js').ParserExpressionNode}
	 */
	#parseComparison() {
		let leftOperand = this.#parseCombination();

		while(this.#current.type === LexerTokenTypes.Compare || this.#current.type === LexerTokenTypes.Not && this.#next.type === LexerTokenTypes.Compare) {
			let operator = this.#digest().value;
			if(operator === 'no')
				operator += ` ${this.#expect(LexerTokenTypes.Compare).value}`;
			const rightOperand = this.#parseCombination();
			leftOperand = {
				type: ParserNodeTypes.LogicalExpression,
				leftOperand,
				operator,
				rightOperand,
			};
		}

		return leftOperand;
	}

	/**
	 * Parsea sumas y restas
	 * @returns {import('./commons.js').ParserExpressionNode}
	 */
	#parseCombination() {
		let leftOperand = this.#parseFactor();
		
		while(this.#current.type === LexerTokenTypes.Combination) {
			const operator = this.#current.value;
			this.#digest();
			let rightOperand = this.#parseFactor();
			leftOperand = {
				type: ParserNodeTypes.BinaryExpression,
				operator,
				leftOperand,
				rightOperand,
			};
		}

		return leftOperand;
	}

	/**
	 * Parsea multiplicaciones, divisiones y operaciones de módulo
	 * @returns {import('./commons.js').ParserExpressionNode}
	 */
	#parseFactor() {
		let leftOperand = this.#parsePowers();
		
		while(this.#current.type === LexerTokenTypes.Factor) {
			const operator = this.#current.value;
			this.#digest();
			let rightOperand = this.#parsePowers();
			leftOperand = {
				type: ParserNodeTypes.BinaryExpression,
				operator,
				leftOperand,
				rightOperand
			};
		}
		
		return leftOperand;
	}

	/**
	 * Parsea potencias y funciones matemáticas
	 * @returns {import('./commons.js').ParserExpressionNode}
	 */
	#parsePowers() {
		let leftOperand = this.#parseUnary();
		
		while(this.#current.type === LexerTokenTypes.Power) {
			const operator = this.#current.value;
			this.#digest();
			let rightOperand = this.#parsePowers();
			
			leftOperand = {
				type: ParserNodeTypes.BinaryExpression,
				operator,
				leftOperand,
				rightOperand
			};
		}

		return leftOperand;
	}

	/**
	 * Parsea expresiones unarias
	 * @returns {import('./commons.js').ParserExpressionNode}
	 */
	#parseUnary() {
		if(this.#verify(LexerTokenTypes.Combination)
		|| (this.#verify(LexerTokenTypes.Not) && !this.#verifyNext(LexerTokenTypes.Equals, LexerTokenTypes.Compare))) {
			return {
				type: ParserNodeTypes.UnaryExpression,
				operator: this.#digest().value,
				argument: this.#parseMemberCall(),
			};
		}

		return this.#parseMemberCall();
	}

	/**
	 * Parsea llamados de miembros
	 * @returns {import('./commons.js').ParserExpressionNode}
	 */
	#parseMemberCall() {
		let member = this.#parseMember();

		if(this.#verify(LexerTokenTypes.GroupOpen)) {
			if(member.type === ParserNodeTypes.AssignExpression)
				throw this.TuberParserError(`Se esperaba una expresión que pueda contener una función, pero se recibió: ${member.type}`);

			member = this.#parseFunctionCall(member);
				
			if(this.#verify(LexerTokenTypes.Arrow))
				throw this.TuberParserError('No se permiten expresiones de miembro luego de una función');
		}

		return member;
	}

	/**
	 * Parsea una llamada de función desde un miembro emisor
	 * @param {import('./commons.js').ParserEvaluableExpressionNode} emitter El emisor de la llamada de función
	 * @returns {import('./commons.js').ParserExpressionNode}
	 */
	#parseFunctionCall(emitter) {
		/**@type {import('./commons.js').ParserCallExpressionNode}*/
		let expr = {
			type: ParserNodeTypes.CallExpression,
			emitter,
			arguments: this.#parseArguments(),
		};

		if(this.#verify(LexerTokenTypes.GroupOpen))
			return this.#parseFunctionCall(expr);

		return expr;
	}

	/**
	 * Evalúa 1 ó más expresiones y las devuelve como un arreglo de argumentos
	 * @returns {Array<import('./commons.js').ParserArgumentNode>} El arreglo de argumentos
	 */
	#parseArguments() {
		// console.log('En parseArguments:', this.#current);
		this.#expect(LexerTokenTypes.GroupOpen, 'Se esperaba una apertura de función');

		const wasInsideListing = this.#insideListing;
		this.#insideListing = true;

		const args = this.#verify(LexerTokenTypes.GroupClose, LexerTokenTypes.Statement, LexerTokenTypes.EoF)
			? []
			: this.#parseArgumentsList();
		
		this.#insideListing = wasInsideListing;

		this.#expect(LexerTokenTypes.GroupClose, 'Se esperaba un cierre de función');

		return args;
	}

	/**
	 * Evalúa una secuencia de expresiones separadas por coma y las devuelve como un arreglo de argumentos
	 * @returns {Array<import('./commons.js').ParserArgumentNode>} El arreglo de argumentos
	 */
	#parseArgumentsList() {
		const args = [ this.#parseArgument() ];
		let foundOptional = args[0].default != undefined;

		while(this.#current.type === LexerTokenTypes.Comma && this.#digest()) {
			const arg = this.#parseArgument();
			if(foundOptional && arg.default == undefined)
				throw this.TuberParserError(`Los parámetros obligatorios deben escribirse antes que los parámetros opcionales en las declaraciones de función`);
			
			args.push(arg);
			foundOptional ||= arg.default != undefined;
		}

		return args;
	}

	/**
	 * 
	 * @returns {import('./commons.js').ParserArgumentNode}
	 */
	#parseArgument() {
		const expr = this.#parseExpression();
		if(expr.type === ParserNodeTypes.AssignExpression)
			throw this.TuberParserError('No se permite tratar una expresión de asignación como argumento de función');

		let defExpr;
		if(this.#verify(LexerTokenTypes.Colon) && this.#digest()) {
			defExpr = this.#parseExpression();
			
			if(defExpr.type === ParserNodeTypes.AssignExpression)
				throw this.TuberParserError('No se permite tratar una expresión de asignación como argumento de función');
		}

		return {
			...expr,
			default: defExpr,
		};
	}

	/**
	 * Parsea miembros y busca propiedades de miembro
	 * @returns {import('./commons.js').ParserExpressionNode}
	 */
	#parseMember() {
		let memberExpr = this.#parsePrimary();

		while(this.#current.type === LexerTokenTypes.Arrow && this.#digest()) {
			let property = this.#parsePrimary();

			if(property.type !== ParserNodeTypes.Identifier && property.type !== ParserNodeTypes.Numeric)
				throw this.TuberParserError('Se esperaba un identificador o expresión entre paréntesis a la derecha de una expresión de flecha');

			return {
				type: ParserNodeTypes.ArrowExpression,
				container: memberExpr,
				property: property,
			};
		}

		return memberExpr;
	}
	
	/**
	 * Parsea una expresión primaria
	 * @returns {import('./commons.js').ParserExpressionNode} La expresión evaluada
	 */
	#parsePrimary() {
		const tokenType = this.#current.type;
		// console.log('Verificando casos de parsePrimary con:', this.#current);
		switch(tokenType) {
		case LexerTokenTypes.GroupOpen: {
			this.#digest();
			const wasInsideTemplate = this.#insideTemplate;
			const wasInsideListing = this.#insideListing;
			this.#insideTemplate = false;
			this.#insideListing = false;
			const expr = this.#parseExpression();
			this.#insideTemplate = wasInsideTemplate;
			this.#insideListing = wasInsideListing;
			this.#expect(LexerTokenTypes.GroupClose);
			return expr;
		}
		
		case LexerTokenTypes.Identifier:
			return {
				type: ParserNodeTypes.Identifier,
				name: this.#digest().value,
			};

		case LexerTokenTypes.Number:
			return {
				type: ParserNodeTypes.Numeric,
				value: this.#digest().value,
			};

		case LexerTokenTypes.Text:
			return this.#parseTextTemplate();

		case LexerTokenTypes.Boolean:
			return {
				type: ParserNodeTypes.Boolean,
				value: this.#digest().value,
			};
		
		case LexerTokenTypes.Nada:
			this.#digest();
			return {
				type: ParserNodeTypes.Nada,
				value: null,
			};

		case LexerTokenTypes.GroupClose:
			throw this.TuberParserError('Se esperaba una expresión entre paréntesis');
		}

		throw this.TuberParserError(`Token inesperado: ${this.#current.value}`);
	}

	/**
	 * Parsea una plantilla de texto
	 * @returns {import('./commons.js').ParserEvaluableExpressionNode | import('./commons.js').ParserTextTemplateExpressionNode} El valor de texto o la plantilla de texto evaluados
	 */
	#parseTextTemplate() {
		let text;
		if(this.#current.type === LexerTokenTypes.Text)
			text = { type: ParserNodeTypes.Text, value: this.#digest().value };
		else
			text = this.#parseExpression();

		if(!this.#insideTemplate && !this.#insideListing && this.#current.type === LexerTokenTypes.Comma) {
			const expressions = [ text ];
			
			this.#insideTemplate = true;
			while(this.#current.type === LexerTokenTypes.Comma) {
				this.#digest();
				expressions.push(this.#parseExpression());
			}
			this.#insideTemplate = false;
			
			return {
				type: ParserNodeTypes.TextTemplate,
				expressions,
			}
		}

		if(text.type === ParserNodeTypes.AssignExpression)
			throw this.TuberParserError('No se permiten expresiones de asignación en maquetaciones de plantillas de Texto');

		if(text.type !== ParserNodeTypes.Text || typeof text.value !== 'string') {
			return {
				...text,
				as: ParserNodeTypes.Text,
			};
		}

		return {
			type: ParserNodeTypes.Text,
			value: text.value,
		}
	}
};

module.exports = {
	ParserNodeTypes,
	LexerToParserType,
	ParserToLanguageType,
	TuberParser,
};