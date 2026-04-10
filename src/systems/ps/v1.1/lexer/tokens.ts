import { ValuesOf } from '../util/types';
import { Lexer } from '.';

/**Contiene tipos de token de lexer*/
export const TokenKinds = ({
	//Valores
	LIT_NUMBER: 'Number',
	LIT_TEXT: 'String',
	LIT_BOOLEAN: 'Boolean',
	IDENTIFIER: 'Identifier',
	NADA: 'Nada',

	//Agrupación
	PAREN_OPEN: 'ParenOpen',
	PAREN_CLOSE: 'ParenClose',

	BLOCK_OPEN: 'BlockOpen',
	BLOCK_CLOSE: 'BlockClose',

	//Indicadores de Sentencia de Control
	IF: 'If',
	ELSE: 'Else',
	ELSE_IF: 'ElseIf',
	WHILE: 'While',
	DO: 'Do',
	UNTIL: 'Until',
	REPEAT: 'Repeat',
	FOR_EACH: 'ForEach',
	FOR: 'For',

	//Indicadores de sentencia
	READ: 'Read',
	CREATE: 'Create',
	SAVE: 'Save',
	LOAD: 'Load',
	ADD: 'Add',
	SUBTRACT: 'Subtract',
	MULTIPLY: 'Multiply',
	DIVIDE: 'Divide',
	EXTEND: 'Extend',
	DELETE: 'Delete',
	EXECUTE: 'Execute',
	RETURN: 'Return',
	END: 'End',
	STOP: 'Stop',
	SEND: 'Send',
	COMMENT: 'Comment',

	//Operadores lógicos
	OR: 'Or',
	AND: 'And',
	NOT: 'Not',

	//Operadores comparativos
	EQUALS: 'Equals',
	NOT_EQUALS: 'NotEquals',
	SEEMS: 'Seems',
	NOT_SEEMS: 'NotSeems',
	LESS: 'Less',
	LESS_EQUALS: 'LessEquals',
	GREATER: 'Greater',
	GREATER_EQUALS: 'GreaterEquals',

	//Operadores aritméticos
	PLUS: 'Plus',
	DASH: 'Dash',
	STAR: 'Star',
	SLASH: 'Slash',
	PERCENT: 'Percent',
	CARET: 'Caret',
	DOUBLE_STAR: 'DoubleStar',

	//Otros operadores
	ARROW: 'Arrow',
	COLON: 'Colon',
	COMMA: 'Comma',
	QUESTION: 'Question',
	LAMBDA: 'Lambda',
	AFTER: 'After',
	DOT: 'Dot',

	//Palabras clave
	ASSIGNMENT: 'Assignment',
	TIMES: 'Times',
	IN: 'In',
	FROM: 'From',
	OPTIONAL: 'Optional',

	//Indicadores de Tipo
	NUMBER: 'NumberKind',
	TEXT: 'TextKind',
	BOOLEAN: 'BooleanKind',
	LIST: 'List',
	REGISTRY: 'Registry',
	EMBED: 'Embed',
	INPUT: 'Input',
	FUNCTION: 'Function',

	//EOF
	EOF: 'EOF',
}) as const;
/**@description Representa un tipo de token de lexer.*/
export type TokenKind = ValuesOf<typeof TokenKinds>;

