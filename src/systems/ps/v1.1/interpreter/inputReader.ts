import { Token, TokenKinds } from '../lexer/tokens';
import { Scope } from './scope';
import {
	makeText,
	coerceValue,
	defaultValueOf,
	ValueKinds,
	ValueKindTranslationLookups,
	makeNumber,
	makeBoolean,
	ValueKind,
	RuntimeValue,
} from './values';
import { ValueKindLookups } from './lookups';
import { Interpreter } from '.';
import { ReadStatement, ReadStatementPreModifier } from '../ast/statements';

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

export interface InputJSONData {
	name: string;
	kind: ValueKind;
	optional: boolean;
	spread: boolean;
	desc: string;
}

export class Input {
	#name: string;
	#kind: ValueKind;
	#optional: boolean;
	#spread: boolean;
	#desc: string | null;

	constructor(name: string, kind: ValueKind, optional: boolean) {
		this.#name = name;
		this.#kind = kind;
		this.#optional = optional;
		this.#spread = false;
		this.#desc = null;
	}

	get name() {
		return this.#name;
	}

	get kind() {
		return this.#kind;
	}

	get optional() {
		return this.#optional;
	}

	get spread() {
		return this.#spread;
	}

	get desc() {
		return this.#desc;
	}

	get json() {
		return {
			name: this.#name,
			kind: this.#kind,
			optional: this.#optional,
			spread: this.#spread,
			desc: this.#desc,
		};
	}

	setSpread(spread: boolean) {
		this.#spread = spread;
		return this;
	}

	setDesc(desc: string) {
		this.#desc = desc;
		return this;
	}

	/**
	 * @description
	 * Comprueba si 2 Entradas son suficientemente equivalentes.
	 * Comprueba nombre, tipo, opcionalidad y expansiva.
	 * No comprueba la descripción.
	 */
	equals(other: Input) {
		return (
			this.name === other.name && this.kind === other.kind && this.optional === other.optional
		);
	}

	toString() {
		const kindString = ValueKindTranslationLookups.get(this.#kind) ?? 'Nada';
		const nameString = this.#name ?? '<desconocido>';
		const descString = this.#desc ?? 'Sin descripción';
		const spreadString = this.#spread ? '...' : '';
		const optionalString = this.#optional ? '_(opcional)_' : '';
		return `**(${kindString})** \`${nameString}${spreadString}\` ${optionalString}: ${descString}`;
	}

	static from(json: InputJSONData) {
		return new Input(json.name, json.kind, json.optional)
			.setSpread(json.spread ?? false)
			.setDesc(json.desc ?? null);
	}
}

export abstract class InputReader {
	interpreter: Interpreter;
	#args: string[];
	#inputStack: Input[];
	#inputLookup: Map<string, Input>;
	#spreadInput: Input | null;

