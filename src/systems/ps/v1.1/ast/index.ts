import { ValuesOf } from '../util/types';
import { iota } from '../util/utils';

/**@description Contiene niveles de vínculo de operadores.*/
export const BindingPowers = ({
	/**@description Vínculo más débil. Usado por defecto, para sentencias y agrupamiento.*/
	DEFAULT: iota(0),
	/**@description Segundo vínculo más débil. A veces usado para el operador de coma.*/
	COMMA: iota(),
	/**@description Tercer vínculo más débil. Usado para operadores a nivel de asignación y misceláneos.*/
	ASSIGNMENT: iota(),
	/**@description Usado para operadores a nivel lógico. Se encarga de el orden disyuntivo (o), que es el más débil en el nivel.*/
	LOGICAL_DISJUNCTION: iota(),
	/**@description Usado para operadores a nivel lógico. Se encarga de el orden conjuntivo (y), que es de más fuerte en el nivel.*/
	LOGICAL_CONJUNCTION: iota(),
	/**@description Usado para operadores a nivel equitativo.*/
	EQUALITY: iota(),
	/**@description Usado para operadores a nivel relacional.*/
	RELATIONAL: iota(),
	/**@description Usado para operadores a nivel aritmético. Se encarga de el orden aditivo.*/
	ADDITIVE: iota(),
	/**@description Usado para operadores a nivel aritmético. Se encarga de el orden multiplicativo.*/
	MULTIPLICATIVE: iota(),
	/**@description Usado para operadores a nivel aritmético. Se encarga de el orden exponencial.*/
	EXPONENTIAL: iota(),
	/**@description Cuarto vínculo más fuerte. Usado para operadores unarios.*/
	UNARY: iota(),
	/**@description Tercer vínculo más fuerte. Usado para expresiones de llamado.*/
	CALL: iota(),
	/**@description Segundo vínculo más fuerte. Usado para operadores de miembro.*/
	MEMBER: iota(),
	/**@description Vínculo más fuerte. Usado para expresiones primarias y símbolos.*/
	PRIMARY: iota(),
}) as const;
export type BindingPower = ValuesOf<typeof BindingPowers>;

/**Contiene tipos de asociatividad de operadores*/
export const Associativities = ({
	/**Asociatividad a la izquierda. Por defecto. Usado para la mayoría de expresiones si es que se usa*/
	LEFT: 0,
	/**Asociatividad a la derecha. No es usado con frecuencia*/
	RIGHT: -0.5,
}) as const;
export type Associativity = ValuesOf<typeof Associativities>;

export interface NodeMetadata {
	line: number;
	column: number;
	start: number;
	end: number;
}