export const TokenKindTranslations = new Map<TokenKind, string>()
	.set(TokenKinds.LIT_NUMBER, 'Literal de Número')
	.set(TokenKinds.LIT_TEXT, 'Literal de Texto')
	.set(TokenKinds.LIT_BOOLEAN, 'Literal de Lógico')
	.set(TokenKinds.IDENTIFIER, 'Identificador')

	.set(TokenKinds.PAREN_OPEN, 'Inicio de agrupamiento `(`')
	.set(TokenKinds.PAREN_CLOSE, 'Fin de agrupamiento `)`')
	.set(TokenKinds.BLOCK_OPEN, 'Sentencia `BLOQUE`')
	.set(TokenKinds.BLOCK_CLOSE, 'Sentencia `FIN`')
	.set(TokenKinds.IF, 'Sentencia `SI`')
	.set(TokenKinds.ELSE, 'Sentencia `SINO`')
	.set(TokenKinds.ELSE_IF, 'Sentencias `SINO SI`')
	.set(TokenKinds.WHILE, 'Sentencia `MIENTRAS`')
	.set(TokenKinds.DO, 'Sentencia `HACER`')
	.set(TokenKinds.UNTIL, 'Sentencia `HASTA` u operador especial `hasta`')
	.set(TokenKinds.REPEAT, 'Sentencia `REPETIR`')
	.set(TokenKinds.FOR_EACH, 'Sentencia `PARA CADA`')
	.set(TokenKinds.FOR, 'Sentencia `PARA`')

	.set(TokenKinds.READ, 'Sentencia `LEER`')
	.set(TokenKinds.CREATE, 'Sentencia `CREAR`')
	.set(TokenKinds.SAVE, 'Sentencia `GUARDAR`')
	.set(TokenKinds.LOAD, 'Sentencia `CARGAR`')
	.set(TokenKinds.ADD, 'Sentencia `SUMAR`')
	.set(TokenKinds.SUBTRACT, 'Sentencia `RESTAR`')
	.set(TokenKinds.MULTIPLY, 'Sentencia `MULTIPLICAR`')
	.set(TokenKinds.DIVIDE, 'Sentencia `DIVIDIR`')
	.set(TokenKinds.EXTEND, 'Sentencia `EXTENDER`')
	.set(TokenKinds.DELETE, 'Sentencia `BORRAR`')
	.set(TokenKinds.EXECUTE, 'Sentencia `EJECUTAR`')
	.set(TokenKinds.RETURN, 'Sentencia `DEVOLVER`')
	.set(TokenKinds.END, 'Sentencia `TERMINAR`')
	.set(TokenKinds.STOP, 'Sentencia `PARAR`')
	.set(TokenKinds.SEND, 'Sentencia `ENVIAR`')
	.set(TokenKinds.COMMENT, 'Sentencia `COMENTAR`')

	.set(TokenKinds.OR, 'Operador `o`')
	.set(TokenKinds.AND, 'Operador `y`')
	.set(TokenKinds.NOT, 'Operador `no`')

	.set(TokenKinds.EQUALS, 'Operador `es`')
	.set(TokenKinds.NOT_EQUALS, 'Operador `no es`')
	.set(TokenKinds.SEEMS, 'Operador `parece`')
	.set(TokenKinds.NOT_SEEMS, 'Operador `no parece`')
	.set(TokenKinds.LESS, 'Operador `precede`')
	.set(TokenKinds.LESS_EQUALS, 'Operador `no excede`')
	.set(TokenKinds.GREATER, 'Operador `excede`')
	.set(TokenKinds.GREATER_EQUALS, 'Operador `no precede`')

	.set(TokenKinds.ASSIGNMENT, 'Operador `con`')
	.set(TokenKinds.ARROW, 'Operador de flecha `->`')
	.set(TokenKinds.COLON, 'Operador `:`')
	.set(TokenKinds.QUESTION, 'Operador `?`')
	.set(TokenKinds.COMMA, 'Operador `,`')
	.set(TokenKinds.LAMBDA, 'Operador Lambda')
	.set(TokenKinds.TIMES, 'Operador especial `veces`')
	.set(TokenKinds.AFTER, 'Operador `luego`')
	.set(TokenKinds.DOT, 'Operador `.`')
	.set(TokenKinds.IN, 'Operador especial `en`')
	.set(TokenKinds.FROM, 'Operador especial `desde`')
	.set(TokenKinds.OPTIONAL, 'Operador especial `opcional`')

	.set(TokenKinds.PLUS, 'Operador `+`')
	.set(TokenKinds.DASH, 'Operador `-`')
	.set(TokenKinds.STAR, 'Operador `*`')
	.set(TokenKinds.SLASH, 'Operador `/`')
	.set(TokenKinds.PERCENT, 'Operador `%`')
	.set(TokenKinds.CARET, 'Operador `^`')
	.set(TokenKinds.DOUBLE_STAR, 'Operador `**`')

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

