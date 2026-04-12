// @ts-nocheck

import type { Token } from '../lexer/tokens';
import type { NodeMetadata } from '.';
import type { Expression } from './expressions';
import type { Statement } from './statements';

export function makeMetadata(
	startToken: Token | Statement | Expression,
	endToken: Token | Statement | Expression = undefined,
): NodeMetadata {
	const { start, column, line } = startToken;
	const end = (endToken ?? startToken).end;
	return { start, end, column, line };
}
