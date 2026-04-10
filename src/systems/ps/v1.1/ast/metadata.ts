import type { Token } from '../lexer/tokens';
import type { Statement } from './statements';
import type { Expression } from './expressions';
import type { NodeMetadata } from '.';

export function makeMetadata(startToken: Token | Statement | Expression, endToken: Token | Statement | Expression = undefined): NodeMetadata {
	const { start, column, line } = startToken;
	const end = (endToken ?? startToken).end;
	return { start, end, column, line };
}
