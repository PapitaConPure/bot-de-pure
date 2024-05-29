const { Token, TokenKinds, StatementVerbs, translateTokenKind, translateTokenKinds } = require('../lexer/tokens');
const { BindingPowers, Associativities } = require('../ast/ast');
const { StatementKinds } = require('../ast/statements');
const { parseBlock } = require('./syntax/statementParsing');
const { stmtLookup, nudLookup, ledLookup, bpLookup, createLookups, assLookup } = require('./lookups.js');

/**Representa un Analizador Sintáctico de PuréScript*/
class Parser {
	/**@type {Array<Error>}*/
	errorStack;
	/**@type {Array<Token>}*/
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
	 * @param {Token} [token]
	 */
	TuberParserError(message, token = this.current) {
		const specifier = `Línea: ${token.line} / Posición: ${token.start}~${token.end} - `;
		const err = new Error(specifier + message);
		err.name = 'TuberParserError';
		return err;
	}

	/**
	 * Devuelve el token actual, sin consumirlo
	 * @returns {Token}
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
	 * @returns {Token}
	 */
	advance() {
		return this.tokens[this.#pos++];
	}

	/**
	 * Se asegura de que el token actual sea del tipo indicado. Si lo es, lo consume y devuelve; si no, alza un error.
	 * @param {import('../lexer/tokens').TokenKind} tokenKind
	 * @param {String} [errorMessage]
	 * @returns {Token}
	 */
	expect(tokenKind, errorMessage = null) {
		const token = this.advance();

		if(token.kind !== tokenKind) {
			this.#pos--;
			errorMessage ??= `Se esperaba un token de tipo ${translateTokenKind(tokenKind)}, pero se recibió: ${token.value}`;
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
	 * @returns {{ orFail: (errorMessage?: String) => Token }}
	 */
	expectAny(...tokenKinds) {
		const token = this.advance();
		
		if(!token.isAny(...tokenKinds)) {
			this.#pos--;
			const parser = this;
			return {
				orFail: function(errorMessage = `Se esperaba un token de tipo: ${translateTokenKinds(...tokenKinds).join('/')}, pero se recibió: ${token.translated}`) {
					throw parser.TuberParserError(errorMessage);
				},
			};
		}
			
		return {
			orFail: function(errorMessage = null) {
				return token;
			},
		};
	}

	/**
	 * Se asegura de que el token actual sea del tipo indicado. Si lo es, lo devuelve sin consumirlo; si no, alza un error
	 * @param {import('../lexer/tokens').TokenKind} tokenKind
	 * @param {String} [errorMessage]
	 * @returns {Token}
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
	 * @returns {{ orFail: (errorMessage?: String) => Token }}
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
			orFail: function(errorMessage = null) {
				return token;
			},
		};
	}

	/**
	 * @param {Array<Token>} tokens
	 * @returns {import('../ast/statements').ProgramStatement}
	 */
	parse(tokens) {
		if(!Array.isArray(tokens))
			throw 'Se esperaba una Array al analizar tokens de PuréScript';

		this.errorStack = [];
		this.tokens = tokens;
		this.#pos = 0;

		return {
			kind: StatementKinds.PROGRAM,
			body: parseBlock(this),
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
			throw this.TuberParserError(`Se esperaba un token prefijo u primario, pero se recibió: ${translateTokenKind(tokenKind)}, de valor: ${this.current.value}`);

		rightAssociative ??= assLookup.get(tokenKind) ?? Associativities.LEFT;
		const nudHandler = nudLookup.get(tokenKind);
		let left = nudHandler(this);

		const actualBp = bp + rightAssociative;

		while(bpLookup.get(this.current.kind) > actualBp) {
			const tokenKind = this.current.kind;
			if(!ledLookup.has(tokenKind))
				throw this.TuberParserError(`Se esperaba un token infijo u sufijo, pero se recibió: ${translateTokenKind(tokenKind)}, de valor: ${this.current.value}`);

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
		
		throw this.TuberParserError(`Se esperaba un indicador de sentencia válido, pero se recibió: ${translateTokenKind(this.current.kind)}, con valor: ${this.current.value}`);
	}
}

module.exports = {
	Parser,
};
