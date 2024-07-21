/**Contiene tipos de token de lexer*/
const TokenKinds = /**@type {const}*/({
	LIT_NUMBER: 'Number',
	LIT_TEXT: 'String',
	LIT_BOOLEAN: 'Boolean',
	IDENTIFIER: 'Identifier',

	PAREN_OPEN: 'ParenOpen',
	PAREN_CLOSE: 'ParenClose',

	BLOCK_OPEN: 'BlockOpen',
	BLOCK_CLOSE: 'BlockClose',

	IF: 'If',
	ELSE: 'Else',
	ELSE_IF: 'ElseIf',
	WHILE: 'While',
	DO: 'Do',
	UNTIL: 'Until',
	REPEAT: 'Repeat',
	FOR_EACH: 'ForEach',
	FOR: 'For',

	READ: 'Read',
	CREATE: 'Create',
	SAVE: 'Save',
	LOAD: 'Load',
	ADD: 'Add',
	SUBTRACT: 'Subtract',
	MULTIPLY: 'Multiply',
	DIVIDE: 'Divide',
	EXTEND: 'Extend',
	EXECUTE: 'Execute',
	RETURN: 'Return',
	END: 'End',
	STOP: 'Stop',
	SEND: 'Send',
	COMMENT: 'Comment',

	OR: 'Or',
	AND: 'And',
	NOT: 'Not',

	EQUALS: 'Equals',
	NOT_EQUALS: 'NotEquals',
	SEEMS: 'Seems',
	NOT_SEEMS: 'NotSeems',
	LESS: 'Less',
	LESS_EQUALS: 'LessEquals',
	GREATER: 'Greater',
	GREATER_EQUALS: 'GreaterEquals',

	ASSIGNMENT: 'Assignment',
	ARROW: 'Arrow',
	LAMBDA: 'Lambda',
	COLON: 'Colon',
	COMMA: 'Comma',
	TIMES: 'Times',
	IN: 'In',
	FROM: 'From',
	OPTIONAL: 'Optional',

	PLUS: 'Plus',
	DASH: 'Dash',
	STAR: 'Star',
	SLASH: 'Slash',
	PERCENT: 'Percent',
	CARET: 'Caret',

	NUMBER: 'NumberKind',
	TEXT: 'TextKind',
	BOOLEAN: 'BooleanKind',
	LIST: 'List',
	REGISTRY: 'Registry',
	EMBED: 'Embed',
	INPUT: 'Input',
	FUNCTION: 'Function',
	NADA: 'Nada',

	EOF: 'EOF',
});
/**
 * Representa un tipo de token de lexer
 * @typedef {import('types').ValuesOf<typeof TokenKinds>} TokenKind
 */

