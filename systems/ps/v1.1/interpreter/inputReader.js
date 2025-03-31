const { TokenKinds } = require('../lexer/tokens');
const { Scope } = require('./scope');
const { makeText, makeNada, coerceValue, defaultValueOf, ValueKinds, ValueKindTranslationLookups, makeNumber, makeBoolean } = require('./values');
const { ValueKindLookups } = require('./lookups');

const boolWords = {
	TRUE: [
		'verdadero',
		'encendido',
		'prendido',
		'si',
		'verdad',
		'activado',
		'activo',
		'true',
		'yes',
		'on',
		'enabled',
		'1',
		'o',
	],
	FALSE: [
		'falso',
		'apagado',
		'no',
		'desactivado',
		'inactivo',
		'false',
		'off',
		'disabled',
		'0',
		'x',
	],
};

class Input {
	/**@type {String}*/
	#name;
	/**@type {import('./values').ValueKind}*/
	#kind;
	/**@type {Boolean}*/
	#optional;
	/**@type {Boolean}*/
	#spread;
	/**@type {String?}*/
	#desc;

	/**
	 * 
	 * @param {String} name 
	 * @param {import('./values').ValueKind} kind 
	 * @param {Boolean} optional 
	 */
	constructor(name, kind, optional) {
		this.#name = name;
		this.#kind = kind;
		this.#optional = optional;
		this.#spread = false;//this.setSpread(kind === ValueKinds.LIST);
		this.#desc = null;
	}

