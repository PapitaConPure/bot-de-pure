import { TokenKinds, TokenKind, Token } from './tokens';
import { shortenText, toLowerCaseNormalized } from '../util/utils';

interface Keyword {
	match: string;
	kind: TokenKind;
	value?: unknown;
}

interface LexerAdvanceOptions {
	advanceColumns?: boolean;
	newLine?: boolean;
	override?: { col: number; line: number; };
}

interface PatternHandler {
	(match: string, rawMatch: string): void;
}

interface Pattern {
	match: string | RegExp;
	handler: PatternHandler;
}

/**@description Representa un Analizador Léxico de PuréScript.*/
export class Lexer {
	#keywords: Keyword[];
	#patterns: Pattern[];
	#tokens: Token[];
	#source: string;
	#sourceLines: string[];
	#pos: number;
	#col: number;
	#line: number;
	handleCommentStatement: boolean;

	/**@description Crea un nuevo Lexer con el source indicado.*/
	constructor() {
		this.#tokens = [];
		this.#source = null;
		this.#sourceLines = [];
		this.#pos = this.#col = this.#line = 1;

		this.#keywords = [
			{ match: 'con', kind: TokenKinds.ASSIGNMENT },

			{ match: 'o', kind: TokenKinds.OR },
			{ match: 'y', kind: TokenKinds.AND },
			{ match: 'no', kind: TokenKinds.NOT },

			{ match: 'es', kind:TokenKinds.EQUALS },
			{ match: 'parece', kind:TokenKinds.SEEMS },
			{ match: 'precede', kind: TokenKinds.LESS },
			{ match: 'excede', kind: TokenKinds.GREATER },

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

			{ match: 'bloque', kind: TokenKinds.BLOCK_OPEN },
			{ match: 'fin', kind: TokenKinds.BLOCK_CLOSE },

			{ match: 'numero', kind: TokenKinds.NUMBER },
			{ match: 'texto', kind: TokenKinds.TEXT },
			{ match: 'logico', kind: TokenKinds.BOOLEAN },
			{ match: 'lista', kind: TokenKinds.LIST },
			{ match: 'registro', kind: TokenKinds.REGISTRY },
			{ match: 'marco', kind: TokenKinds.EMBED },
			{ match: 'funcion', kind: TokenKinds.FUNCTION },
			{ match: 'nada', kind: TokenKinds.NADA, value: null },

			{ match: 'en', kind: TokenKinds.IN },
			{ match: 'desde', kind: TokenKinds.FROM },
			{ match: 'veces', kind: TokenKinds.TIMES },
			{ match: 'opcional', kind: TokenKinds.OPTIONAL },
			{ match: 'luego', kind: TokenKinds.AFTER },

			{ match: 'verdadero', kind: TokenKinds.LIT_BOOLEAN, value: true },
			{ match: 'falso', kind: TokenKinds.LIT_BOOLEAN, value: false },

			{ match: 'si', kind: TokenKinds.IF },
			{ match: 'sino', kind: TokenKinds.ELSE },
			{ match: 'mientras', kind: TokenKinds.WHILE },
			{ match: 'hacer', kind: TokenKinds.DO },
			{ match: 'hasta', kind: TokenKinds.UNTIL },
			{ match: 'repetir', kind: TokenKinds.REPEAT },
			{ match: 'para', kind: TokenKinds.FOR },
		];

