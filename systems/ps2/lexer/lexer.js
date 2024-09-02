const { TokenKinds, Token } = require('./tokens.js');
const { shortenText, toLowerCaseNormalized } = require('../../../func.js');

/**Representa un Analizador Léxico de PuréScript*/
class Lexer {
	/**@type {Array<{ match: String, kind: import('./tokens.js').TokenKind, value?: * }>}*/
	#keywords;
	/**@type {Array<Pattern>}*/
	#patterns;
	/**@type {Array<Token>}*/
	#tokens;
	/**@type {String}*/
	#source;
	/**@type {Array<String>}*/
	#sourceLines;
	/**@type {Number}*/
	#pos;
	/**@type {Number}*/
	#col;
	/**@type {Number}*/
	#line;
	/**@type {Boolean}*/
	handleCommentStatement;

	/**
	 * Crea un nuevo Lexer con el source indicado
	 */
	constructor() {
		this.#tokens = [];
		this.#source = null;
		this.#sourceLines = [];
		this.#pos = this.#col = this.#line = 1;

		this.#keywords = [
			{ match: 'verdadero', kind: TokenKinds.LIT_BOOLEAN, value: true },
			{ match: 'falso', kind: TokenKinds.LIT_BOOLEAN, value: false },
			
			{ match: 'es', kind:TokenKinds.EQUALS },
			{ match: 'parece', kind:TokenKinds.SEEMS },
			{ match: 'precede', kind: TokenKinds.LESS },
			{ match: 'excede', kind: TokenKinds.GREATER },

			{ match: 'o', kind: TokenKinds.OR },
			{ match: 'y', kind: TokenKinds.AND },
			{ match: 'no', kind: TokenKinds.NOT },

			{ match: 'con', kind: TokenKinds.ASSIGNMENT },
			{ match: 'en', kind: TokenKinds.IN },
			{ match: 'desde', kind: TokenKinds.FROM },
			{ match: 'veces', kind: TokenKinds.TIMES },
			{ match: 'opcional', kind: TokenKinds.OPTIONAL },

			{ match: 'bloque', kind: TokenKinds.BLOCK_OPEN },
			{ match: 'fin', kind: TokenKinds.BLOCK_CLOSE },

			{ match: 'si', kind: TokenKinds.IF },
			{ match: 'sino', kind: TokenKinds.ELSE },
			{ match: 'mientras', kind: TokenKinds.WHILE },
			{ match: 'hacer', kind: TokenKinds.DO },
			{ match: 'hasta', kind: TokenKinds.UNTIL },
			{ match: 'repetir', kind: TokenKinds.REPEAT },
			{ match: 'para', kind: TokenKinds.FOR },

			{ match: 'leer', kind: TokenKinds.READ },
			{ match: 'crear', kind: TokenKinds.CREATE },
			{ match: 'guardar', kind: TokenKinds.SAVE },
			{ match: 'cargar', kind: TokenKinds.LOAD },
			{ match: 'sumar', kind: TokenKinds.ADD },
			{ match: 'restar', kind: TokenKinds.SUBTRACT },
			{ match: 'multiplicar', kind: TokenKinds.MULTIPLY },
			{ match: 'dividir', kind: TokenKinds.DIVIDE },
			{ match: 'extender', kind: TokenKinds.EXTEND },
			{ match: 'borrar', kind: TokenKinds.DELETE },
			{ match: 'ejecutar', kind: TokenKinds.EXECUTE },
			{ match: 'usar', kind: TokenKinds.EXECUTE },
			{ match: 'devolver', kind: TokenKinds.RETURN },
			{ match: 'terminar', kind: TokenKinds.END },
			{ match: 'parar', kind: TokenKinds.STOP },
			{ match: 'enviar', kind: TokenKinds.SEND },
			{ match: 'decir', kind: TokenKinds.SEND },
			{ match: 'comentar', kind: TokenKinds.COMMENT },

			{ match: 'numero', kind: TokenKinds.NUMBER },
			{ match: 'texto', kind: TokenKinds.TEXT },
			{ match: 'logico', kind: TokenKinds.BOOLEAN },
			{ match: 'lista', kind: TokenKinds.LIST },
			{ match: 'registro', kind: TokenKinds.REGISTRY },
			{ match: 'marco', kind: TokenKinds.EMBED },
			{ match: 'funcion', kind: TokenKinds.FUNCTION },
			{ match: 'nada', kind: TokenKinds.NADA, value: null },
		];

