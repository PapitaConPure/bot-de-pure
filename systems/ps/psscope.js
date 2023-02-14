const { TuberInterpreterError, ProgramType, PropertyValue, RuntimeValue, NumericValue, TextValue, BooleanValue, ListValue, GlossaryValue, NadaValue, NativeFunctionValue, makeList, makeGlossary, makeBoolean, makeNumber, makeText, isNada, makeNada, makeEmbed } = require('./commons.js');

/**@class Representa un ámbito del programa de PuréScript*/
class TuberScope {
    /**@type {TuberScope?}*/
    #parent;
    /**@type {Map<String, RuntimeValue>}*/
    variables;
    /**@type {{ number: Number, name: String }}*/
    #currentStatement;

    /**
     * @constructor
     * @param {TuberScope?} parent 
     */
    constructor(parent) {
        this.#parent = parent;
        this.variables = new Map();
    }

    /**
     * Declara una variable
     * @param {String} identifier El nombre bajo el cual se declarará la variable
     * @param {ProgramType} type
     * @returns {RuntimeValue} El valor de la variable
     */
    declareVariable(identifier, type) {
        if(this.variables.has(identifier))
            throw TuberInterpreterError(`El identificador "${identifier}" ya estaba declarado`, this.#currentStatement);

        let value;

        // console.log('Hola buenas soy tipado con puré', type);
        switch(type) {
        case 'Number':
            value = makeNumber(null);
            break;
        case 'Text':
            value = makeText(null);
            break;
        case 'Boolean':
            value = makeBoolean(false);
            break;
        case 'List':
            value = makeList([]);
            break;
        case 'Glossary':
            value = makeGlossary(new Map());
            break;
        case 'Embed':
            value = makeEmbed();
            break;
        default:
            value = makeNada();
        }
        
        this.variables.set(identifier, value);
        return value;
    }

    /**
     * Declara una variable
     * @param {String} identifier El nombre bajo el cual se declarará la variable
     * @param {String} target El identificador al que refleja el anterior
     * @returns {RuntimeValue} El valor de la variable
     */
    declareMirror(identifier, target) {
        if(this.variables.has(identifier))
            throw TuberInterpreterError(`El identificador "${identifier}" ya estaba declarado`, this.#currentStatement);
        
        this.variables.set(identifier, { type: 'Identifier', name: target.name });
        return this.lookup(identifier);
    }

    /**
     * Asigna una variable
     * @param {String} identifier El nombre de la variable
     * @param {RuntimeValue | NativeFunctionValue} value El valor de la variable
     * @returns {RuntimeValue | NativeFunctionValue} El valor de la variable
     */
    assignVariable(identifier, value) {
        // console.log('assignVariable:', identifier, value);
        let scope = this.resolve(identifier, false);
        // console.log('assignVariable.scope:', scope);

        if(!value)
            throw TuberInterpreterError('Se esperaba una asignación', this.#currentStatement);

        // console.log('en assignVariable:', identifier, value)

        if(!scope) {
            this.declareVariable(identifier, value.type);
            scope = this;
        }

        // console.log('Mondongo:', this.variables)

        const variable = this.variables?.get(identifier);
        // console.log('assignVariable.variable:', variable);

        if(variable && variable.type === 'Identifier')
            identifier = variable.name;
        // console.log('assignVariable.identifier:', identifier);

        scope.variables.set(identifier, value);
        return value;
    }

    /**
     * Busca una variable o función y devuelve el valor
     * @param {String} identifier
     * @returns {RuntimeValue}
     */
    lookup(identifier, mustBeDeclared = true) {
        // console.log('lookup:', identifier);
        /**@type {TuberScope}*/
        const scope = this.resolve(identifier, mustBeDeclared, false);
        // console.log('lookup.scope:', scope);
        const variable = scope?.variables?.get(identifier);
        // console.log('lookup.variable:', variable);
        if(variable?.type === 'Identifier')
            return this.#parent?.lookup(variable.name, mustBeDeclared);
        // console.log('Fin de lookup');
        if(isNada(variable))
            return makeNada();
        return variable;
    }

    /**
     * Resuelve un ámbito que contenga la variable o función mencionada
     * @param {String} identifier
     * @param {String} mustBeDeclared
     * @returns {TuberScope}
     */
    resolve(identifier, mustBeDeclared = true, considerMirrors = true) {
        // console.log('resolve:', identifier, considerMirrors);
        const variable = this.variables.get(identifier);
        // console.log('resolve.variable:', variable);
        if(variable) {
            if(considerMirrors && variable?.type === 'Identifier')
                return this.#parent?.resolve(variable.name, mustBeDeclared, considerMirrors);
            // console.log('Fin de resolve');

            return this;
        }
        // console.log('No lo tiene');

        if(this.#parent == undefined) {
            if(mustBeDeclared)
                throw TuberInterpreterError(`El identificador "${identifier}" no representa ninguna variable ni función`, this.#currentStatement);
            // console.log('Va a tocar nulo');
            
            return null;
        }
        // console.log('Va a resolver en padre');

        return this.#parent.resolve(identifier, mustBeDeclared, considerMirrors);
    }

    /**@param {{ number: Number, name: String }} currentStatement*/
    updateCurrentStatement(currentStatement) {
        this.#currentStatement = currentStatement;
    }
}

module.exports = {
    TuberScope,
};