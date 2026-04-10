import { Token } from '../lexer/tokens';
import { ValuesOf } from '../util/types';
import { NodeMetadata } from '.';
import { Expression } from './expressions';
import { Interpreter } from '../interpreter';
import { RuntimeValue } from '../interpreter/values';
import { Scope } from '../interpreter/scope';

/**@description Contiene tipos de sentencia.*/
export const StatementKinds = ({
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
	LOAD: 'LoadStatement',
	DELETE: 'DeleteStatement',
	ASSIGNMENT: 'AssignmentStatement',
	INSERTION: 'InsertionStatement',
	RETURN: 'ReturnStatement',
	END: 'EndStatement',
	STOP: 'StopStatement',
	SEND: 'SendStatement',
}) as const;
export type StatementKind = ValuesOf<typeof StatementKinds>;

export const ScopeAbortKinds: StatementKind[] = [
	StatementKinds.RETURN,
	StatementKinds.END,
];

export interface EmptyStatement<T extends StatementKind> {
	kind: Readonly<NonNullable<T>>;
}

export interface BaseStatementData<T extends StatementKind> extends EmptyStatement<T>, NodeMetadata {}

export type BlockBody = Statement[];

export interface BlockStatementData {
	body: BlockBody;
}

export interface ProgramStatement extends BaseStatementData<'ProgramStatement'>, BlockStatementData {}
export interface BlockStatement extends BaseStatementData<'BlockStatement'>, BlockStatementData {}

export interface ConditionalStatementData {
	test: Expression;
	consequent: BlockStatement;
	alternate?: Statement;
}

export interface ConditionalStatement extends BaseStatementData<'ConditionalStatement'>, ConditionalStatementData {}

export interface WhileStatementData {
	test: Expression;
	body: BlockStatement;
}

export interface WhileStatement extends BaseStatementData<'WhileStatement'>, WhileStatementData {}

export interface DoUntilStatement extends BaseStatementData<'DoUntilStatement'>, WhileStatementData {}

export interface RepeatStatementData {
	times: Expression;
	body: BlockStatement;
}

export interface RepeatStatement extends BaseStatementData<'RepeatStatement'>, RepeatStatementData {}

export interface ForEachStatementData {
	identifier: string;
	container: Expression;
	body: BlockStatement;
}

export interface ForEachStatement extends BaseStatementData<'ForEachStatement'>, ForEachStatementData {}

export interface BaseForStatementData {
	identifier: string;
	body: BlockStatement;
}

export interface BaseForStatement extends BaseStatementData<'ForStatement'>, BaseForStatementData {}

export interface FullForStatementData {
	full: true;
	init: Expression;
	test: Expression;
	step: Statement;
}

export interface FullForStatement extends BaseForStatement, FullForStatementData {}

export interface ShortForStatementData {
	full: false;
	from: Expression;
	to: Expression;
}

export interface ShortForStatement extends BaseForStatement, ShortForStatementData {}

export type ForStatement = FullForStatement | ShortForStatement;

export interface ExpressionStatementData {
	expression: Expression;
}

export interface ExpressionStatement extends BaseStatementData<'ExpressionStatement'>, ExpressionStatementData {}

export type ReadStatementPreModifier = (arg: string, it: Interpreter, scope: Scope) => string;

export type ReadStatementModifier = (v: RuntimeValue, it: Interpreter, scope: Scope) => RuntimeValue;

export interface ReadStatementData {
	dataKind: Token;
	receptor: Expression;
	fallback: Expression;
	optional: boolean;
	preModifiers: ReadStatementPreModifier[];
	modifiers: ReadStatementModifier[];
}

export interface ReadStatement extends BaseStatementData<'ReadStatement'>, ReadStatementData {}

export interface DeclarationStatementData {
	declarations: string[];
	dataKind: Token | null;
}

export interface DeclarationStatement extends BaseStatementData<'DeclarationStatement'>, DeclarationStatementData {}

export interface SaveStatementData {
	identifier: string;
	expression: Expression;
}

export interface SaveStatement extends BaseStatementData<'SaveStatement'>, SaveStatementData {}

export interface BaseLoadStatementData {
	identifier: string;
}

export interface BaseLoadStatement extends BaseStatementData<'LoadStatement'>, BaseLoadStatementData {}

export interface UnconditionalLoadStatementData {
	conditional: false;
}

export interface ConditionalLoadStatementData {
	conditional: true;
	expressions: Expression[];
}

export interface UnconditionalLoadStatement extends BaseLoadStatement, UnconditionalLoadStatementData {}

export interface ConditionalLoadStatement extends BaseLoadStatement, ConditionalLoadStatementData {}

export type LoadStatement = UnconditionalLoadStatement | ConditionalLoadStatement;

export interface DeleteStatementData {
	identifier: string;
}

export interface DeleteStatement extends BaseStatementData<'DeleteStatement'>, DeleteStatementData {}

export interface AssignmentStatementData {
	operator: Token;
	receptor: Expression;
	reception: Expression | null;
}

export interface AssignmentStatement extends BaseStatementData<'AssignmentStatement'>, AssignmentStatementData {}

export interface InsertionStatementData {
	receptor: Expression;
	reception: Expression;
	index: Expression;
}

export interface InsertionStatement extends BaseStatementData<'InsertionStatement'>, InsertionStatementData {}

export interface ReturnStatement extends BaseStatementData<'ReturnStatement'>, ExpressionStatementData {}

export interface StopStatementData {
	stopMessage: Expression;
	condition: Expression | null;
}

export interface StopStatement extends BaseStatementData<'StopStatement'>, StopStatementData {}

export interface SendStatement extends BaseStatementData<'SendStatement'>, ExpressionStatementData {}

export type EndStatement = BaseStatementData<'EndStatement'>;

export type ControlStatement =
	| ProgramStatement
	| BlockStatement
	| ConditionalStatement
	| WhileStatement
	| DoUntilStatement
	| RepeatStatement
	| ForEachStatement
	| ForStatement;

export type SimpleStatement =
	| ExpressionStatement
	| ReadStatement
	| DeclarationStatement
	| SaveStatement
	| LoadStatement
	| AssignmentStatement
	| InsertionStatement
	| DeleteStatement
	| ReturnStatement
	| StopStatement
	| SendStatement
	| EndStatement;

export type Statement =
	| ControlStatement
	| SimpleStatement;
