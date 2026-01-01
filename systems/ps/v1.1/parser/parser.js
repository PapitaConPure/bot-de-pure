const { TokenKinds, translateTokenKind, translateTokenKinds } = require('../lexer/tokens');
const { Associativities } = require('../ast/ast');
const { StatementKinds } = require('../ast/statements');
const { parseBlock } = require('./syntax/statementParsing');
const { stmtLookup, nudLookup, ledLookup, bpLookup, createLookups, assLookup } = require('./lookups.js');

/**Representa un Analizador Sintáctico de PuréScript*/
class Parser {
	/**@type {Array<Error>}*/
	errorStack;
	/**@type {Array<import('../lexer/tokens').Token>}*/
	tokens;
	/**@type {Number}*/
	#pos;

	constructor() {
		this.errorStack = [];
		this.tokens = [];
		this.#pos = 0;
		createLookups();
	}

	/**
	 * @param {String} message 
	 * @param {import('../lexer/tokens').Token} [token]
	 */
	TuberParserError(message, token = null) {
		token ??= this.current;

		const { lineString, offset } = this.#formatParserErrorDisplay(token);
		const col = Math.max(0, Math.min(token.column - offset - 1, lineString.length));
		const rest = Math.max(1, Math.min(col + token.length, lineString.length) - col);

		const specifier = [
			'```arm',
			lineString || '//No hay información adicional para mostrar...',
			lineString ? `${' '.repeat(col)}${'↑'.repeat(rest)}` : '',
			'```',
			`**Valor**: \`${token.value}\``,
			`En línea **${token.line}**, columnas **${token.column}** a **${token.column + token.length}** - `,
		].join('\n');
		
		const err = new Error(specifier + message);
		err.name = 'TuberParserError';
		return err;
	}

	/**
	 * @param {import('../lexer/tokens').Token} token
	 */
	#formatParserErrorDisplay(token) {
		const suspensor = '(...)'
		const maxLength = 55;

		const columnEnd = token.column + token.length;
		const offset = Math.max(0, token.lineString.length - maxLength);
		let lineString = token.lineString || '//No hay información adicional para mostrar...';

		if(lineString.length < maxLength)
			return {
				lineString,
				offset,
			};

		const suspensorLength = suspensor.length + 1; //Considera el espacio

		if(columnEnd < maxLength) //Suspensor a la derecha
			lineString = lineString.slice(0, maxLength - suspensorLength) + ' ' + suspensor
		else if(token.column >= lineString.length) //Suspensor a la izquierda
			lineString = suspensor + ' ' + lineString.slice(lineString.length - maxLength - 1 + suspensorLength);
		else { //Dos suspensores
			let center = (token.column + columnEnd) * 0.5;
			const half1 = Math.floor(maxLength * 0.5);
			const half2 = maxLength - half1;
			if(token.column < (center - half1))
				center = token.column + half1;
			lineString = suspensor + ' ' + lineString.slice(center - half1 + suspensorLength, center + half2 - suspensorLength) + ' ' + suspensor;
		}

