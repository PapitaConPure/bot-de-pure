const { Scope } = require('./scope');
const { makeText, makeNada, coerceValue, defaultValueOf } = require('./values');
const { ValueKindLookups } = require('./lookups');

class InputReader {
	/**@type {import('./interpreter').Interpreter}*/
	interpreter;
	/**@type {Array<String>}*/
	#args;
	/**@type {Array<import('../purescript').TuberInput>}*/
	#inputStack;
	/**@type {Map<String, import('../purescript').TuberInput>}*/
	#inputLookup;
	/**@type {import('../purescript').TuberInput?}*/
	#spreadInput;

	/**
	 * @param {import('./interpreter').Interpreter} interpreter
	 * @param {Array<String>} args
	 */
	constructor(interpreter, args) {
		this.interpreter = interpreter;
		this.#args = args.slice();
		this.#inputStack = [];
		this.#inputLookup = new Map();
		this.#spreadInput = null;
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
		return this.#spreadInput.name;
	}

	/**@type {(node: import('../ast/statements').ReadStatement, scope: Scope) => import('./values').RuntimeValue}}*/
	readInput(node, scope) {
		return makeNada();
	}

	/**
	 * @param {String} arg
	 */
	queueArg(arg) {
		this.#args.push(arg);
	}
	
	dequeueArg() {
		return this.#args.shift();
	}

	/**
	 * @param {String} name
	 */
	hasInput(name) {
		return this.#inputLookup.has(name);
	}

	/**
	 * @param {String} name
	 * @param {import('./values').ValueKind} kind
	 * @param {Boolean} optional
	 */
	addInput(name, kind, optional) {
		if(this.#inputLookup.has(name))
			throw 'Entrada duplicada';

		const input = {
			kind,
			name,
			optional,
			spread: false,
		};

		this.#inputStack.push(input);
		this.#inputLookup.set(name, input);
	}

	/**
	 * @param {String} name
	 */
	setInputAsSpread(name) {
		const input = this.#inputLookup.get(name);
		input.spread = true;
		this.#spreadInput = input;
	}
}

class TestDriveInputReader extends InputReader {
	#spreadCounter;

	/**
	 * @param {import('./interpreter').Interpreter} interpreter
	 * @param {Array<String>} args
	 */
	constructor(interpreter, args) {
		super(interpreter, args ?? []);
		this.#spreadCounter = 0;
	}

	/**
	 * @override
	 */
	get hasArgs() {
		return (this.#spreadCounter++) < 2;
	}

	/**
	 * @override
	 * @type {(node: import('../ast/statements').ReadStatement, scope: Scope) => import('./values').RuntimeValue}
	 */
	readInput(node, scope) {
		const { receptor, dataKind, optional, fallback } = node;
		
		//Cargar valor de prueba
		const valueKind = ValueKindLookups.get(dataKind.kind);
		const fallbackValue = (fallback != null) ? this.interpreter.evaluate(fallback, scope) : defaultValueOf(valueKind);
		const name = this.interpreter.expressionString(receptor);
		
		//Registrar nueva Entrada o marcar Entrada existente como extensiva
		if(this.hasInput(name)) {
			this.setInputAsSpread(name);
		} else {
			//No aceptar más Entradas extensivas si ya se detectó una
			if(this.hasSpreadInput)
				throw this.interpreter.TuberInterpreterError([
					'Solo puede haber una única Entrada extensiva por Tubérculo, y debe ser la última Entrada del mismo.',
					`La Entrada anterior, "${this.spreadInputName}", se detectó como extensiva. Sin embargo, luego se leyó una Entrada con otro nombre: "${name}".`,
					`Acomoda tu código de forma tal que la Entrada extensiva sea la última en ser leída`,
				].join('\n'));

			this.addInput(name, valueKind, optional);
		}

		try {
			const coercedValue = coerceValue(this.interpreter, fallbackValue, valueKind);
			return coercedValue;
		} catch {
			const fallbackString = this.interpreter.expressionString(fallback);
			throw this.interpreter.TuberInterpreterError(`Se recibió una Entrada con formato inválido. Se esperaba un valor convertible a tipo ${dataKind.translated}, pero se recibió: "${fallbackString}"`);
		}
	}
}

class ProductionInputReader extends InputReader {
	/**
	 * @param {import('./interpreter').Interpreter} interpreter
	 * @param {Array<String>} args
	 */
	constructor(interpreter, args) {
		super(interpreter, args);
	}

	/**
	 * @override
	 * @type {(node: import('../ast/statements').ReadStatement, scope: Scope) => import('./values').RuntimeValue}
	 */
	readInput(node, scope) {
		const { receptor, dataKind, optional, fallback } = node;

		const arg = this.dequeueArg();
		const receptorString = this.interpreter.expressionString(receptor);
		const valueKind = ValueKindLookups.get(dataKind.kind);
		
		let receptionValue;
		if(arg != null)
			receptionValue = makeText(arg);
		else if(optional)
			receptionValue = (fallback != null)
				? this.interpreter.evaluate(fallback, scope)
				: defaultValueOf(valueKind);
		else
			throw TuberInputError(`No se recibió un valor para la Entrada obligatoria "${receptorString}" de ${dataKind.translated}`);

		try {
			const coercedValue = coerceValue(this.interpreter, receptionValue, valueKind);
			return coercedValue;
		} catch {
			throw TuberInputError(`Se recibió una Entrada con formato inválido. Se esperaba un valor conversible a ${dataKind.translated}, pero se recibió: "${arg}"`);
		}
	}
}

/**
 * 
 * @param {String} message
 */
function TuberInputError(message) {
	const err = new Error(message);
	err.name = 'TuberInputError';
	return err;
}

module.exports = {
	InputReader,
	TestDriveInputReader,
	ProductionInputReader,
	TuberInputError,
};
