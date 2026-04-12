type Whitespace = ' ' | '';
type Operator = '|' | '&';

export type SimpleTypeExpr = 'string' | 'number' | 'boolean' | 'object' | 'null' | 'undefined';
export type TypeArrayExpr<TValue extends string = string> = `${TValue}[]` | `Array<${TValue}>`;
export type TypeObjectExpr<TValue extends string = string> = `{${Whitespace}${string}:${Whitespace}${TValue}${Whitespace}}`;
export type TypeBinaryExpr<TLeft extends string = string, TRight extends string = string> = `${TLeft}${Whitespace}${Operator}${Whitespace}${TRight}`;

export type TypeExpr =
	| SimpleTypeExpr
	| TypeArrayExpr<SimpleTypeExpr>
	| TypeArrayExpr<TypeArrayExpr>
	| TypeArrayExpr<`(${TypeObjectExpr})`>
	| TypeArrayExpr<TypeBinaryExpr>
	| TypeObjectExpr<SimpleTypeExpr>
	| TypeObjectExpr<TypeArrayExpr>
	| TypeObjectExpr<TypeObjectExpr>
	| TypeBinaryExpr<SimpleTypeExpr, SimpleTypeExpr>
	| TypeBinaryExpr<SimpleTypeExpr, TypeArrayExpr>
	| TypeBinaryExpr<SimpleTypeExpr, TypeObjectExpr>
	| TypeBinaryExpr<TypeArrayExpr, SimpleTypeExpr>
	| TypeBinaryExpr<TypeArrayExpr, TypeArrayExpr>
	| TypeBinaryExpr<TypeArrayExpr, TypeObjectExpr>
	| TypeBinaryExpr<TypeObjectExpr, SimpleTypeExpr>
	| TypeBinaryExpr<TypeObjectExpr, TypeObjectExpr>
	| TypeBinaryExpr<TypeObjectExpr, TypeObjectExpr>
	| TypeBinaryExpr<SimpleTypeExpr, TypeBinaryExpr<SimpleTypeExpr>>
	| TypeBinaryExpr<SimpleTypeExpr, TypeBinaryExpr<TypeArrayExpr>>
	| TypeBinaryExpr<SimpleTypeExpr, TypeBinaryExpr<TypeObjectExpr>>
	| TypeBinaryExpr<TypeArrayExpr, TypeBinaryExpr<SimpleTypeExpr>>
	| TypeBinaryExpr<TypeArrayExpr, TypeBinaryExpr<TypeArrayExpr>>
	| TypeBinaryExpr<TypeArrayExpr, TypeBinaryExpr<TypeObjectExpr>>
	| TypeBinaryExpr<TypeObjectExpr, TypeBinaryExpr<SimpleTypeExpr>>
	| TypeBinaryExpr<TypeObjectExpr, TypeBinaryExpr<TypeObjectExpr>>
	| TypeBinaryExpr<TypeObjectExpr, TypeBinaryExpr<TypeObjectExpr>>;