	get name() { return this.#name; }

	get kind() { return this.#kind; }
	
	get optional() { return this.#optional; }
	
	get spread() { return this.#spread; }
	
	get desc() { return this.#desc; }
	
	get json() {
		return {
			name: this.#name,
			kind: this.#kind,
			optional: this.#optional,
			spread: this.#spread,
			desc: this.#desc,
		};
	}

	/**
	 * @param {Boolean} spread
	 */
	setSpread(spread) {
		this.#spread = spread;
		return this;
	}

	/**
	 * @param {String} desc
	 */
	setDesc(desc) {
		this.#desc = desc;
		return this;
	}

	/**
	 * Comprueba si 2 Entradas son suficientemente equivalentes
	 * Comprueba nombre, tipo, opcionalidad y expansiva
	 * No comprueba la descripción
	 * @param {Input} other 
	 */
	equals(other) {
		return this.name === other.name
			&& this.kind === other.kind
			&& this.optional === other.optional;
	}

	toString() {
		const kindString = ValueKindTranslationLookups.get(this.#kind) ?? 'Nada';
		const nameString = this.#name ?? '<desconocido>';
		const descString = this.#desc ?? 'Sin descripción';
		const spreadString = this.#spread ? '...' : '';
		const optionalString = this.#optional ? '_(opcional)_' : '';
		return `**(${kindString})** \`${nameString}${spreadString}\` ${optionalString}: ${descString}`;
	}

	/**
	 * @param {{ name: String; kind: import('./values').ValueKind; optional: Boolean; spread: Boolean; desc: String; }} json
	 */
	static from(json) {
		return new Input(json.name, json.kind, json.optional)
			.setSpread(json.spread ?? false)
			.setDesc(json.desc ?? null);
	}
}

class InputReader {
	/**@type {import('./interpreter').Interpreter}*/
	interpreter;
	/**@type {Array<String>}*/
	#args;
	/**@type {Array<Input>}*/
	#inputStack;
	/**@type {Map<String, Input>}*/
	#inputLookup;
	/**@type {Input?}*/
	#spreadInput;

	/**
	 * @param {import('./interpreter').Interpreter} interpreter
	 * @param {Array<String>} args
	 */
	constructor(interpreter, args) {
		this.interpreter = interpreter;
		this.#args = [];
		this.#inputStack = [];
		this.#inputLookup = new Map();
		this.#spreadInput = null;
		
		let arg, delim;
		for(let i = 0; i < args.length; i++) {
			arg = args[i];

			if((arg.startsWith('"') && (delim = '"')) || (arg.startsWith("'") && (delim = "'"))) {
				while(!arg.endsWith(delim) && ++i < args.length)
					arg += ' ' + args[i];
					
				arg = arg.slice(1, -1);
			}

			this.#args.push(arg);
		}
	}

	get hasArgs() {
		return this.#args.length > 0;
	}

	get inputStack() {
		return this.#inputStack.slice();
	}

	get hasSpreadInput() {
		return this.#spreadInput != null;
	}

	get spreadInputName() {
		return this.#spreadInput?.name;
	}

	/**@type {(node: import('../ast/statements').ReadStatement, scope: Scope) => import('./values').RuntimeValue}}*/
	readInput(node, scope) {
		return makeNada();
	}

	/**@param {String} arg*/
	queueArg(arg) {
		this.#args.push(arg);
	}
	
	dequeueArg() {
		return this.#args.shift();
	}

	/**@param {String} name*/
	hasInput(name) {
		return this.#inputLookup.has(name);
	}

	/**
	 * @param {String} name
	 * @param {import('../lexer/tokens').Token} dataKind
	 */
	ensureValidInputKind(name, dataKind) {
		if(!dataKind.isAny(TokenKinds.NUMBER, TokenKinds.TEXT, TokenKinds.BOOLEAN))
			throw this.interpreter.TuberInterpreterError(`El tipo de dato de la Entrada \`${name}\` es inválido. Se recibió: ${dataKind.translated}`, dataKind);
	}

	/**
	 * El lector de Entradas no debe tener una entrada extensiva. De lo contrario, se alzará un error
	 * @param {Input} input
	 */
	addInput(input) {
		//No aceptar más Entradas extensivas si ya se detectó una
		if(this.hasSpreadInput)
			throw this.interpreter.TuberInterpreterError([
				'Solo puede haber una única Entrada extensiva por Tubérculo, y debe ser la última Entrada del mismo.',
				`La Entrada anterior, \`${this.spreadInputName}\`, se detectó como extensiva. Sin embargo, luego se leyó una Entrada con otro nombre: \`${input.name}\`.`,
				`Acomoda tu código de forma tal que la Entrada extensiva sea la última en ser leída`,
			].join('\n'));
		
		if(this.#inputLookup.has(input.name))
			throw 'Entrada duplicada';

		this.#inputStack.push(input);
		this.#inputLookup.set(input.name, input);
	}

	/**
	 * Marca la Entrada bajo en identificador especificado como Extensiva
	 * @param {string} name
	 */
	setInputAsSpread(name) {
		if(this.#spreadInput != null) {
			if(this.#spreadInput.name != name)
				throw 'Entrada duplicada';

			return;
		}

		const input = this.#inputLookup.get(name);
		if(!input)
			throw 'Entrada inexistente';

		this.#spreadInput = input.setSpread(true);
	}
}

class TestDriveInputReader extends InputReader {
	/**
	 * @param {import('./interpreter').Interpreter} interpreter
	 * @param {Array<string>?} [args]
	 */
	constructor(interpreter, args) {
		super(interpreter, args ?? []);
	}

	/**
	 * Lee una Entrada de Ejecución de Prueba
	 * @override
	 * @type {(node: import('../ast/statements').ReadStatement, scope: Scope) => import('./values').RuntimeValue}
	 */
	readInput(node, scope) {
		const { receptor, dataKind, optional, fallback } = node;
		
		//Cargar valor de prueba
		const name = this.interpreter.astString(receptor);
		const valueKind = ValueKindLookups.get(dataKind.kind);
		const fallbackValue = (fallback != null) ? this.interpreter.evaluate(fallback, scope) : defaultValueOf(valueKind);

		this.ensureValidInputKind(name, dataKind);
		
		if(this.hasInput(name))
			this.setInputAsSpread(name);
		else
			this.addInput(new Input(name, valueKind, optional));

		try {
			const coercedValue = coerceValue(this.interpreter, fallbackValue, valueKind);
			return coercedValue;
		} catch {
			const fallbackString = this.interpreter.astString(fallback);
			throw this.interpreter.TuberInterpreterError(`Se recibió una Entrada con formato inválido. Se esperaba un valor convertible a ${dataKind.translated}, pero \`${fallbackString}\` no lo era`, fallback ?? dataKind);
		}
	}
}

class ProductionInputReader extends InputReader {
	/**
	 * @param {import('./interpreter').Interpreter} interpreter
	 * @param {Array<string>?} [args]
	 */
	constructor(interpreter, args) {
		super(interpreter, args ?? []);
	}

	/**
	 * Lee una Entrada de Ejecución de Producción
	 * @override
	 * @type {(node: import('../ast/statements').ReadStatement, scope: Scope) => import('./values').RuntimeValue}
	 */
	readInput(node, scope) {
		const { receptor, dataKind, optional, fallback, modifiers } = node;

		const name = this.interpreter.astString(receptor);
		const valueKind = ValueKindLookups.get(dataKind.kind);
		const arg = this.dequeueArg();

		this.ensureValidInputKind(name, dataKind);
		
		if(this.hasInput(name))
			this.setInputAsSpread(name);
		else
			this.addInput(new Input(name, valueKind, optional));
		
		let receptionValue;
		if(arg != null)
			receptionValue = this.#getValueFromArg(name, arg, valueKind);
		else if(optional) {
			try {
				receptionValue = (fallback != null)
					? this.interpreter.evaluateAs(fallback, scope, valueKind)
					: defaultValueOf(valueKind);
			} catch {
				throw TuberInputError(`Se recibió una Entrada con formato inválido. Se esperaba un valor conversible a ${dataKind.translated}, pero se recibió: \`${arg}\``);
			}
		} else
			throw TuberInputError(`No se recibió un valor para la Entrada obligatoria \`${name}\` de ${dataKind.translated}`);
		
		return modifiers.reduce((acc, modifier) => modifier(acc, this.interpreter, scope), receptionValue);
	}

	/**
	 * 
	 * @param {string} name 
	 * @param {string} arg 
	 * @param {import('./values').ValueKind} valueKind
	 * @returns {import('./values').RuntimeValue}
	 */
	#getValueFromArg(name, arg, valueKind) {
		switch(valueKind) {
		case ValueKinds.NUMBER: {
			const narg = +arg;

			if(isNaN(narg))
				throw TuberInputError(`Se esperaba un Número para la entrada \`${name}\``);

			return makeNumber(narg);
		}

		case ValueKinds.TEXT:
			return makeText(arg);

		case ValueKinds.BOOLEAN: {
			const lowerArg = arg.toLowerCase();

			if(boolWords.TRUE.includes(lowerArg))
				return makeBoolean(true);
			
			if(boolWords.FALSE.includes(lowerArg))
				return makeBoolean(false);

			throw TuberInputError(`Se esperaba un valor Lógico ("verdadero" o "falso", "si" o "no", etc...) para la entrada \`${name}\`. Sin embargo, se recibió: \`${arg}\``);
		}

		default:
			throw 'Tipo de Entrada inválido detectado en lugar inesperado';
		}
	}
}

/**
 * Error de Entrada. Para cuando un problema con el Tubérculo se ocasiona por una Entrada inválida u omisa de parte del Usuario
 * @param {string} message
 */
function TuberInputError(message) {
	const err = new Error(message);
	err.name = 'TuberInputError';
	return err;
}

module.exports = {
	Input,
	InputReader,
	TestDriveInputReader,
	ProductionInputReader,
	TuberInputError,
};
