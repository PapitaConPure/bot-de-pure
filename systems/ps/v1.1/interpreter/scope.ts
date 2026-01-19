import {
	makeNada,
	defaultValueOf,
	ValueKinds,
	RuntimeValue,
	ValueKind,
	FunctionValue,
} from './values';
import { Interpreter } from '.';

/**@description Representa un ámbito de variables en un contexto de ejecución de PuréScript.*/
export class Scope {
	#interpreter: Interpreter;
	#parent: Scope | null;
	#mirror: Scope;
	variables: Map<string, RuntimeValue>;
	global: boolean;

	/**
	 * @description Crea un ámbito de variables para este intérprete.
	 * @param interpreter El intérprete al que pertenece el ámbito.
	 * @param [parent=null] El superámbito del que este ámbito es subconjunto.
	 */
	constructor(interpreter: Interpreter, parent: Scope | null = null) {
		this.#interpreter = interpreter;
		this.#parent = parent;
		this.variables = new Map();
		this.global = false;
		this.#mirror = this.resolveClosestGlobalMirror();
	}

	createFunctionScope(fnValue: FunctionValue, argValues: RuntimeValue[]) {
		const it = this.#interpreter;

		let fnScope: Scope;

		if(fnValue.lambda === false) {
			fnValue.scope.include(this);
			fnScope = new Scope(it, fnValue.scope);
		} else fnScope = new Scope(it, this);

		fnValue.args.forEach((arg, i) => {
			/**@type {RuntimeValue}*/
			let value: RuntimeValue;
			if(i < argValues.length) value = argValues[i];
			else if(arg.optional) value = it.evaluate(arg.fallback, this);
			else
				throw it.TuberInterpreterError(
					`Se esperaba un valor para el parámetro \`${arg.identifier}\` de la Función \`${fnValue.name}\``,
					arg,
				);

			fnScope.declareVariable(arg.identifier, ValueKinds.NADA);
			fnScope.assignVariable(arg.identifier, value);
		});

		if(fnValue.self != null && fnValue.self.kind !== ValueKinds.NADA)
			fnScope.assignVariable('este', fnValue.self);

		return fnScope;
	}

	get interpreter() {
		return this.#interpreter;
	}

	get parent() {
		return this.#parent;
	}

	hasParent(): this is Scope & { parent: Scope } {
		return this.#parent != null;
	}

	hasNoParent(): this is Scope & { parent: null } {
		return this.#parent == null;
	}

	/**
	 * @description Declara una variable con el valor por defecto del tipo especificado y devuelve el valor.
	 * @param identifier El nombre bajo el cual se declarará la variable.
	 */
	declareVariable(identifier: string, kind: ValueKind): RuntimeValue {
		if(this.variables.has(identifier))
			throw this.#interpreter.TuberInterpreterError(
				`El identificador \`${identifier}\` ya estaba declarado`,
			);

		const value = defaultValueOf(kind);
		this.variables.set(identifier, value);
		return value;
	}

	/**@description Asigna una variable y devuelve el valor asignado.*/
	assignVariable(identifier: string, value: RuntimeValue): RuntimeValue {
		const scope = this.resolve(identifier, false);

		if(value == null)
			throw this.#interpreter.TuberInterpreterError('Se esperaba una asignación');

		(scope ?? this).variables.set(identifier, value);

		return value;
	}

	/**
	 * @description
	 * Busca una variable y devuelve el valor.
	 *
	 * Si no está declarada y `mustBeDeclared` es falso, se devuelve un `NadaValue`. Si es verdadero, se alza un error.
	 */
	lookup(identifier: string, mustBeDeclared = true): RuntimeValue {
		const scope = this.resolve(identifier, mustBeDeclared);
		if(scope == null) return makeNada();

		const variable = scope.variables.get(identifier);
		if(variable == null) return makeNada();

		return variable;
	}

	/**@description Resuelve un ámbito que contenga la variable o función mencionada.*/
	resolve(identifier: string, mustBeDeclared: boolean = true): Scope | null {
		const variable = this.variables.get(identifier);

		if(variable != null) return this;

		if(this.hasNoParent()) {
			if(this.#mirror) return this.#mirror.resolve(identifier, mustBeDeclared);

			if(mustBeDeclared)
				throw this.#interpreter.TuberInterpreterError(
					`El identificador \`${identifier}\` no representa ninguna variable ni función`,
				);

			return null;
		}

		return this.#parent.resolve(identifier, mustBeDeclared);
	}

	/**@description Asigna todas las variables de otro scope al que llama el método.*/
	include(scope: Scope) {
		if(scope.hasParent() && scope.parent !== this && !scope.parent.global)
			this.include(scope.parent);

		scope.variables.forEach((variable, key) => {
			if(!this.variables.has(key)) this.variables.set(key, variable);
		});

		this.#mirror = scope.resolveClosestGlobalMirror();

		return this;
	}

	/**@description Encuentra el mirror global usando el Scope especificado.*/
	resolveClosestGlobalMirror() {
		if(this.#mirror != null) return this.#mirror;

		if(!this.hasParent()) return null;

		if(this.#parent.global) return this.#parent;

		return this.#parent.resolveClosestGlobalMirror();
	}
}