	constructor(interpreter: Interpreter, args: string[]) {
		this.interpreter = interpreter;
		this.#args = [];
		this.#inputStack = [];
		this.#inputLookup = new Map();
		this.#spreadInput = null;

		let arg: string, delim: string;
		for(let i = 0; i < args.length; i++) {
			arg = args[i];

			if((arg.startsWith('"') && (delim = '"')) || (arg.startsWith("'") && (delim = "'"))) {
				while(!arg.endsWith(delim) && ++i < args.length) arg += ' ' + args[i];

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

	/**@description Comprueba si este {@link InputReader} es de pruebas de ejecución (`true`) o no (`false`).*/
	abstract isTestDrive(): this is TestDriveInputReader;

	/**@description Comprueba si este {@link InputReader} es de ejecuciones ordinarias (`true`) o no (`false`).*/
	abstract isOrdinary(): this is ProductionInputReader;

	abstract readInput(node: ReadStatement, scope: Scope): RuntimeValue;

	queueArg(arg: string) {
		this.#args.push(arg);
	}

	dequeueArg() {
		return this.#args.shift();
	}

	hasInput(name: string) {
		return this.#inputLookup.has(name);
	}

	ensureValidInputKind(name: string, dataKind: Token) {
		if(!dataKind.isAny(TokenKinds.NUMBER, TokenKinds.TEXT, TokenKinds.BOOLEAN))
			throw this.interpreter.TuberInterpreterError(
				`El tipo de dato de la Entrada \`${name}\` es inválido. Se recibió: ${dataKind.translated}`,
				dataKind,
			);
	}

	/**@description El lector de Entradas no debe tener una entrada extensiva. De lo contrario, se alzará un error.*/
	addInput(input: Input) {
		//No aceptar más Entradas extensivas si ya se detectó una
		if(this.hasSpreadInput)
			throw this.interpreter.TuberInterpreterError(
				[
					'Solo puede haber una única Entrada extensiva por Tubérculo, y debe ser la última Entrada del mismo.',
					`La Entrada anterior, \`${this.spreadInputName}\`, se detectó como extensiva. Sin embargo, luego se leyó una Entrada con otro nombre: \`${input.name}\`.`,
					`Acomoda tu código de forma tal que la Entrada extensiva sea la última en ser leída`,
				].join('\n'),
			);

		if(this.#inputLookup.has(input.name)) throw 'Entrada duplicada';

		this.#inputStack.push(input);
		this.#inputLookup.set(input.name, input);
	}

	/**@description Marca la Entrada bajo en identificador especificado como Extensiva.*/
	setInputAsSpread(name: string) {
		if(this.#spreadInput != null) {
			if(this.#spreadInput.name != name) throw 'Entrada duplicada';

			return;
		}

		const input = this.#inputLookup.get(name);
		if(!input) throw 'Entrada inexistente';

		this.#spreadInput = input.setSpread(true);
	}
}

export class TestDriveInputReader extends InputReader {
	constructor(interpreter: Interpreter, args: string[] | null) {
		super(interpreter, args ?? []);
	}

	override isTestDrive(): this is TestDriveInputReader {
		return true;
	}

	override isOrdinary(): this is ProductionInputReader {
		return false;
	}

	/**@description Lee una Entrada de Ejecución de Prueba.*/
	override readInput(node: ReadStatement, scope: Scope): RuntimeValue {
		const { receptor, dataKind, optional, fallback, modifiers } = node;

		//Cargar valor de prueba
		const name = this.interpreter.astString(receptor);
		const valueKind = ValueKindLookups.get(dataKind.kind);
		const fallbackValue =
			fallback != null
				? this.interpreter.evaluate(fallback, scope)
				: defaultValueOf(valueKind);

		this.ensureValidInputKind(name, dataKind);

		if(this.hasInput(name)) this.setInputAsSpread(name);
		else this.addInput(new Input(name, valueKind, optional));

		try {
			const coercedValue = modifiers.length
				? fallbackValue
				: coerceValue(this.interpreter, fallbackValue, valueKind);
			return coercedValue;
		} catch {
			const fallbackString = this.interpreter.astString(fallback);
			throw this.interpreter.TuberInterpreterError(
				`Se recibió una Entrada con formato inválido. Se esperaba un valor convertible a ${dataKind.translated}, pero \`${fallbackString}\` no lo era`,
				fallback ?? dataKind,
			);
		}
	}
}

export class ProductionInputReader extends InputReader {
	constructor(interpreter: Interpreter, args: string[] | null) {
		super(interpreter, args ?? []);
	}

	override isTestDrive(): this is TestDriveInputReader {
		return false;
	}

	override isOrdinary(): this is ProductionInputReader {
		return true;
	}

	/**@description Lee una Entrada de Ejecución de Producción.*/
	override readInput(node: ReadStatement, scope: Scope): RuntimeValue {
		const { receptor, dataKind, optional, fallback, preModifiers, modifiers } = node;

		const name = this.interpreter.astString(receptor);
		const valueKind = ValueKindLookups.get(dataKind.kind);
		const arg = this.dequeueArg();

		this.ensureValidInputKind(name, dataKind);

		if(this.hasInput(name)) this.setInputAsSpread(name);
		else this.addInput(new Input(name, valueKind, optional));

		let receptionValue: RuntimeValue;
		if(arg != null)
			receptionValue = this.#getValueFromArg(name, arg, valueKind, scope, preModifiers);
		else if(optional) {
			try {
				receptionValue =
					fallback != null
						? this.interpreter.evaluateAs(fallback, scope, valueKind)
						: defaultValueOf(valueKind);
			} catch {
				throw TuberInputError(
					`Se recibió una Entrada con formato inválido. Se esperaba un valor conversible a ${dataKind.translated}, pero se recibió: \`${arg}\``,
				);
			}
		} else
			throw TuberInputError(
				`No se recibió un valor para la Entrada obligatoria \`${name}\` de ${dataKind.translated}`,
			);

		return modifiers.reduce(
			(acc, modifier) => modifier(acc, this.interpreter, scope),
			receptionValue,
		);
	}

	#getValueFromArg(
		name: string,
		arg: string,
		valueKind: ValueKind,
		scope: Scope,
		preModifiers: ReadStatementPreModifier[],
	): RuntimeValue {
		const preModifiedArg = preModifiers.reduce(
			(value, preModifier) => preModifier(value, this.interpreter, scope),
			arg,
		);

		switch(valueKind) {
		case ValueKinds.NUMBER: {
			const narg = +preModifiedArg;

			if(isNaN(narg))
				throw TuberInputError(`Se esperaba un Número para la entrada \`${name}\``);

			return makeNumber(narg);
		}

		case ValueKinds.TEXT:
			return makeText(preModifiedArg);

		case ValueKinds.BOOLEAN: {
			const lowerArg = preModifiedArg.toLowerCase();

			if(boolWords.TRUE.includes(lowerArg)) return makeBoolean(true);

			if(boolWords.FALSE.includes(lowerArg)) return makeBoolean(false);

			throw TuberInputError(
				`Se esperaba un valor Lógico ("verdadero" o "falso", "si" o "no", etc...) para la entrada \`${name}\`. Sin embargo, se recibió: \`${arg}\``,
			);
		}

		default:
			throw 'Tipo de Entrada inválido detectado en lugar inesperado';
		}
	}
}

/**@description Error de Entrada. Para cuando un problema con el Tubérculo se ocasiona por una Entrada inválida u omisa de parte del Usuario.*/
export function TuberInputError(message: string) {
	const err = new Error(message);
	err.name = 'TuberInputError';
	return err;
}
