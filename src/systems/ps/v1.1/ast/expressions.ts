import { Token } from '../lexer/tokens';
import { ValuesOf } from '../util/types';
import { NodeMetadata } from '.';
import { BlockStatement } from './statements';

export const ExpressionKinds = ({
	NUMBER_LITERAL: 'NumberLiteralExpression',
	TEXT_LITERAL: 'TextLiteralExpression',
	BOOLEAN_LITERAL: 'BooleanLiteralExpression',
	LIST_LITERAL: 'ListLiteralExpression',
	REGISTRY_LITERAL: 'RegistryLiteralExpression',
	EMBED_LITERAL: 'EmbedLiteralExpression',
	NADA_LITERAL: 'NadaLiteralExpression',
	IDENTIFIER: 'Identifier',

	ARGUMENT: 'Argument',
	UNARY: 'UnaryExpression',
	CAST: 'CastExpression',
	BINARY: 'BinaryExpression',
	ARROW: 'ArrowExpression',
	CALL: 'CallExpression',
	CONDITIONAL: 'ConditionalExpression',
	FUNCTION: 'FunctionExpression',
	SEQUENCE: 'SequenceExpression',
}) as const;
export type ExpressionKind = ValuesOf<typeof ExpressionKinds>;

export interface EmptyExpression<T extends ExpressionKind> {
	readonly kind: NonNullable<T>;
}

export interface BaseExpressionData<T extends ExpressionKind = ExpressionKind> extends EmptyExpression<T>, NodeMetadata {}

//#region Literales
export interface NumberLiteralExpressionData {
	value: number;
}

export interface NumberLiteralExpression extends BaseExpressionData<'NumberLiteralExpression'>, NumberLiteralExpressionData {}

export interface TextLiteralExpressionData {
	value: string;
}

export interface TextLiteralExpression extends BaseExpressionData<'TextLiteralExpression'>, TextLiteralExpressionData {}

export interface BooleanLiteralExpressionData {
	value: boolean;
}

export interface BooleanLiteralExpression extends BaseExpressionData<'BooleanLiteralExpression'>, BooleanLiteralExpressionData {}

export interface ListLiteralExpressionData {
	elements: Expression[];
}

export interface ListLiteralExpression extends BaseExpressionData<'ListLiteralExpression'>, ListLiteralExpressionData {}

export interface RegistryLiteralExpressionData {
	entries: Map<string, Expression>;
}

export interface RegistryLiteralExpression extends BaseExpressionData<'RegistryLiteralExpression'>, RegistryLiteralExpressionData {}

export type EmbedLiteralExpression = BaseExpressionData<'EmbedLiteralExpression'>;

export interface NadaLiteralExpressionData {
	value: null;
}

export interface NadaLiteralExpression extends BaseExpressionData<'NadaLiteralExpression'>, NadaLiteralExpressionData {}

export interface IdentifierData {
	name: string;
}

export interface Identifier extends BaseExpressionData<'Identifier'>, IdentifierData {}
//#endregion

//#region Expresiones complejas
export interface UnaryExpressionData {
	operator: Token;
	argument: Expression;
}

export interface UnaryExpression extends BaseExpressionData<'UnaryExpression'>, UnaryExpressionData {}

export interface CastExpressionData {
	argument: Expression;
	as: Token;
}

export interface CastExpression extends BaseExpressionData<'CastExpression'>, CastExpressionData {}

export interface BinaryExpressionData {
	operator: Token;
	left: Expression;
	right: Expression;
}

export interface BinaryExpression extends BaseExpressionData<'BinaryExpression'>, BinaryExpressionData {}

export interface BaseArrowExpressionData {
	holder: Expression;
	computed: boolean;
}

export interface BaseArrowExpression extends BaseExpressionData<'ArrowExpression'>, BaseArrowExpressionData {}

export interface StoredArrowExpressionData {
	computed: false;
	key: string;
}

export type StoredArrowExpression = BaseArrowExpression & StoredArrowExpressionData;

export interface ComputedArrowExpressionData {
	computed: true;
	key: Expression;
}

export type ComputedArrowExpression = BaseArrowExpression & ComputedArrowExpressionData;

export type ArrowExpressionData = StoredArrowExpression | ComputedArrowExpression;

export type ArrowExpression = BaseExpressionData<'ArrowExpression'> & ArrowExpressionData;

export interface CallExpressionData {
	fn: Expression;
	args: Expression[];
}

export interface CallExpression extends BaseExpressionData<'CallExpression'>, CallExpressionData {}

export interface ConditionalExpressionData {
	test: Expression;
	consequent: Expression;
	alternate: Expression;
}

export interface ConditionalExpression extends BaseExpressionData<'ConditionalExpression'>, ConditionalExpressionData {}

export interface BaseArgumentExpressionData {
	identifier: string;
}

export interface RequiredArgumentData {
	optional: false;
}

export interface OptionalArgumentData {
	optional: true;
	fallback: Expression;
}

export type ArgumentExpressionData = BaseArgumentExpressionData & (RequiredArgumentData | OptionalArgumentData);

export type ArgumentExpression = BaseExpressionData<'Argument'> & ArgumentExpressionData;

export interface BaseFunctionExpressionData {
	args: ArgumentExpression[];
}

export interface BaseFunctionExpression extends BaseExpressionData<'FunctionExpression'>, BaseFunctionExpressionData {}

export interface StandardFunctionExpressionData {
	expression: false;
	body: BlockStatement;
}

export interface StandardFunctionExpression extends BaseFunctionExpression, StandardFunctionExpressionData {}

export interface LambdaExpressionData {
	expression: true;
	body: Expression;
}

export interface LambdaExpression extends BaseFunctionExpression, LambdaExpressionData {}

export type FunctionExpression = StandardFunctionExpression | LambdaExpression;

export interface SequenceExpressionData {
	expressions: Expression[];
}

export interface SequenceExpression extends BaseExpressionData<'SequenceExpression'>, SequenceExpressionData {}

export type PrimaryExpression =
	| NumberLiteralExpression
	| TextLiteralExpression
	| BooleanLiteralExpression
	| ListLiteralExpression
	| RegistryLiteralExpression
	| EmbedLiteralExpression
	| NadaLiteralExpression
	| Identifier;

export type ComplexExpression =
	| UnaryExpression
	| BinaryExpression
	| CastExpression
	| ArrowExpression
	| CallExpression
	| ConditionalExpression
	| SequenceExpression
	| ArgumentExpression
	| FunctionExpression;

export type Expression =
	| PrimaryExpression
	| ComplexExpression;
//#endregion
