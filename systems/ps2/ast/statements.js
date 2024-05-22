const { Token } = require('../lexer/tokens.js')

/**Contiene tipos de sentencia*/
const StatementKinds = /**@type {const}*/({
    PROGRAM: 'ProgramStatement',

    BLOCK: 'BlockStatement',
    CONDITIONAL: 'ConditionalStatement',
    WHILE: 'WhileStatement',
    DO_WHILE: 'DoWhileStatement',
    REPEAT: 'RepeatStatement',
    FOR_EACH: 'ForEachStatement',
    FOR: 'ForStatement',

    EXPRESSION: 'ExpressionStatement',
    READ: 'ReadStatement',
    DECLARATION: 'DeclarationStatement',
    SAVE: 'SaveStatement',
    ASSIGNMENT: 'AssignmentStatement',
    RETURN: 'ReturnStatement',
    END: 'EndStatement',
    STOP: 'StopStatement',
    SEND: 'SendStatement',
});
/**@typedef {import('types').ValuesOf<typeof StatementKinds>} StatementKind*/

/**@type {Array<StatementKind>}*/
const ScopeAbortKinds = [
	StatementKinds.RETURN,
	StatementKinds.END,
];

/**
 * @template {StatementKind} [T=StatementKind]
 * @typedef {Object} Statement
 * @property {NonNullable<T>} kind
 */

/**
 * @typedef {Array<Statement>} BlockBody
 * @typedef {Object} BlockStatementData
 * @property {BlockBody} body
 */

/**@typedef {Statement<'ProgramStatement'> & BlockStatementData} ProgramStatement*/
/**@typedef {Statement<'BlockStatement'> & BlockStatementData} BlockStatement*/

/**
 * @typedef {Object} ConditionalStatementData
 * @property {import('./expressions.js').Expression} test
 * @property {Statement} consequent
 * @property {Statement?} [alternate]
 * @typedef {Statement<'ConditionalStatement'> & ConditionalStatementData} ConditionalStatement
 */

/**
 * @typedef {Object} WhileStatementData
 * @property {import('./expressions.js').Expression} test
 * @property {BlockBody} body
 * @typedef {Statement<'WhileStatement'> & WhileStatementData} WhileStatement
 */

/**
 * @typedef {Statement<'DoWhileStatement'> & WhileStatementData} DoWhileStatement
 */

/**
 * @typedef {Object} RepeatStatementData
 * @property {import('./expressions.js').Expression} times
 * @property {BlockBody} body
 * @typedef {Statement<'RepeatStatement'> & RepeatStatementData} RepeatStatement
 */

/**
 * @typedef {Object} ForEachStatementData
 * @property {String} identifier
 * @property {import('./expressions.js').Expression} container
 * @property {BlockBody} body
 * @typedef {Statement<'ForEachStatement'> & ForEachStatementData} ForEachStatement
 */

/**
 * @typedef {Object} BaseForStatementData
 * @property {String} identifier
 * @property {BlockBody} body
 * 
 * @typedef {Object} FullForStatementData
 * @property {true} full
 * @property {import('./expressions.js').Expression} start
 * @property {import('./expressions.js').Expression} test
 * @property {Statement} step
 * 
 * 
 * @typedef {Object} ShortForStatementData
 * @property {false} full
 * @property {import('./expressions.js').Expression} from
 * @property {import('./expressions.js').Expression} to
 * 
 * @typedef {Statement<'ForStatement'> & BaseForStatementData & (FullForStatementData|ShortForStatementData)} ForStatement
 */

/**
 * @typedef {Object} ExpressionStatementData
 * @property {import('./expressions.js').Expression} expression
 * @typedef {Statement<'ExpressionStatement'> & ExpressionStatementData} ExpressionStatement
 */

/**
 * @typedef {Object} ReadStatementData
 * @property {Token} dataKind
 * @property {import('./expressions.js').Expression} receptor
 * @property {import('./expressions.js').Expression} fallback
 * @property {Boolean} optional
 * @typedef {Statement<'ReadStatement'> & ReadStatementData} ReadStatement
 */

/**
 * @typedef {Object} DeclarationStatementData
 * @property {import('./expressions.js').Expression} declaration
 * @property {Token?} dataKind
 * @typedef {Statement<'DeclarationStatement'> & DeclarationStatementData} DeclarationStatement
 */

/**
 * @typedef {Object} SaveStatementData
 * @property {String} identifier
 * @property {import('./expressions.js').Expression} expression
 * @typedef {Statement<'SaveStatement'> & SaveStatementData} SaveStatement
 */

/**
 * @typedef {Object} AssignmentStatementData
 * @property {Token} operator
 * @property {import('./expressions.js').Expression} receptor
 * @property {import('./expressions.js').Expression?} reception
 * @typedef {Statement<'AssignmentStatement'> & AssignmentStatementData} AssignmentStatement
 */

/**@typedef {Statement<'ReturnStatement'> & ExpressionStatementData} ReturnStatement*/

/**
 * @typedef {Object} StopStatementData
 * @property {import('./expressions.js').Expression} stopMessage
 * @property {import('./expressions.js').Expression?} condition
 * @typedef {Statement<'StopStatement'> & StopStatementData} StopStatement
 */

/**@typedef {Statement<'SendStatement'> & ExpressionStatementData} SendStatement*/

/**@typedef {Statement<'EndStatement'>} EndStatement*/

module.exports = {
    StatementKinds,
    ScopeAbortKinds,
};
