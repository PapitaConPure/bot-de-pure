const { makeNada, defaultValueOf } = require('./values');

/**Representa un ámbito de variables en un contexto de ejecución de PuréScript*/
class Scope {
	/**@type {import('./interpreter').Interpreter}*/
	#interpreter;
	/**@type {Scope?}*/
	#parent;
    /**@type {Scope}*/
    #mirror;
	/**@type {Map<String, import('./values').RuntimeValue>}*/
	variables;
    /**@type {Boolean}*/
    global;

	/**
	 * Crea un ámbito de variables para este intérprete
	 * @param {import('./interpreter').Interpreter} interpreter El intérprete al que pertenece el ámbito
	 * @param {Scope?} [parent=null] El superámbito del que este ámbito es subconjunto
	 */
	constructor(interpreter, parent = null) {
		this.#interpreter = interpreter;
		this.#parent = parent;
		this.variables = new Map();
        this.global = false;
        this.#mirror = this.resolveClosestGlobalMirror();
	}

    get interpreter() {
        return this.#interpreter;
    }

	get parent() {
		return this.#parent;
	}

    /**
     * @returns {this is Scope & { #parent: Scope, parent: Scope }}
     */
	hasParent() {
		return this.#parent != null;
	}

    /**
     * @returns {this is Scope & { #parent: null, parent: null }}
     */
	hasNoParent() {
		return this.#parent == null;
	}

    /**
     * Declara una variable con el valor por defecto del tipo especificado y devuelve el valor
     * @param {String} identifier El nombre bajo el cual se declarará la variable
     * @param {import('./values').ValueKind} kind
     * @returns {import('./values').RuntimeValue}
     */
    declareVariable(identifier, kind) {
        if(this.variables.has(identifier))
            throw this.#interpreter.TuberInterpreterError(`El identificador \`${identifier}\` ya estaba declarado`);

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

        if(value == null)
            throw this.#interpreter.TuberInterpreterError('Se esperaba una asignación');

		scope ??= this;
        scope.variables.set(identifier, value);
        return value;
    }

    /**
     * Busca una variable y devuelve el valor.
     * 
     * Si no está declarada y `mustBeDeclared` es falso, se devuelve un `NadaValue`. Si es verdadero, se alza un error
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
     * @returns {Scope?}
     */
    resolve(identifier, mustBeDeclared = true) {
        const variable = this.variables.get(identifier);

        if(variable != null)
            return this;

        if(this.hasNoParent()) {
            if(this.#mirror)
                return this.#mirror.resolve(identifier, mustBeDeclared);

            if(mustBeDeclared)
                throw this.#interpreter.TuberInterpreterError(`El identificador \`${identifier}\` no representa ninguna variable ni función`);
            
            return null;
        }

        return this.#parent.resolve(identifier, mustBeDeclared);
    }

    /**
     * Asigna todas las variables de otro scope al que llama el método
     * @param {Scope} scope 
     */
    include(scope) {
        if(scope.hasParent() && scope.parent !== this && !scope.parent.global)
            this.include(scope.parent);

        scope.variables.forEach((variable, key) => {
            if(!this.variables.has(key))
                this.variables.set(key, variable);
        });

        this.#mirror = scope.resolveClosestGlobalMirror();

        return this;
    }

    /**
     * Encuentra el mirror global usando el Scope especificado
     */
    resolveClosestGlobalMirror() {
        if(this.#mirror != null)
            return this.#mirror;

        if(!this.hasParent())
            return null;

        if(this.#parent.global)
            return this.#parent;

        return this.#parent.resolveClosestGlobalMirror();
    }
}

module.exports = {
	Scope,
};