/**@type {Map<TokenKind, String>}*/
const TokenKindTranslations = new Map();
TokenKindTranslations
	.set(TokenKinds.LIT_NUMBER, 'Literal de Número')
	.set(TokenKinds.LIT_TEXT, 'Literal de Texto')
	.set(TokenKinds.LIT_BOOLEAN, 'Literal de Lógico')
	.set(TokenKinds.IDENTIFIER, 'Identificador')

	.set(TokenKinds.PAREN_OPEN, 'Inicio de agrupamiento \`(\`')
	.set(TokenKinds.PAREN_CLOSE, 'Fin de agrupamiento \`)\`')
	.set(TokenKinds.BLOCK_OPEN, 'Sentencia \`BLOQUE\`')
	.set(TokenKinds.BLOCK_CLOSE, 'Sentencia \`FIN\`')
	.set(TokenKinds.IF, 'Sentencia \`SI\`')
	.set(TokenKinds.ELSE, 'Sentencia \`SINO\`')
	.set(TokenKinds.ELSE_IF, 'Sentencias \`SINO SI\`')
	.set(TokenKinds.WHILE, 'Sentencia \`MIENTRAS\`')
	.set(TokenKinds.DO, 'Sentencia \`HACER\`')
	.set(TokenKinds.UNTIL, 'Sentencia \`HASTA\` u operador especial \`hasta\`')
	.set(TokenKinds.REPEAT, 'Sentencia \`REPETIR\`')
	.set(TokenKinds.FOR_EACH, 'Sentencia \`PARA CADA\`')
	.set(TokenKinds.FOR, 'Sentencia \`PARA\`')
	.set(TokenKinds.READ, 'Sentencia \`LEER\`')
	.set(TokenKinds.CREATE, 'Sentencia \`CREAR\`')
	.set(TokenKinds.SAVE, 'Sentencia \`GUARDAR\`')
	.set(TokenKinds.LOAD, 'Sentencia \`CARGAR\`')
	.set(TokenKinds.ADD, 'Sentencia \`SUMAR\`')
	.set(TokenKinds.SUBTRACT, 'Sentencia \`RESTAR\`')
	.set(TokenKinds.MULTIPLY, 'Sentencia \`MULTIPLICAR\`')
	.set(TokenKinds.DIVIDE, 'Sentencia \`DIVIDIR\`')
	.set(TokenKinds.EXTEND, 'Sentencia \`EXTENDER\`')
	.set(TokenKinds.EXECUTE, 'Sentencia \`EJECUTAR\`')
	.set(TokenKinds.RETURN, 'Sentencia \`DEVOLVER\`')
	.set(TokenKinds.END, 'Sentencia \`TERMINAR\`')
	.set(TokenKinds.STOP, 'Sentencia \`PARAR\`')
	.set(TokenKinds.SEND, 'Sentencia \`ENVIAR\`')
	.set(TokenKinds.COMMENT, 'Sentencia \`COMENTAR\`')

	.set(TokenKinds.OR, 'Operador \`o\`')
	.set(TokenKinds.AND, 'Operador \`y\`')
	.set(TokenKinds.NOT, 'Operador \`no\`')

	.set(TokenKinds.EQUALS, 'Operador \`es\`')
	.set(TokenKinds.NOT_EQUALS, 'Operador \`no es\`')
	.set(TokenKinds.EQUALS, 'Operador \`parece\`')
	.set(TokenKinds.NOT_EQUALS, 'Operador \`no parece\`')
	.set(TokenKinds.LESS, 'Operador \`precede\`')
	.set(TokenKinds.LESS_EQUALS, 'Operador \`no excede\`')
	.set(TokenKinds.GREATER, 'Operador \`excede\`')
	.set(TokenKinds.GREATER_EQUALS, 'Operador \`no precede\`')

	.set(TokenKinds.ASSIGNMENT, 'Operador \`con\`')
	.set(TokenKinds.ARROW, 'Operador de flecha \`->\`')
	.set(TokenKinds.COLON, 'Operador \`:\`')
	.set(TokenKinds.COMMA, 'Operador \`,\`')
	.set(TokenKinds.LAMBDA, 'Operador Lambda')
	.set(TokenKinds.TIMES, 'Operador especial \`veces\`')
	.set(TokenKinds.IN, 'Operador especial \`en\`')
	.set(TokenKinds.FROM, 'Operador especial \`desde\`')
	.set(TokenKinds.OPTIONAL, 'Operador especial \`opcional\`')

	.set(TokenKinds.PLUS, 'Operador \`+\`')
	.set(TokenKinds.DASH, 'Operador \`-\`')
	.set(TokenKinds.STAR, 'Operador \`*\`')
	.set(TokenKinds.SLASH, 'Operador \`/\`')
	.set(TokenKinds.PERCENT, 'Operador \`%\`')

	.set(TokenKinds.NUMBER, 'Tipo Número')
	.set(TokenKinds.TEXT, 'Tipo Texto')
	.set(TokenKinds.BOOLEAN, 'Tipo Lógico')
	.set(TokenKinds.LIST, 'Tipo Lista')
	.set(TokenKinds.REGISTRY, 'Tipo Registro')
	.set(TokenKinds.EMBED, 'Tipo Marco')
	.set(TokenKinds.INPUT, 'Tipo Entrada')
	.set(TokenKinds.FUNCTION, 'Tipo Función')
	.set(TokenKinds.NADA, 'Tipo u Valor Nada')

	.set(TokenKinds.EOF, 'Fin de Código');

/**@param {TokenKind} tokenKind*/
function translateTokenKind(tokenKind) {
	return TokenKindTranslations.get(tokenKind);
}

/**@param {Array<TokenKind>} tokenKinds*/
function translateTokenKinds(...tokenKinds) {
	return tokenKinds.map(tokenKind => TokenKindTranslations.get(tokenKind));
}

/**Contiene tipos de indicador de sentencia de lexer*/
/**@type {Readonly<Array<TokenKind>>}*/
const StatementVerbs = /**@type {const}*/([
	TokenKinds.BLOCK_OPEN,
	TokenKinds.BLOCK_CLOSE,
	TokenKinds.IF,
	TokenKinds.ELSE,
	TokenKinds.ELSE_IF,
	TokenKinds.WHILE,
	TokenKinds.DO,
	TokenKinds.UNTIL,
	TokenKinds.REPEAT,
	TokenKinds.FOR_EACH,
	TokenKinds.FOR,
	TokenKinds.READ,
	TokenKinds.CREATE,
	TokenKinds.SAVE,
	TokenKinds.LOAD,
	TokenKinds.ADD,
	TokenKinds.SUBTRACT,
	TokenKinds.MULTIPLY,
	TokenKinds.DIVIDE,
	TokenKinds.EXTEND,
	TokenKinds.EXECUTE,
	TokenKinds.RETURN,
	TokenKinds.END,
	TokenKinds.STOP,
	TokenKinds.SEND,
	TokenKinds.COMMENT,
]);