export function translateTokenKind(tokenKind: TokenKind): string {
	return TokenKindTranslations.get(tokenKind);
}

export function translateTokenKinds(...tokenKinds: TokenKind[]): string[] {
	return tokenKinds.map(tokenKind => TokenKindTranslations.get(tokenKind));
}

/**@description Contiene tipos de indicador de sentencia de lexer.*/
const StatementVerbs: Readonly<TokenKind[]> = ([
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
	TokenKinds.DELETE,
	TokenKinds.EXECUTE,
	TokenKinds.RETURN,
	TokenKinds.END,
	TokenKinds.STOP,
	TokenKinds.SEND,
	TokenKinds.COMMENT,
]) as const;

/**@description Contiene tipos de indicador de sentencia de lexer.*/
export const DataKindValues = ({
	NUMBER: 'Número',
	TEXT: 'Texto',
	BOOLEAN: 'Lógico',
	LIST: 'Lista',
	REGISTRY: 'Registro',
	EMBED: 'Marco',
	INPUT: 'Entrada',
}) as const;
/**@description Representa un tipo de Token Léxico de PuréScript.*/
export type DataKindValue = ValuesOf<typeof DataKindValues>;

export type TokenInternalValue = number | string | boolean | null | undefined;

/**Representa un Token Léxico de PuréScript*/
export class Token {
	/**@description El texto fuente de la línea original del token.*/
	#lexer: Lexer;
	/**@description El tipo del token.*/
	#kind: TokenKind;
	/**@description El valor del token.*/
	#value: TokenInternalValue;
	/**@description La línea del token.*/
	#line: number;
	/**@description La columna inicial del token.*/
	#column;
	/**@description La posición del primer caracter del token en el código.*/
	#start: number;
	/**@description El largo del token.*/
	#length: number;
	/**@description Si es un indicador de sentencia (`true`) o no (`false`).*/
	isStatement: boolean;

	/**
	 * @param lexer El Lexer que instanció este Token.
	 * @param kind El tipo de token.
	 * @param value El valor del token.
	 * @param line La línea del inicio del token.
	 * @param column La columna inicial del token.
	 * @param start La posición del primer caracter del token en el código.
	 * @param length El largo del token.
	 */
	constructor(lexer: Lexer, kind: TokenKind, value: TokenInternalValue, line: number, column: number, start: number, length: number) {
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

	/**@description El tipo de token.*/
	get kind() { return this.#kind; }

	get translated() {
		return TokenKindTranslations.get(this.#kind);
	}

	/**@description El valor del token.*/
	get value() { return this.#value; }

	/**@description La línea inicial del token.*/
	get line() { return this.#line; }

	/**@description La columna inicial del token.*/
	get column() { return this.#column; }

	/**@description La posición del primer caracter del token.*/
	get start() { return this.#start; }

	/**@description La posición del caracter al final del token.*/
	get end() { return this.#start + this.#length; }

	/**@description El largo del token*/
	get length() { return this.#length; }

	/**@description El fragmento de código fuente de la línea de origen del token.*/
	get lineString() {
		return this.#lexer.sourceLines[this.#line - 1];
	}

	/**@description El fragmento de código fuente que este token representa.*/
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
	}

	/**@description Devuelve `true` si el token es del tipo indicado, `false` de lo contrario.*/
	is<TInfer extends TokenKind>(tokenKind: TInfer): this is Token & { kind: TInfer } {
		return this.#kind === tokenKind;
	}

	/**@description Devuelve `true` si el token es de alguno de los tipos indicados, `false` de lo contrario.*/
	isAny<TInfer extends TokenKind[]>(...tokenKinds: TInfer): this is Token & { kind: TInfer[number] } {
		return (tokenKinds).includes(this.#kind);
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
