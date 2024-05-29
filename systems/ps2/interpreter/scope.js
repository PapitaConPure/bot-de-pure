const { makeNumber, makeText, makeBoolean, makeList, makeRegistry, makeEmbed, makeNada, ValueKinds, defaultValueOf } = require('./values');

class Scope {
	/**@type {import('./interpreter').Interpreter}*/
	#interpreter;
	/**@type {Scope}*/
	#parent;
	/**@type {Map<String, import('./values').RuntimeValue>}*/
	variables;
    /**@type {Boolean}*/
    global;

	/**
	 * 
	 * @param {import('./interpreter').Interpreter} interpreter
	 * @param {Scope} [parent=null]
	 */
	constructor(interpreter, parent = null) {
		this.#interpreter = interpreter;
		this.#parent = parent;
		this.variables = new Map();
        this.global = false;
	}

    get interpreter() {
        return this.#interpreter;
    }

	get parent() {
		return this.#parent;
	}

	get hasParent() {
		return this.#parent != null;
	}

    /**
     * Declara una variable con el valor por defecto del tipo especificado y devuelve el valor
     * @param {String} identifier El nombre bajo el cual se declarará la variable
     * @param {import('./values').ValueKind} kind
     * @returns {import('./values').RuntimeValue}
     */
    declareVariable(identifier, kind) {
        if(this.variables.has(identifier))
            throw this.#interpreter.TuberInterpreterError(`El identificador "${identifier}" ya estaba declarado`);

        const value = defaultValueOf(kind);
        this.variables.set(identifier, value);
        return value;
    }

    /**
     * Asigna una variable y devuelve el valor asignado
     * @param {String} identifier El nombre de la variable
     * @param {import('./values').RuntimeValue} value El valor de la variable
     * @returns {import('./values').RuntimeValue}
     */
    assignVariable(identifier, value) {
        let scope = this.resolve(identifier, false);

        if(!value)
            throw this.#interpreter.TuberInterpreterError('Se esperaba una asignación');

		scope ??= this;
        scope.variables.set(identifier, value);
        return value;
    }

    /**
     * Busca una variable y devuelve el valor
     * @param {String} identifier
     * @returns {import('./values').RuntimeValue}
     */
    lookup(identifier, mustBeDeclared = true) {
        const scope = this.resolve(identifier, mustBeDeclared);
		if(scope == null)
			return makeNada();

        const variable = scope.variables.get(identifier);
        if(variable == null)
            return makeNada();

        return variable;
    }

    /**
     * Resuelve un ámbito que contenga la variable o función mencionada
     * @param {String} identifier
     * @param {Boolean} [mustBeDeclared]
     * @returns {Scope}
     */
    resolve(identifier, mustBeDeclared = true) {
        const variable = this.variables.get(identifier);

        if(variable)
            return this;

        if(this.#parent == null) {
            if(mustBeDeclared)
                throw this.#interpreter.TuberInterpreterError(`El identificador "${identifier}" no representa ninguna variable ni función`);
            
            return null;
        }

        return this.#parent.resolve(identifier, mustBeDeclared);
    }

    /**
     * Asigna todas las variables de otro scope al que llama el método
     * @param {Scope} scope 
     */
    include(scope) {
        if(scope.hasParent && scope.parent !== this && !scope.parent.global)
            this.include(scope.parent);

        scope.variables.forEach((variable, key) => {
            this.variables.set(key, variable);
        });
    }
}

module.exports = {
	Scope,
};