/**Contiene tipos de indicador de sentencia de lexer*/
const DataKindValues = /**@type {const}*/({
	NUMBER: 'Número',
	TEXT: 'Texto',
	BOOLEAN: 'Lógico',
	LIST: 'Lista',
	REGISTRY: 'Registro',
	EMBED: 'Marco',
	INPUT: 'Entrada',
});
/**
 * Representa un tipo de Token Léxico de PuréScript
 * @typedef {import('types').ValuesOf<DataKindValues>} DataKindValue
 */

/**Representa un Token Léxico de PuréScript*/
class Token {
	/**
	 * El texto fuente de la línea original del token
	 * @type {import('./lexer').Lexer}
	 */
	#lexer;
	/**
	 * El tipo del token
	 * @type {TokenKind}
	 */
	#kind;
	/**
	 * El valor del token
	 * @type {any}
	 */
	#value;
	/**
	 * La línea del token
	 * @type {Number}
	 */
	#line;
	/**
	 * La columna inicial del token
	 */
	#column;
	/**
	 * La posición del primer caracter del token en el código 
	 * @type {Number}
	 */
	#start;
	/**
	 * El largo del token
	 * @type {Number}
	 */
	#length;
	/**
	 * Si es un indicador de sentencia (true) o no (false)
	 * @type {Boolean}
	 */
	isStatement;

	/**
	 * @param {import('./lexer').Lexer} lexer El Lexer que instanció este Token
	 * @param {TokenKind} kind El tipo de token
	 * @param {any} value El valor del token
	 * @param {number} line La línea del inicio del token
	 * @param {number} column La columna inicial del token
	 * @param {number} start La posición del primer caracter del token en el código 
	 * @param {number} length El largo del token
	 */
	constructor(lexer, kind, value, line, column, start, length) {
		if(!Object.values(TokenKinds).includes(kind))
			throw `Tipo de token inválido: ${kind}`;
		if(line < 1)
			throw 'La línea de inicio del token debe ser al menos 1';
		if(column < 1)
			throw 'La columna inicial del token debe ser al menos 1';
		if(start < 0)
			throw 'La posición de inicio del token debe ser al menos 0';
		if(length < 1)
			throw 'El largo del token debe ser al menos 1';

		this.#lexer = lexer;
		this.#kind = kind;
		this.#value = value;
		this.#line = line;
		this.#column = column;
		this.#start = start;
		this.#length = length;
		this.isStatement = StatementVerbs.includes(this.#kind);
	}

	/**El tipo de token*/
	get kind() { return this.#kind; }

	get translated() {
		return TokenKindTranslations.get(this.#kind);
	}

	/**El valor del token*/
	get value() { return this.#value; }
	
	/**La línea inicial del token*/
	get line() { return this.#line; }
	
	/**La columna inicial del token*/
	get column() { return this.#column; }

	/**La posición del primer caracter del token*/
	get start() { return this.#start; }

	/**La posición del caracter al final del token*/
	get end() { return this.#start + this.#length; }

	/**El largo del token*/
	get length() { return this.#length; }

	/**El fragmento de código fuente de la línea de origen del token*/
	get lineString() {
		return this.#lexer.sourceLines[this.#line - 1];
	}

	/**El fragmento de código fuente que este token representa*/
	get sourceString() {
		return this.#lexer.source.slice(this.start, this.end);
	}

	get json() {
		return {
			kind: this.#kind,
			value: this.#value,
			line: this.#line,
			column: this.#column,
			start: this.#start,
			end: this.end,
			length: this.#length,
			lineString: this.lineString,
			sourceString: this.sourceString,
		};
	};

	/**
	 * Devuelve `true` si el token es del tipo indicado, `false` de lo contrario
	 * @param {TokenKind} tokenKind
	 */
	is(tokenKind) {
		return this.#kind === tokenKind;
	}

	/**
	 * Devuelve `true` si el token es de alguno de los tipos indicados, `false` de lo contrario
	 * @param {TokenKind[]} tokenKinds
	 */
	isAny(...tokenKinds) {
		return tokenKinds.includes(this.#kind);
	}
	
	get [Symbol.toStringTag]() {
		if(this.value == null)
			return this.#kind;

		return `${this.#kind} (${this.#value})`;
	}
}

Token.prototype.toString = function() {
	if(this.value == null)
		return this.kind;
	
	return `${this.kind} (${this.value})`;
};

module.exports = {
	TokenKinds,
	TokenKindTranslations,
	translateTokenKind,
	translateTokenKinds,
	StatementVerbs,
	DataKindValues,
	Token,
};