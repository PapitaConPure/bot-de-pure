const { Scope } = require('./scope');
const { makeText, makeNada, coerceValue, defaultValueOf } = require('./values');
const { ValueKindLookups } = require('./lookups');

class Input {
	/**@type {String}*/
	#name;
	/**@type {import('./values').ValueKind}*/
	#kind;
	/**@type {Boolean}*/
	#optional;
	/**@type {Boolean}*/
	#spread;
	/**@type {String}*/
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
		this.#spread = false;
		this.#desc = null;
	}

	get name() { return this.#name; }

	get kind() { return this.#kind; }
	
	get optional() { return this.#optional; }
	
	get spread() { return this.#spread; }
	
	get desc() { return this.#desc; }

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
	 * El lector de Entradas no debe tener una entrada extensiva. De lo contrario, se alzará un error
	 * @param {Input} input
	 */
	addInput(input) {
		//No aceptar más Entradas extensivas si ya se detectó una
		if(this.hasSpreadInput)
			throw this.interpreter.TuberInterpreterError([
				'Solo puede haber una única Entrada extensiva por Tubérculo, y debe ser la última Entrada del mismo.',
				`La Entrada anterior, "${this.spreadInputName}", se detectó como extensiva. Sin embargo, luego se leyó una Entrada con otro nombre: "${name}".`,
				`Acomoda tu código de forma tal que la Entrada extensiva sea la última en ser leída`,
			].join('\n'));
			
		if(this.#inputLookup.has(input.name))
			throw 'Entrada duplicada';

		this.#inputStack.push(input);
		this.#inputLookup.set(input.name, input);
	}

	/**
	 * Marca la Entrada bajo en identificador especificado como Extensiva
	 * @param {String} name
	 */
	setInputAsSpread(name) {
		if(this.#spreadInput != null) {
			if(this.#spreadInput.name != name)
				throw 'Entrada duplicada';

			return;
		}

		const input = this.#inputLookup.get(name);
		this.#spreadInput = input.setSpread(true);
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
		
		if(this.hasInput(name))
			this.setInputAsSpread(name);
		else
			this.addInput(new Input(name, valueKind, optional));

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
		
		if(this.hasInput(receptorString))
			this.setInputAsSpread(receptorString);
		else
			this.addInput(new Input(receptorString, valueKind, optional));
		
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
