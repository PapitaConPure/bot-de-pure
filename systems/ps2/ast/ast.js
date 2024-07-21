const Ut = require('../../../utils');

/**Contiene niveles de vínculo de operadores*/
const BindingPowers = /**@type {const}*/({
    /**Vínculo más débil. Usado por defecto, para sentencias y agrupamiento*/
    DEFAULT: Ut.Iota(),
    /**Segundo vínculo más débil. A veces usado para el operador de coma*/
    COMMA: Ut.iota,
    /**Tercer vínculo más débil. Usado para operadores a nivel de asignación y misceláneos*/
    ASSIGNMENT: Ut.iota,
    /**Usado para operadores a nivel lógico. Se encarga de el orden disyuntivo (o), que es el más débil en el nivel*/
    LOGICAL_DISJUNCTION: Ut.iota,
    /**Usado para operadores a nivel lógico. Se encarga de el orden conjuntivo (y), que es de más fuerte en el nivel*/
    LOGICAL_CONJUNCTION: Ut.iota,
    /**Usado para operadores a nivel equitativo*/
    EQUALITY: Ut.iota,
    /**Usado para operadores a nivel relacional*/
    RELATIONAL: Ut.iota,
    /**Usado para operadores a nivel aritmético. Se encarga de el orden aditivo*/
    ADDITIVE: Ut.iota,
    /**Usado para operadores a nivel aritmético. Se encarga de el orden multiplicativo*/
    MULTIPLICATIVE: Ut.iota,
    /**Usado para operadores a nivel aritmético. Se encarga de el orden exponencial*/
    EXPONENTIAL: Ut.iota,
    /**Cuarto vínculo más fuerte. Usado para operadores unarios*/
    UNARY: Ut.iota,
    /**Tercer vínculo más fuerte. Usado para expresiones de llamado*/
    CALL: Ut.iota,
    /**Segundo vínculo más fuerte. Usado para operadores de miembro*/
    MEMBER: Ut.iota,
    /**Vínculo más fuerte. Usado para expresiones primarias y símbolos*/
    PRIMARY: Ut.iota,
});
/**@typedef {import('types').ValuesOf<BindingPowers>} BindingPower*/

/**Contiene tipos de asociatividad de operadores*/
const Associativities = /**@type {const}*/({
    /**Asociatividad a la izquierda. Por defecto. Usado para la mayoría de expresiones si es que se usa*/
    LEFT: 0,
    /**Asociatividad a la derecha. No se suele usar*/
    RIGHT: -0.5,
});
/**@typedef {import('types').ValuesOf<Associativities>} Associativity*/

/**
 * @typedef {Object} NodeMetadata
 * @property {Number} line
 * @property {Number} column
 * @property {Number} start
 * @property {Number} end
 */

module.exports = {
    BindingPowers,
    Associativities,
};
