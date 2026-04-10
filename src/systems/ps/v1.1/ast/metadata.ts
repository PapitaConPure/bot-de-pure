import { Token } from '../lexer/tokens';
import { Statement } from './statements';
import { Expression } from './expressions';
import { NodeMetadata } from '.';

export function makeMetadata(startToken: Token | Statement | Expression, endToken: Token | Statement | Expression = undefined): NodeMetadata {
	const { start, column, line } = startToken;
	const end = (endToken ?? startToken).end;
	return { start, end, column, line };
}