		this.#patterns = [
			{ match: /^\r?\n/, handler: this.#makeNewlineHandler() },
			{ match: /^[ \t\r]+/, handler: this.#makeSkipHandler() },
			{ match: /^\/\/.*/, handler: this.#makeSkipHandler() },

			{ match: '(', handler: this.#makeDefaultHandler(TokenKinds.PAREN_OPEN) },
			{ match: ')', handler: this.#makeDefaultHandler(TokenKinds.PAREN_CLOSE) },

			{ match: '->', handler: this.#makeDefaultHandler(TokenKinds.ARROW) },
			{ match: ':', handler: this.#makeDefaultHandler(TokenKinds.COLON) },
			{ match: ',', handler: this.#makeDefaultHandler(TokenKinds.COMMA) },
			{ match: '=>', handler: this.#makeDefaultHandler(TokenKinds.LAMBDA) },

			{ match: '+', handler: this.#makeDefaultHandler(TokenKinds.PLUS) },
			{ match: '-', handler: this.#makeDefaultHandler(TokenKinds.DASH) },
			{ match: '*', handler: this.#makeDefaultHandler(TokenKinds.STAR) },
			{ match: '/', handler: this.#makeDefaultHandler(TokenKinds.SLASH) },
			{ match: '%', handler: this.#makeDefaultHandler(TokenKinds.PERCENT) },
			{ match: '^', handler: this.#makeDefaultHandler(TokenKinds.CARET) },
			{ match: '**', handler: this.#makeDefaultHandler(TokenKinds.DOUBLE_STAR) },
			
			{ match: '<=', handler: this.#makeDefaultHandler(TokenKinds.LESS_EQUALS) },
			{ match: '<', handler: this.#makeDefaultHandler(TokenKinds.LESS) },
			{ match: '>=', handler: this.#makeDefaultHandler(TokenKinds.GREATER_EQUALS) },
			{ match: '>', handler: this.#makeDefaultHandler(TokenKinds.GREATER) },
			{ match: '!=', handler: this.#makeDefaultHandler(TokenKinds.NOT_EQUALS) },
			{ match: '==', handler: this.#makeDefaultHandler(TokenKinds.EQUALS) },
			
			{ match: '=', handler: this.#makeDefaultHandler(TokenKinds.ASSIGNMENT) },

			{ match: '||', handler: this.#makeDefaultHandler(TokenKinds.OR) },
			{ match: '&&', handler: this.#makeDefaultHandler(TokenKinds.AND) },
			{ match: '!', handler: this.#makeDefaultHandler(TokenKinds.NOT) },
			
			{ match: 'no excede', handler: this.#makeDefaultHandler(TokenKinds.LESS_EQUALS) },
			{ match: 'no precede', handler: this.#makeDefaultHandler(TokenKinds.GREATER_EQUALS) },
			{ match: 'no es', handler: this.#makeDefaultHandler(TokenKinds.NOT_EQUALS) },
			{ match: 'no parece', handler: this.#makeDefaultHandler(TokenKinds.NOT_SEEMS) },
			{ match: 'sino si', handler: this.#makeDefaultHandler(TokenKinds.ELSE_IF) },
			{ match: 'para cada', handler: this.#makeDefaultHandler(TokenKinds.FOR_EACH) },

			{ match: /^[A-Za-z_][A-Za-z0-9_]{0,99}/, handler: this.#makeSymbolHandler() },

			{ match: /^(?!_)(([0-9_]+([.][0-9]*)?)|([.][0-9]+))/, handler: this.#makeNumberHandler() },
			{ match: /^"(\\"|[^"])*"/, handler: this.#makeStringHandler() },
			{ match: /^'(\\'|[^'])*'/, handler: this.#makeStringHandler() },

			{ match: '"', handler: this.#makeInvalidHandler(`Faltó cerrar comillas dobles (\`"\`)`) },
			{ match: "'", handler: this.#makeInvalidHandler(`Faltó cerrar comillas simples (\`'\`)`) },
		];
	}

	/**
	 * @param {string} message
	 */
	TuberLexerError(message, errorOptions) {
		errorOptions ??= {};
		errorOptions.col ??= this.#col;
		errorOptions.line ??= this.#line;
		const lineString = this.lineString;
		const col = Math.max(1, Math.min(errorOptions.col, lineString.length));
		const line = errorOptions.line;
		message = [
			'```arm',
			lineString,
			`${' '.repeat(col - 1)}↑`,
			'```',
			`En línea **${line}**, columna **${col}** - ${message}`,
		].join('\n');
		const error = new Error(message);
		error.name = 'TuberLexerError';
		return error;
	}

	get source() {
		return this.#source;
	}

	get sourceLines() {
		return this.#sourceLines;
	}

	get pos() {
		return this.#pos;
	}

	get col() {
		return this.#col;
	}

	get line() {
		return this.#line;
	}

	get lookupTable() {
		return this.#keywords;
	}

	get lineString() {
		return this.#sourceLines[this.#line - 1];
	}

	/**
	 * Devuelve el caracter de source en la posición actual
	 */
	get current() {
		return this.#source[this.#pos - 1];
	}

	/**
	 * Devuelve el resto del source desde la posición actual
	 */
	get remainder() {
		return this.#source.slice(this.#pos - 1);
	}

	get atEOF() {
		return (this.#pos - 1) >= this.#source.length;
	}

	/**
	 * Tokeniza el string indicado, basándose en PuréScript
	 * @param {String} source 
	 * @returns {Array<Token>}
	 */
	tokenize(source) {
		if(typeof source !== 'string')
			throw this.TuberLexerError('Se esperaba un String válido para tokenizar');

		this.#tokens = [];
		this.#source = source.replace(/(^\s+)|(\s+$)/g, '');
		this.#sourceLines = this.#source.split(/\r?\n/g);
		this.#pos = this.#col = this.#line = 1;
		this.handleCommentStatement = false;

		/**@type {String}*/
		let match;
		/**@type {String}*/
		let normalizedRemainder;

		while(!this.atEOF) {
			match = null;
			normalizedRemainder = toLowerCaseNormalized(this.remainder);

			for(const pattern of this.#patterns) {
				match = matchPattern(pattern, normalizedRemainder);

				if(match != null) {
					const rawMatch = this.remainder.slice(0, match.length);
					pattern.handler(match, rawMatch);
					break;
				}
			}

			if(match == null) {
				const wsIndex = this.remainder.match(/[\r\s\b]/)?.index ?? this.remainder.length;
				throw this.TuberLexerError(`Símbolo no reconocido: \`${shortenText(this.remainder.slice(0, wsIndex), 12, ' (...)')}\``);
			}
		}

		this.addToken(new Token(this, TokenKinds.EOF, 'Fin de Código', this.#line, this.#col, this.#pos - 1, 1));
		return [ ...this.#tokens ];
	}

	/**
	 * @typedef {Object} LexerAdvanceOptions
	 * @property {Boolean} [advanceColumns=false]
	 * @property {Boolean} [newLine=false]
	 * @property {{ col: Number, line: Number, }} [override=null]
	 * 
	 * Avanza la posición del Lexer
	 * @param {Number} [steps=1] 
	 * @param {LexerAdvanceOptions} [options={}]
	 */
	advance(steps = 1, options = {}) {
		options.advanceColumns ??= false;
		options.newLine ??= false;
		this.#pos += steps;

		if(options.override != null && (options.override.col != null || options.override.line != null)) {
			if(options.override.col != null)
				this.#col = options.override.col;

			if(options.override.line != null)
				this.#line = options.override.line;
		} else if(options.newLine) {
			this.#col = 1;
			this.#line++;
		} else if(options.advanceColumns)
			this.#col += steps;
	}

	/**
	 * Añade un token al Lexer
	 * @param {Token} token
	 */
	addToken(token) {
		if(!this.handleCommentStatement)
			this.#tokens.push(token);
	}

	//#region Handlers
	/**
	 * 
	 * @param {import('./tokens').TokenKind} kind
	 * @returns {PatternHandler}
	 */
	#makeDefaultHandler(kind) {
		const lexer = this;
		return function(_, rawMatch) {
			const len = `${rawMatch}`.length;
			lexer.addToken(new Token(lexer, kind, rawMatch, lexer.line, lexer.col, lexer.pos - 1, len));
			lexer.advance(len, { advanceColumns: true });
		};
	}

	/**
	 * 
	 * @returns {PatternHandler}
	 */
	#makeNumberHandler() {
		const lexer = this;
		return function(matched) {
			const len = matched.length;
			const num = +matched.replace(/_/g, '');

			if(isNaN(num))
				throw lexer.TuberLexerError('Valor inválido en tokenización de número');

			lexer.addToken(new Token(lexer, TokenKinds.LIT_NUMBER, num, lexer.line, lexer.col, lexer.pos - 1, len));
			lexer.advance(len, { advanceColumns: true });
		};
	}

	/**
	 * 
	 * @returns {PatternHandler}
	 */
	#makeStringHandler() {
		const lexer = this;
		return function(match, rawMatch) {
			const len = match.length;

			//Arreglo de caracteres sin los ""
			const chars = rawMatch.slice(1, -1).split('');

			let col = lexer.col + 1; //Sumar los "" removidos
			let line = lexer.line;
			let rePos = -1;

			for(const c of chars) {
				if(c === '\n') {
					col = 1;
					line++;
				} else {
					if(c === '\\') {
						rePos = chars.indexOf('\\', rePos + 1);
						chars.splice(rePos, 1);
						
						switch(chars[rePos]) {
						case 'N':
						case 'n':
							chars[rePos] = '\n';
							break;

						case 'T':
						case 't':
							chars[rePos] = '\t';
							break;
	
						case '"': break;
						case '`': break;
						case "'": break;
						case '\\': break;
	
						default:
							const lineString = lexer.source.split(/\r?\n/g)[line - 1];
							throw lexer.TuberLexerError(`Caracter de escape inválido en literal de Texto: \`${c}\``, { col, line, lineString });
						}
					}

					col++;
				}
			}

			col++; //Sumar los "" removidos
			rawMatch = chars.join('');

			lexer.addToken(new Token(lexer, TokenKinds.LIT_TEXT, rawMatch, lexer.line, lexer.col, lexer.pos - 1, len));
			lexer.advance(len, { override: { col, line } }); //Aplicar cambios de columna y línea locales
			lexer.handleCommentStatement = false;
		};
	}

	/**
	 * 
	 * @returns {PatternHandler}
	 */
	#makeSymbolHandler() {
		const lexer = this;
		return function(match, rawMatch) {
			const len = match.length;
			const keyword = lexer.lookupTable.find(k => k.match === match);
			
			if(keyword) {
				if(keyword.kind !== TokenKinds.COMMENT)
					lexer.addToken(new Token(lexer, keyword.kind, rawMatch, lexer.line, lexer.col, lexer.pos - 1, len));
				else
					lexer.handleCommentStatement = true;
			} else {
				lexer.addToken(new Token(lexer, TokenKinds.IDENTIFIER, rawMatch, lexer.line, lexer.col, lexer.pos - 1, len));
			}

			lexer.advance(len, { advanceColumns: true });
		};
	}

	/**
	 * 
	 * @returns {PatternHandler}
	 */
	#makeNewlineHandler() {
		const lexer = this;
		return function(match, _) {
			const len = match.length;
			lexer.advance(len, { newLine: true });
			lexer.handleCommentStatement = false;
		};
	}

	/**
	 * @returns {PatternHandler}
	 */
	#makeSkipHandler() {
		const lexer = this;
		return function(matched) {
			const len = matched.length;
			lexer.advance(len, { advanceColumns: true });
		};
	}

	/**
	 * @param {String} errorMessage
	 * @returns {PatternHandler}
	 */
	#makeInvalidHandler(errorMessage) {
		const lexer = this;
		return function(_, __) {
			throw lexer.TuberLexerError(errorMessage);
		}
	}
	//#endregion
}

/**
 * @typedef {(match: string, rawMatch: string) => void} PatternHandler
 * @typedef {Object} Pattern
 * @property {String|RegExp} match
 * @property {PatternHandler} handler
 */

/**
 * @param {Pattern} pattern
 * @param {String} source
 */
function matchPattern(pattern, source) {
	if(typeof pattern.match === 'string')
		return stringPatternMatch(pattern.match, source);
	else
		return regexPatternMatch(pattern.match, source);
}

/**
 * @param {String} matcher
 * @param {String} source
 */
function stringPatternMatch(matcher, source) {
	const slicedSource = source.slice(0, matcher.length);

	return (slicedSource === matcher) ? slicedSource : null;
}

/**
 * @param {RegExp} matcher
 * @param {String} source
 */
function regexPatternMatch(matcher, source) {
	const match = matcher.exec(source);

	if(match == null)
		return null;

	if(match.index !== 0)
		return null;

	return match[0];
}

module.exports = {
	Lexer,
};
