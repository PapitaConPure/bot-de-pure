const { Token } = require('../lexer/tokens.js')

/**Contiene tipos de sentencia*/
const StatementKinds = /**@type {const}*/({
    PROGRAM: 'ProgramStatement',

    BLOCK: 'BlockStatement',
    CONDITIONAL: 'ConditionalStatement',
    WHILE: 'WhileStatement',
    DO_UNTIL: 'DoUntilStatement',
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
 * @typedef {Object} BaseStatementData
 * @property {NonNullable<T>} kind
 */

/**
 * @typedef {Array<Statement>} BlockBody
 * @typedef {Object} BlockStatementData
 * @property {BlockBody} body
 */

/**@typedef {BaseStatementData<'ProgramStatement'> & BlockStatementData} ProgramStatement*/
/**@typedef {BaseStatementData<'BlockStatement'> & BlockStatementData} BlockStatement*/

/**
 * @typedef {Object} ConditionalStatementData
 * @property {import('./expressions.js').Expression} test
 * @property {BlockStatement} consequent
 * @property {Statement?} [alternate]
 * @typedef {BaseStatementData<'ConditionalStatement'> & ConditionalStatementData} ConditionalStatement
 */

/**
 * @typedef {Object} WhileStatementData
 * @property {import('./expressions.js').Expression} test
 * @property {BlockStatement} body
 * @typedef {BaseStatementData<'WhileStatement'> & WhileStatementData} WhileStatement
 */

/**
 * @typedef {BaseStatementData<'DoUntilStatement'> & WhileStatementData} DoUntilStatement
 */

/**
 * @typedef {Object} RepeatStatementData
 * @property {import('./expressions.js').Expression} times
 * @property {BlockStatement} body
 * @typedef {BaseStatementData<'RepeatStatement'> & RepeatStatementData} RepeatStatement
 */

/**
 * @typedef {Object} ForEachStatementData
 * @property {String} identifier
 * @property {import('./expressions.js').Expression} container
 * @property {BlockStatement} body
 * @typedef {BaseStatementData<'ForEachStatement'> & ForEachStatementData} ForEachStatement
 */

/**
 * @typedef {Object} BaseForStatementData
 * @property {String} identifier
 * @property {BlockStatement} body
 * @typedef {BaseStatementData<'ForStatement'> & BaseForStatementData} BaseForStatement
 * 
 * @typedef {Object} FullForStatementData
 * @property {true} full
 * @property {import('./expressions.js').Expression} start
 * @property {import('./expressions.js').Expression} test
 * @property {Statement} step
 * @typedef {BaseForStatement & FullForStatementData} FullForStatement
 * 
 * @typedef {Object} ShortForStatementData
 * @property {false} full
 * @property {import('./expressions.js').Expression} from
 * @property {import('./expressions.js').Expression} to
 * @typedef {BaseForStatement & ShortForStatementData} ShortForStatement
 * 
 * @typedef {FullForStatement | ShortForStatement} ForStatement
 */

/**
 * @typedef {Object} ExpressionStatementData
 * @property {import('./expressions.js').Expression} expression
 * @typedef {BaseStatementData<'ExpressionStatement'> & ExpressionStatementData} ExpressionStatement
 */

/**
 * @typedef {Object} ReadStatementData
 * @property {Token} dataKind
 * @property {import('./expressions.js').Expression} receptor
 * @property {import('./expressions.js').Expression} fallback
 * @property {Boolean} optional
 * @typedef {BaseStatementData<'ReadStatement'> & ReadStatementData} ReadStatement
 */

/**
 * @typedef {Object} DeclarationStatementData
 * @property {Array<String>} declarations
 * @property {Token?} dataKind
 * @typedef {BaseStatementData<'DeclarationStatement'> & DeclarationStatementData} DeclarationStatement
 */

/**
 * @typedef {Object} SaveStatementData
 * @property {String} identifier
 * @property {import('./expressions.js').Expression} expression
 * @typedef {BaseStatementData<'SaveStatement'> & SaveStatementData} SaveStatement
 */

/**
 * @typedef {Object} AssignmentStatementData
 * @property {Token} operator
 * @property {import('./expressions.js').Expression} receptor
 * @property {import('./expressions.js').Expression?} reception
 * @typedef {BaseStatementData<'AssignmentStatement'> & AssignmentStatementData} AssignmentStatement
 */

/**@typedef {BaseStatementData<'ReturnStatement'> & ExpressionStatementData} ReturnStatement*/

/**
 * @typedef {Object} StopStatementData
 * @property {import('./expressions.js').Expression} stopMessage
 * @property {import('./expressions.js').Expression?} condition
 * @typedef {BaseStatementData<'StopStatement'> & StopStatementData} StopStatement
 */

/**@typedef {BaseStatementData<'SendStatement'> & ExpressionStatementData} SendStatement*/

/**@typedef {BaseStatementData<'EndStatement'>} EndStatement*/

/**
 * @typedef {ProgramStatement
 *          |BlockStatement
 *          |ConditionalStatement
 *          |WhileStatement
 *          |DoUntilStatement
 *          |RepeatStatement
 *          |ForEachStatement
 *          |ForStatement
 * } ControlStatement
 * 
 * @typedef {ExpressionStatement
 *          |ReadStatement
 *          |DeclarationStatement
 *          |SaveStatement
 *          |AssignmentStatement
 *          |ReturnStatement
 *          |StopStatement
 *          |SendStatement
 *          |EndStatement
 * } SimpleStatement
 * 
 * @typedef {ControlStatement|SimpleStatement} Statement
 */

module.exports = {
    StatementKinds,
    ScopeAbortKinds,
};