		return {
			lineString,
			offset,
		};
	}

	/**
	 * Devuelve el token actual, sin consumirlo
	 * @returns {import('../lexer/tokens').Token}
	 */
	get previous() {
		return this.tokens[Math.max(0, this.#pos - 1)];
	}

	/**
	 * Devuelve el token actual, sin consumirlo
	 * @returns {import('../lexer/tokens').Token}
	 */
	get current() {
		return this.tokens[this.#pos];
	}

	/**
	 * Verifica si todavía quedan tokens a analizar
	 * @returns {Boolean}
	 */
	get hasTokens() {
		return this.#pos < this.tokens.length && !this.current.is(TokenKinds.EOF);
	}

	/**
	 * Consume el token actual y lo devuelve
	 * @returns {import('../lexer/tokens').Token}
	 */
	advance() {
		return this.tokens[this.#pos++];
	}

	/**
	 * Se asegura de que el token actual sea del tipo indicado. Si lo es, lo consume y devuelve; si no, alza un error.
	 * @param {import('../lexer/tokens').TokenKind} tokenKind
	 * @param {String} [errorMessage]
	 * @returns {import('../lexer/tokens').Token}
	 */
	expect(tokenKind, errorMessage = null) {
		const token = this.advance();

		if(token.kind !== tokenKind) {
			this.#pos--;
			errorMessage ??= `Se esperaba un token de tipo: *${translateTokenKind(tokenKind)}*, pero se recibió: *${token.translated}*`;
			throw this.TuberParserError(errorMessage, token);
		}
		
		return token;
	}

	/**
	 * Se asegura de que el token actual sea de alguno de los tipos indicados y devuelve un objeto con el método "orFail", consumiendo el token.
	 * Si el token consumido era del tipo indicado, "orFail" devuelve el mismo; si no, "orFail" alza un error.
	 * 
	 * Al momento de arrojar un error, si se usa un mensaje personalizado en el método orFail, `this.current` será el token que lo ocasionó (caso especial)
	 * @param {...import('../lexer/tokens').TokenKind} tokenKinds
	 * @returns {{ orFail: (errorMessage?: String, token?: import('../lexer/tokens').Token) => import('../lexer/tokens').Token }}
	 */
	expectAny(...tokenKinds) {
		const expectedToken = this.advance();
		
		if(!expectedToken.isAny(...tokenKinds)) {
			this.#pos--;
			const parser = this;
			return {
				orFail: function(errorMessage = `Se esperaba un token de tipo: ${translateTokenKinds(...tokenKinds).join('/')}, pero se recibió: ${expectedToken.translated}`, token = null) {
					token ??= expectedToken;
					throw parser.TuberParserError(errorMessage, token);
				},
			};
		}
			
		return {
			orFail: function() {
				return expectedToken;
			},
		};
	}

	/**
	 * Se asegura de que el token actual sea del tipo indicado. Si lo es, lo devuelve sin consumirlo; si no, alza un error
	 * @param {import('../lexer/tokens').TokenKind} tokenKind
	 * @param {String} [errorMessage]
	 * @returns {import('../lexer/tokens').Token}
	 */
	ensure(tokenKind, errorMessage = null) {
		const token = this.current;
		
		if(!token.is(tokenKind)) {
			errorMessage ??= `Se esperaba un token de tipo ${translateTokenKind(tokenKind)}, pero se recibió: ${token.value}`;
			throw this.TuberParserError(errorMessage);
		}
			
		return token;
	}

	/**
	 * Se asegura de que el token actual sea de alguno de los tipos indicados y devuelve un objeto con el método "orFail", sin consumir el token.
	 * Si el token era del tipo indicado, "orFail" devuelve el mismo; si no, "orFail" alza un error
	 * @param {...import('../lexer/tokens').TokenKind} tokenKinds
	 * @returns {{ orFail: (errorMessage?: String) => import('../lexer/tokens').Token }}
	 */
	ensureAny(...tokenKinds) {
		const token = this.current;
		
		if(!token.isAny(...tokenKinds)) {
			const parser = this;
			return {
				orFail: function(errorMessage = `Se esperaba un token de tipo: ${translateTokenKinds(...tokenKinds).join('/')}, pero se recibió: ${token.value}`) {
					throw parser.TuberParserError(errorMessage);
				},
			};
		}
			
		return {
			orFail: function() {
				return token;
			},
		};
	}

	/**
	 * Tira un error si el Token actual no representa una expresión (no es un indicador de Sentencia)
	 * @param {String} errorMessage
	 * @param {import('../lexer/tokens').Token} [token]
	 */
	ensureExpression(errorMessage, token = null) {
		if(!this.hasTokens || this.current.isStatement)
			throw this.TuberParserError(errorMessage, token);
	}

	/**
	 * Tira un error si el Token actual no es un indicador de Sentencia
	 * @param {String} errorMessage
	 * @param {import('../lexer/tokens').Token} [token]
	 */
	ensureStatement(errorMessage, token = null) {
		if(!this.hasTokens || !this.current.isStatement)
			throw this.TuberParserError(errorMessage, token);
	}

	/**
	 * Analiza sintácticamente un conjunto de Tokens previamente extraídos de un análisis léxico por medio de un {@link Lexer}
	 * @param {Array<import('../lexer/tokens').Token>} tokens Los tokens extraídos del análisis léxico de PuréScript
	 * @returns {import('../ast/statements').ProgramStatement}
	 */
	parse(tokens) {
		if(!Array.isArray(tokens))
			throw 'Se esperaba una Array al analizar tokens de PuréScript';

		this.errorStack = [];
		this.tokens = tokens;
		this.#pos = 0;

		const body = parseBlock(this);

		return {
			kind: StatementKinds.PROGRAM,
			line: 1,
			column: 1,
			start: 0,
			end: body.length ? body[body.length - 1].end : 1,
			body,
		};
	}
	
	/**
	 * @param {import('../ast/ast').BindingPower} bp
	 * @param {import('../ast/ast').Associativity} [rightAssociative]
	 * @returns {import('../ast/expressions').Expression}
	 */
	parseExpression(bp, rightAssociative = null) {
		const tokenKind = this.current.kind;
		if(!nudLookup.has(tokenKind))
			throw this.TuberParserError(`Se esperaba un Token prefijo o primario válido, pero se recibió: *${translateTokenKind(tokenKind)}*`);

		rightAssociative ??= assLookup.get(tokenKind) ?? Associativities.LEFT;
		const nudHandler = nudLookup.get(tokenKind);
		let left = nudHandler(this);

		const actualBp = bp + rightAssociative;

		while(bpLookup.get(this.current.kind) > actualBp) {
			const tokenKind = this.current.kind;
			if(!ledLookup.has(tokenKind))
				throw this.TuberParserError(`Se esperaba un Token infijo u sufijo válido, pero se recibió: *${translateTokenKind(tokenKind)}*`);

			const ledHandler = ledLookup.get(tokenKind);
			left = ledHandler(this, left, bpLookup.get(this.current.kind), assLookup.get(this.current.kind));
		}

		return left;
	}

	/**
	 * 
	 * @returns {import('../ast/statements').Statement}
	 */
	parseStatement() {
		const tokenKind = this.current.kind;

		if(stmtLookup.has(tokenKind)) {
			const stmtHandler = stmtLookup.get(tokenKind);
			return stmtHandler(this);
		}
		
		throw this.TuberParserError(`Se esperaba un indicador de sentencia válido, pero se recibió: ${translateTokenKind(this.current.kind)}`);
	}
}

module.exports = {
	Parser,
};