		this.#patterns = [
			{ match: /^\r?\n/, handler: this.#makeNewlineHandler() },
			{ match: /^[ \t\r]+/, handler: this.#makeSkipHandler() },
			{ match: /^\/\/.*/, handler: this.#makeSkipHandler() },

			{ match: '(', handler: this.#makeDefaultHandler(TokenKinds.PAREN_OPEN) },
			{ match: ')', handler: this.#makeDefaultHandler(TokenKinds.PAREN_CLOSE) },

			{ match: '->', handler: this.#makeDefaultHandler(TokenKinds.ARROW) },
			{ match: ',', handler: this.#makeDefaultHandler(TokenKinds.COMMA) },
			{ match: ':', handler: this.#makeDefaultHandler(TokenKinds.COLON) },
			{ match: '?', handler: this.#makeDefaultHandler(TokenKinds.QUESTION) },
			{ match: '=>', handler: this.#makeDefaultHandler(TokenKinds.LAMBDA) },

			{ match: '+', handler: this.#makeDefaultHandler(TokenKinds.PLUS) },
			{ match: '-', handler: this.#makeDefaultHandler(TokenKinds.DASH) },
			{ match: '**', handler: this.#makeDefaultHandler(TokenKinds.DOUBLE_STAR) },
			{ match: '*', handler: this.#makeDefaultHandler(TokenKinds.STAR) },
			{ match: '/', handler: this.#makeDefaultHandler(TokenKinds.SLASH) },
			{ match: '%', handler: this.#makeDefaultHandler(TokenKinds.PERCENT) },
			{ match: '^', handler: this.#makeDefaultHandler(TokenKinds.CARET) },

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
			{ match: '.', handler: this.#makeDefaultHandler(TokenKinds.DOT) },

			{ match: /^"(\\"|[^"])*"/, handler: this.#makeStringHandler() },
			{ match: /^'(\\'|[^'])*'/, handler: this.#makeStringHandler() },

			{ match: '"', handler: this.#makeInvalidHandler(`Faltó cerrar comillas dobles (\`"\`)`) },
			{ match: "'", handler: this.#makeInvalidHandler(`Faltó cerrar comillas simples (\`'\`)`) },
		];
	}

	TuberLexerError(message: string, errorOptions: {  col?: number, line?: number, lineString?: string } = {}) {
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

	/**@description Devuelve el caracter de source en la posición actual.*/
	get current() {
		return this.#source[this.#pos - 1];
	}

	/**@description Devuelve el resto del source desde la posición actual.*/
	get remainder() {
		return this.#source.slice(this.#pos - 1);
	}

	get atEOF() {
		return (this.#pos - 1) >= this.#source.length;
	}

	/**@description Tokeniza el string indicado, basándose en PuréScript.*/
	tokenize(source: string): Token[] {
		if(typeof source !== 'string')
			throw this.TuberLexerError('Se esperaba un string válido para tokenizar');

		this.#tokens = [];
		this.#source = source.replace(/(^\s+)|(\s+$)/g, '');
		this.#sourceLines = this.#source.split(/\r?\n/g);
		this.#pos = this.#col = this.#line = 1;
		this.handleCommentStatement = false;

		/**@type {string}*/
		let match: string;
		/**@type {string}*/
		let normalizedRemainder: string;

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

	/**@description Avanza la posición del Lexer.*/
	advance(steps: number = 1, options: LexerAdvanceOptions = {}) {
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

	/**@description Añade un token al Lexer.*/
	addToken(token: Token) {
		if(!this.handleCommentStatement)
			this.#tokens.push(token);
	}

	//#region Handlers
	#makeDefaultHandler(kind: TokenKind): PatternHandler {
		return (_, rawMatch) => {
			const len = `${rawMatch}`.length;
			this.addToken(new Token(this, kind, rawMatch, this.line, this.col, this.pos - 1, len));
			this.advance(len, { advanceColumns: true });
		};
	}

	#makeNumberHandler(): PatternHandler {
		return (matched) => {
			const len = matched.length;
			const num = +matched.replace(/_/g, '');

			if(isNaN(num))
				throw this.TuberLexerError('Valor inválido en tokenización de número');

			this.addToken(new Token(this, TokenKinds.LIT_NUMBER, num, this.line, this.col, this.pos - 1, len));
			this.advance(len, { advanceColumns: true });
		};
	}

	#makeStringHandler(): PatternHandler {
		return (match, rawMatch) => {
			const len = match.length;

			//Arreglo de caracteres sin los ""
			const chars = rawMatch.slice(1, -1).split('');

			let col = this.col + 1; //Sumar los "" removidos
			let line = this.line;
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

						default: {
							const lineString = this.source.split(/\r?\n/g)[line - 1];
							throw this.TuberLexerError(`Caracter de escape inválido en literal de Texto: \`${c}\``, { col, line, lineString });
						}
						}
					}

					col++;
				}
			}

			col++; //Sumar los "" removidos
			rawMatch = chars.join('');

			this.addToken(new Token(this, TokenKinds.LIT_TEXT, rawMatch, this.line, this.col, this.pos - 1, len));
			this.advance(len, { override: { col, line } }); //Aplicar cambios de columna y línea locales
			this.handleCommentStatement = false;
		};
	}

	#makeSymbolHandler(): PatternHandler {
		return (match, rawMatch) => {
			const len = match.length;
			const keyword = this.lookupTable.find(k => k.match === match);

			if(keyword) {
				if(keyword.kind !== TokenKinds.COMMENT)
					this.addToken(new Token(this, keyword.kind, rawMatch, this.line, this.col, this.pos - 1, len));
				else
					this.handleCommentStatement = true;
			} else {
				this.addToken(new Token(this, TokenKinds.IDENTIFIER, rawMatch, this.line, this.col, this.pos - 1, len));
			}

			this.advance(len, { advanceColumns: true });
		};
	}

	#makeNewlineHandler(): PatternHandler {
		return (match, _) => {
			const len = match.length;
			this.advance(len, { newLine: true });
			this.handleCommentStatement = false;
		};
	}

	#makeSkipHandler(): PatternHandler {
		return (matched) => {
			const len = matched.length;
			this.advance(len, { advanceColumns: true });
		};
	}

	#makeInvalidHandler(errorMessage: string): PatternHandler {
		return (_, __) => {
			throw this.TuberLexerError(errorMessage);
		};
	}
	//#endregion
}

function matchPattern(pattern: Pattern, source: string) {
	if(typeof pattern.match === 'string')
		return stringPatternMatch(pattern.match, source);
	else
		return regexPatternMatch(pattern.match, source);
}

function stringPatternMatch(matcher: string, source: string) {
	const slicedSource = source.slice(0, matcher.length);

	return (slicedSource === matcher) ? slicedSource : null;
}

function regexPatternMatch(matcher: RegExp, source: string) {
	const match = matcher.exec(source);

	if(match == null)
		return null;

	if(match.index !== 0)
		return null;

	return match[0];
}
