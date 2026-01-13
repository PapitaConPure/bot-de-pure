const { EmbedBuilder } = require("discord.js");

const fileRegex = /(http:\/\/|https:\/\/)(www\.)?(([a-zA-Z0-9-]){1,}\.){1,4}([a-zA-Z]){2,6}\/[a-zA-Z-_/.0-9#:?=&;,]*\.(txt|png|jpg|jpeg|webp|gif|webm|mp4|mp3|wav|flac|ogg)[a-zA-Z-_.0-9#:?=&;,]*/;
const imageRegex = /(http:\/\/|https:\/\/)(www\.)?(([a-zA-Z0-9-]){1,}\.){1,4}([a-zA-Z]){2,6}\/[a-zA-Z-_/.0-9#:?=&;,]*\.(png|jpg|jpeg|webp)[a-zA-Z-_.0-9#:?=&;,]*/;
const linkRegex = /(http:\/\/|https:\/\/)(www\.)?(([a-zA-Z0-9-]){1,}\.){1,4}([a-zA-Z]){2,6}(\/[a-zA-Z-_/.0-9#:?=&;,]*)?/;

//#region Definiciónes de Tipado
//#region Operators
/**
 * @typedef {'+'} ConcatenationOperator
 * @typedef {'+'|'-'|'*'|'/'|'%'|'^'} ArithmeticOperator
 * @typedef {'y'|'o'|'es'|'no es'|'parece'|'no parece'|'precede'|'no precede'|'excede'|'no excede'} LogicalOperator
 */
//#endregion

//#region Language
const LanguageDataTypes = /**@type {const}*/({
	Number: 'numero',
	Text: 'texto',
	Boolean: 'dupla',
	List: 'lista',
	Glossary: 'glosario',
	Embed: 'marco',
	Input: 'entrada',
	Function: 'funcion',
});
/**@typedef {import("types").ValuesOf<LanguageDataTypes>} LanguageDataType*/
//#endregion

//#region Lexer
const LexerTokenTypes = /**@type {const}*/({
    Statement: 'STATEMENT',

    BlockOpen:       'BLOCK_OPEN',
    BlockClose:      'BLOCK_CLOSE',
    ConditionOpen:   'CONDITION_OPEN',
    ConditionChange: 'CONDITION_CHANGE',
    While:           'WHILE',
    DoOpen:          'DO_OPEN',
    DoClose:         'DO_CLOSE',
    Repeat:          'REPEAT',
    RepeatOpen:      'REPEAT_OPEN',
    For:             'FOR',
    In:              'IN',
    
    Comma:       'COMMA',
    GroupOpen:  'GROUP_OPEN',
    GroupClose: 'GROUP_CLOSE',

    Assign:      'ASSIGN',
    Equals:      'EQUALS',
    Compare:     'COMPARE',
    Not:         'NOT',
    And:         'AND',
    Or:          'OR',
    Combination: 'COMBINATION',
    Factor:      'FACTOR',
    Power:       'POWER',
    Arrow:       'ARROW',
    Colon:       'COLON',

    Identifier: 'IDENTIFIER',
    Number:     'NUMBER',
    Text:       'TEXT',
    Boolean:    'BOOLEAN',
    List:       'LIST',
    Input:      'INPUT',
    Glossary:   'GLOSSARY',
    Embed:      'EMBED',
    Nada:       'NADA',
    DataType:   'DATA_TYPE',

    EoF: 'EOF',
});
/**@typedef {import("types").ValuesOf<LexerTokenTypes>} LexerTokenType*/

/**
 * @template {LexerTokenType} [T=LexerTokenType]
 * @typedef {Object} LexerToken
 * @property {T} type
 * @property {*} value
 * @property {Number} start
 * @property {Number} end
 * @property {Number} line
 */
//#endregion

//#region Parser
const ParserStatementNodeTypes = /**@type {const}*/({
	Default: 'Statement',
	Expression: 'ExpressionStatement',
	Block: 'BlockStatement',
	Conditional: 'ConditionalStatement',
	WhileLoop: 'WhileLoopStatement',
	DoWhileLoop: 'DoWhileLoopStatement',
	ForLoop: 'ForLoopStatement',
	ForInLoop: 'ForInLoopStatement',
	Declare: 'DeclareStatement',
	Registry: 'RegistryStatement',
	Relational: 'RelationalStatement',
	Send: 'SendStatement',
	Return: 'ReturnStatement',
	Break: 'BreakStatement',
	Stop: 'StopStatement',
	Comment: 'CommentStatement',
});
/**@typedef {import("types").ValuesOf<typeof ParserStatementNodeTypes>} ParserStatementNodeType*/

const ParserDataNodeTypes = /**@type {const}*/({
	Numeric: 'NumericLiteral',
	Text: 'TextLiteral',
	Boolean: 'BooleanLiteral',
	List: 'ListExpression',
	Glossary: 'GlossaryExpression',
	Nada: 'NadaLiteral',
});
/**@typedef {import("types").ValuesOf<typeof ParserDataNodeTypes>} ParserDataNodeType*/

const ParserLiteralNodeTypes = /**@type {const}*/({
	...ParserDataNodeTypes,
	TextTemplate: 'TextTemplateExpression',
	Input: 'InputExpression',
	Embed: 'EmbedExpression',
});
/**@typedef {import("types").ValuesOf<typeof ParserLiteralNodeTypes>} ParserLiteralNodeType*/

const ParserExpressionNodeTypes = /**@type {const}*/({
	Identifier:          'IdentifierExpression',
	AssignExpression:    'AssignExpression',
	UpdateExpression:    'UpdateExpression',
	LogicalExpression:   'LogicalExpression',
	SequenceExpression:  'SequenceExpression',
	CallExpression:      'CallExpression',
	ArgumentsExpression: 'ArgumentsExpression',
	ArrowExpression:     'ArrowExpression',
	UnaryExpression:     'UnaryExpression',
	BinaryExpression:    'BinaryExpression',
	Property:            'PropertyExpression',
});
/**@typedef {import("types").ValuesOf<typeof ParserExpressionNodeTypes>} ParserExpressionNodeType*/

const ParserSpecialNodeTypes = /**@type {const}*/({
	Program:             'Program',
});
/**@typedef {import("types").ValuesOf<typeof ParserSpecialNodeTypes>} ParserSpecialNodeType*/

const ParserNodeTypes = /**@type {const}*/({
	...ParserStatementNodeTypes,
	...ParserLiteralNodeTypes,
	...ParserExpressionNodeTypes,
	...ParserSpecialNodeTypes,
});
/**@typedef {import("types").ValuesOf<typeof ParserNodeTypes>} ParserNodeType*/

/**
 * 
 * @param {Partial<typeof ParserNodeTypes>} parserNodeCategory 
 * @param {ParserNodeType} parserNodeType 
 */
function parserNodeWithin(parserNodeCategory, parserNodeType) {
	return Object.values(parserNodeCategory).includes(parserNodeType)
}

/**
 * @template {ParserNodeType} [T=ParserNodeType]
 * @typedef {Object} BaseParserNode
 * @property {Readonly<NonNullable<T>>} type
 */

/**
 * @template {ParserNodeType} [T=ParserNodeType]
 * @typedef {Object} ParserCoercibleNode
 * @property {Readonly<T>} [as]
 */

/**
 * @template {*} [T=*]
 * @typedef {Object} ParserLiteralData
 * @property {Readonly<T>} value
 */

/**
 * @template {ParserLiteralNodeType} [NodeType=ParserLiteralNodeType]
 * @template {*} [DataType=*]
 * @typedef {BaseParserNode<NodeType> & ParserCoercibleNode} BaseParserLiteralNode
 */

/**
 * @typedef {BaseParserLiteralNode<'NumericLiteral'> & ParserLiteralData<number>} ParserNumericLiteralNode
 * @typedef {BaseParserLiteralNode<'TextLiteral'> & ParserLiteralData<string>} ParserTextLiteralNode
 * @typedef {BaseParserLiteralNode<'BooleanLiteral'> & ParserLiteralData<boolean>} ParserBooleanLiteralNode
 * @typedef {BaseParserLiteralNode<'NadaLiteral'> & ParserLiteralData<null>} ParserNadaLiteralNode
 * 
 * @typedef {ParserNumericLiteralNode
 *          |ParserTextLiteralNode
 *          |ParserBooleanLiteralNode
 *          |ParserNadaLiteralNode
 * } ParserLiteralExpressionNode
 */

/**
 * @typedef {Object} ParserTextTemplateExpressionData
 * @property {Array<ParserNode>} expressions
 * @typedef {BaseParserLiteralNode<'TextTemplateExpression'> & ParserTextTemplateExpressionData} ParserTextTemplateExpressionNode
 */

/**
 * @typedef {Object} ParserListExpressionData
 * @property {Readonly<Array<ParserEvaluableExpressionNode>>} elements
 * @typedef {BaseParserLiteralNode<'ListExpression'> & ParserListExpressionData} ParserListExpressionNode
 * 
 * @typedef {Object} ParserPropertyExpressionData
 * @property {ParserIdentifierNode|ParserNumericLiteralNode} key
 * @property {ParserExpressionNode} value
 * @typedef {BaseParserNode<'PropertyExpression'> & ParserPropertyExpressionData} ParserPropertyExpressionNode
 * 
 * @typedef {Object} ParserGlossaryExpressionData
 * @property {Readonly<Array<ParserPropertyExpressionNode>>} properties
 * @typedef {BaseParserLiteralNode<'GlossaryExpression'> & ParserGlossaryExpressionData} ParserGlossaryExpressionNode
 * 
 * @typedef {Object} ParserCallExpressionData
 * @property {ParserEvaluableExpressionNode} emitter
 * @property {Readonly<Array<ParserArgumentNode>>} arguments
 * @typedef {BaseParserNode<'CallExpression'> & ParserCoercibleNode & ParserCallExpressionData} ParserCallExpressionNode
 */

/**
 * @typedef {ParserListExpressionNode
 *          |ParserGlossaryExpressionNode
 *          |ParserCallExpressionNode
 * } ParserStructureExpressionNode
 */

/**
 * @typedef {Object} ParserIdentifierData
 * @property {Readonly<String>} name
 * 
 * @typedef {BaseParserNode<'IdentifierExpression'> & ParserCoercibleNode & ParserIdentifierData} ParserIdentifierNode
**/

/**
 * @typedef {ParserIdentifierNode
 *          |ParserTextTemplateExpressionNode
 *          |ParserStructureExpressionNode
 *          |ParserLiteralExpressionNode
 * } ParserPrimaryExpressionNode
 */

/**
 * @typedef {Object} ParserUnaryExpressionData
 * @property {Readonly<String>} operator
 * @property {Readonly<ParserNode>} argument
 * 
 * @typedef {BaseParserNode<'UnaryExpression'> & ParserCoercibleNode & ParserUnaryExpressionData} ParserGeneralUnaryExpressionNode
 * @typedef {BaseParserNode<'UpdateExpression'> & ParserCoercibleNode & ParserUnaryExpressionData} ParserUpdateExpressionNode
 * 
 * @typedef {ParserGeneralUnaryExpressionNode | ParserUpdateExpressionNode} ParserUnaryExpressionNode
 */

/**
 * @template {String} [T=String]
 * @typedef {Object} ParserBinaryExpressionData
 * @property {Readonly<T>} operator
 * @property {Readonly<ParserNode>} leftOperand
 * @property {Readonly<ParserNode>} rightOperand
 */

/** 
 * @typedef {BaseParserNode<'BinaryExpression'> & ParserCoercibleNode & ParserBinaryExpressionData} ParserGeneralBinaryExpressionNode
 * 
 * @typedef {BaseParserNode<'LogicalExpression'> & ParserCoercibleNode & ParserBinaryExpressionData<LogicalOperator>} ParserLogicalExpressionNode
 * 
 * @typedef {ParserGeneralBinaryExpressionNode | ParserLogicalExpressionNode} ParserBinaryExpressionNode
 */

/**
 * @typedef {Object} ParserAssignmentExpressionData
 * @property {Readonly<ParserIdentifierNode|ParserArrowExpressionNode>} receptor
 * @property {Readonly<ParserExpressionNode>} reception
 * 
 * @typedef {BaseParserNode<'AssignExpression'> & ParserAssignmentExpressionData} ParserAssignmentExpressionNode
 */

/**
 * @typedef {Object} ParserNamedBlockData
 * @property {Readonly<ParserBlockBody>} body
 * @property {Readonly<ParserIdentifierNode>} [identifier]
 * @typedef {BaseParserStatementNode<'BlockStatement'> & ParserNamedBlockData} ParserNamedBlockNode
 * 
 * @typedef {Object} ParserFunctionAssignmentExpressionData
 * @property {Readonly<ParserCallExpressionNode>} receptor
 * @property {Readonly<ParserNamedBlockNode>} reception
 * 
 * @typedef {BaseParserNode<'AssignExpression'> & ParserFunctionAssignmentExpressionData} ParserFunctionAssignmentExpressionNode
 */

/**
 * @typedef {ParserAssignmentExpressionNode | ParserFunctionAssignmentExpressionNode} ParserGeneralAssignmentExpressionNode
 */

/**
 * @typedef {Object} ParserArrowExpressionData
 * @property {Readonly<ParserExpressionNode>} container
 * @property {Readonly<ParserExpressionNode>} property
 * 
 * @typedef {BaseParserNode<'ArrowExpression'> & ParserArrowExpressionData & ParserCoercibleNode} ParserArrowExpressionNode
 */

/**
 * @typedef {Object} ParserGeneralExpressionData
 * @property {ParserNode} expression
 * 
 * @typedef {BaseParserNode<'ExpressionStatement'> & ParserCoercibleNode & ParserGeneralExpressionData} ParserGeneralExpressionNode
 */

/**
 * @typedef {ParserPrimaryExpressionNode
 *          |ParserUnaryExpressionNode
 *          |ParserBinaryExpressionNode
 *          |ParserArrowExpressionNode
 *          |ParserGeneralExpressionNode
 * } ParserEvaluableExpressionNode
 */

/**
 * @typedef {Object} ParserArgumentData
 * @property {ParserEvaluableExpressionNode} [default]
 * @typedef {ParserEvaluableExpressionNode & ParserArgumentData} ParserArgumentNode
 */

/**
 * @typedef {ParserEvaluableExpressionNode
 *          |ParserGeneralAssignmentExpressionNode
 * } ParserExpressionNode
 */

/**
 * @template {ParserStatementNodeType} T
 * @typedef {BaseParserNode<T>} BaseParserStatementNode
 */

/**
 * @typedef {Object} ParserStatementMetadata
 * @property {number} number
 */

/**
 * @typedef {BaseParserStatementNode<'ExpressionStatement'> & ParserExpressionNode} ParserExpressionStatementNode
 * 
 * @typedef {Object} ParserRegistryStatementData
 * @property {ParserAssignmentExpressionNode|ParserFunctionAssignmentExpressionNode} initialize
 * @typedef {BaseParserStatementNode<'RegistryStatement'> & ParserCoercibleNode<'CallExpression'|'InputExpression'|'ListExpression'> & ParserRegistryStatementData} ParserRegistryStatementNode
 * 
 * @typedef {Object} ParserDeclarationStatementData
 * @property {ParserIdentifierNode} identifier
 * @typedef {BaseParserStatementNode<'DeclareStatement'> & ParserCoercibleNode<ParserDataNodeType> & ParserDeclarationStatementData} ParserDeclarationStatementNode
 * 
 * @typedef {Object} ParserRelationalStatementData
 * @property {String} operator
 * @property {ParserAssignmentExpressionNode|ParserFunctionAssignmentExpressionNode} expression
 * @typedef {BaseParserStatementNode<'RelationalStatement'> & ParserRelationalStatementData} ParserRelationalStatementNode
 * 
 * @typedef {BaseParserStatementNode<'BreakStatement'>} ParserBreakStatementNode
 * 
 * @typedef {Object} ParserValueStatementData
 * @property {ParserExpressionNode} value
 * @typedef {BaseParserStatementNode<'SendStatement'|'ReturnStatement'> & ParserValueStatementData} ParserValueStatementNode
 * 
 * @typedef {BaseParserStatementNode<'CommentStatement'>} ParserCommentStatementNode
 * 
 * @typedef {ParserStatementNode & ParserStatementMetadata} ParserBlockItem
 * @typedef {Array<ParserBlockItem>} ParserBlockBody
 * @typedef {Object} ParserBlockStatementData
 * @property {Readonly<ParserBlockBody>} body
 * @typedef {BaseParserStatementNode<'BlockStatement'> & ParserBlockStatementData} ParserBlockNode
 * 
 * @typedef {Object} ParserControlStatementData
 * @property {ParserExpressionNode} test
 * 
 * @typedef {Object} ParserStopStatementData
 * @property {ParserNode} stopMessage
 * @typedef {BaseParserStatementNode<'StopStatement'> & ParserControlStatementData & ParserStopStatementData} ParserStopStatementNode
 * 
 * @typedef {Object} ParserConditionalStatementData
 * @property {ParserBlockNode} consequent
 * @property {(ParserBlockNode|ParserConditionalStatementNode) & ParserStatementMetadata} alternate
 * @typedef {BaseParserStatementNode<'ConditionalStatement'> & ParserControlStatementData & ParserConditionalStatementData} ParserConditionalStatementNode
 * 
 * @typedef {ParserBlockStatementData & ParserControlStatementData} ParserControlBlockStatementData
 * 
 * @typedef {BaseParserStatementNode<'WhileLoopStatement'|'DoWhileLoopStatement'> & ParserControlBlockStatementData} ParserWhileStatementNode
 * 
 * @typedef {Object} ParserForStatementData
 * @property {ParserAssignmentExpressionNode} assignment
 * @property {ParserExpressionNode} step
 * @typedef {BaseParserStatementNode<'ForLoopStatement'> & ParserControlBlockStatementData & ParserForStatementData} ParserForStatementNode
 * 
 * @typedef {Object} ParserForInStatementData
 * @property {ParserIdentifierNode} element
 * @property {ParserExpressionNode} list
 * @typedef {BaseParserStatementNode<'ForInLoopStatement'> & ParserBlockStatementData & ParserForInStatementData} ParserForInStatementNode
 */

/**
 * @typedef {ParserExpressionStatementNode
 *          |ParserRegistryStatementNode
 *          |ParserDeclarationStatementNode
 *          |ParserRelationalStatementNode
 *          |ParserBreakStatementNode
 *          |ParserValueStatementNode
 *          |ParserCommentStatementNode
 * } ParserSimpleStatementNode
 * 
 * @typedef {ParserBlockNode
 *          |ParserWhileStatementNode
 *          |ParserForStatementNode
 *          |ParserForInStatementNode
 * } ParserBasicScopeNode
 * 
 * @typedef {ParserBasicScopeNode
 *          |ParserConditionalStatementNode
 *          |ParserStopStatementNode
 * } ParserControlStatementNode
 * 
 * @typedef {ParserSimpleStatementNode | ParserControlStatementNode} ParserStatementNode
 */

/**
 * @typedef {Object} ParserProgramData
 * @property {Readonly<Array<ParserStatementNode & ParserStatementMetadata>>} body
 * 
 * @typedef {BaseParserNode<'Program'> & ParserProgramData} ParserProgramNode
 */

/**
 * @typedef {ParserIdentifierNode
 *          |ParserExpressionNode
 *          |ParserStatementNode
 *          |ParserBlockNode
 * } ParserNode
 */
//#endregion

//#region Interpreter
const RuntimeNodeTypes = /**@type {const}*/({
	Identifier: 'Identifier',
	Number: 'Number',
	Text: 'Text',
	Boolean: 'Boolean',
	Input: 'Input',
	List: 'List',
	Glossary: 'Glossary',
	Embed: 'Embed',
	Nada: 'Nada',
	Function: 'Function',
	NativeFunction: 'NativeFunction',
	Property: 'Property',
});
/**@typedef {typeof RuntimeNodeTypes[keyof typeof RuntimeNodeTypes]} RuntimeType*/

/**
 * @typedef {Object} BaseRuntimeValueData
 * @property {(n: RuntimeValue) => NumericValue} compareTo
 * @property {(n: RuntimeValue) => BooleanValue} equals
 */

/**
 * @template {RuntimeType} T
 * @typedef {Object} AtomicRuntimeValue
 * @property {Readonly<NonNullable<T>>} type
 */

/** 
 * @template {RuntimeType} [T=RuntimeType]
 * @typedef {AtomicRuntimeValue<T> & BaseRuntimeValueData} BaseRuntimeValue
 */

/**
 * @template [T=*]
 * @typedef {Object} RuntimePrimitiveValueData
 * @property {Readonly<NonNullable<T>>} value
 */

/**
 * @typedef {Object} RuntimePrimitiveNadaData
 * @property {Readonly<null>} value
 */

/**
 * @typedef {BaseRuntimeValue<'Number'> & RuntimePrimitiveValueData<number>} NumericValue
 * @typedef {BaseRuntimeValue<'Text'> & RuntimePrimitiveValueData<string>} TextValue
 * @typedef {BaseRuntimeValue<'Boolean'> & RuntimePrimitiveValueData<boolean>} BooleanValue
 * @typedef {BaseRuntimeValue<'Embed'> & RuntimePrimitiveValueData<EmbedBuilder>} EmbedValue
 * @typedef {BaseRuntimeValue<'Nada'> & RuntimePrimitiveNadaData} NadaValue
 * 
 * @typedef {Object} RuntimeListData
 * @property {Array<RuntimeData>} elements
 * @typedef {BaseRuntimeValue<'List'> & RuntimeListData} ListValue
 * 
 * @typedef {Object} RuntimeGlossaryData
 * @property {Map<string, RuntimeValue>} properties
 * @typedef {BaseRuntimeValue<'Glossary'> & RuntimeGlossaryData} GlossaryValue
 * 
 * @typedef {Object} TuberIdentifierData
 * @property {Readonly<String>} name
 * @typedef {AtomicRuntimeValue<'Identifier'> & TuberIdentifierData} IdentifierValue
 * 
 * @typedef {Object} RuntimeArgumentData
 * @property {ParserEvaluableExpressionNode} [default]
 * @typedef {IdentifierValue & RuntimeArgumentData} ArgumentValue
 * 
 * @typedef {Object} RuntimeFunctionValueData
 * @property {Readonly<Array<ParserStatementNode & ParserStatementMetadata>>} body
 * @property {Readonly<NonNullable<IdentifierValue>>} identifier
 * @property {Readonly<NonNullable<Array<ParserArgumentNode>>>} arguments
 * @typedef {BaseRuntimeValue<'Function'> & RuntimeFunctionValueData} FunctionValue
 * 
 * @typedef {Object} TuberNativeFunctionValueData
 * @property {Readonly<Function>} call
 * @typedef {BaseRuntimeValue<'NativeFunction'> & TuberNativeFunctionValueData} NativeFunctionValue
 * 
 * @typedef {NumericValue | TextValue | BooleanValue} RuntimePrimitive
 * @typedef {ListValue | GlossaryValue | EmbedValue} RuntimeStructure
 * 
 * @typedef {RuntimePrimitive | RuntimeStructure} RuntimeData
 * 
 * @typedef {RuntimeData | NadaValue} RuntimeNadable
 * @typedef {RuntimeData | FunctionValue | NativeFunctionValue | NadaValue} RuntimeItem
 * 
 * @typedef {RuntimeItem | IdentifierValue} RuntimeValue
 */

/**
 * @typedef {{ type: 'Property', key: ParserIdentifierNode, value: RuntimeValue }} RuntimePropertyNode
 */

/**
 * 
 * @param {ParserNode|RuntimeValue} node 
 * @returns {node is ParserNode}
 */
function isParserNode(node) {
	//@ts-expect-error
	return node?.type != null && parserNodeWithin(ParserNodeTypes, node.type);
}

/**
 * 
 * @param {ParserNode|RuntimeValue} node 
 * @returns {node is RuntimeValue}
 */
function isRuntimeValue(node) {
	//@ts-expect-error
	return node?.type != null && parserNodeWithin(RuntimeNodeTypes, node.type);
}

/**
 * 
 * @param {RuntimeValue} runtime 
 * @returns {runtime is IdentifierValue}
 */
function isIdentifier(runtime) {
	return runtime.type === 'Identifier' && runtime.name != undefined;
}
//#endregion
//#endregion

//#region Manejo de Errores
/**
 * Alza un error e indica la posición del error
 * @param {String} message 
 * @param {{ number: Number, name: String }} statement 
 * @returns {Error}
 */
function TuberInterpreterError(message = 'Se encontró un Token inesperado', statement = { number: -1, name: 'desconocida' }) {
	const err = new Error(`[Orden ${statement.number}: ${statement.name}] ${message}`);
	err.name = 'TuberInterpreterError';
	return err;
}
//#endregion

//#region Creación de Runtime Value
/**@param {NumericValue|TextValue|BooleanValue} other*/
function basicCompareTo(other) {
	if(this.type !== other.type)
		return makeNumber(-1);
	
	if(this.value === other.value)
		return makeNumber(0);

	return makeNumber(this.value < other.value ? -1 : 1);
}

/**@param {NumericValue|TextValue|BooleanValue|EmbedValue|NadaValue} other*/
function basicEquals(other) {
	return makeBoolean(this.type === other.type && this.value === other.value);
}

/**@param {ListValue} other*/
function listEquals(other) {
	return makeBoolean(other.type === 'List' && this.type === other.type && this.elements === other.elements);
}

/**@param {GlossaryValue} other*/
function glossaryEquals(other) {
	return makeBoolean(other.type === 'Glossary' && this.type === other.type && this.properties === other.properties);
}

/**@type {Map<RuntimeType, BaseRuntimeValue['compareTo']>}*/
const runtimeCompareToFns = new Map();
runtimeCompareToFns
	.set('Number',   basicCompareTo)
	.set('Text',     basicCompareTo)
	.set('Boolean',  basicCompareTo)
	.set('List',     _ => makeNumber(-1))
	.set('Glossary', _ => makeNumber(-1))
	.set('Embed',    _ => makeNumber(-1))
	.set('Nada',     _ => makeNumber(-1));

/**@type {Map<RuntimeType, BaseRuntimeValue['equals']>}*/
const runtimeEqualsFns = new Map();
runtimeEqualsFns
	.set('Number',   basicEquals)
	.set('Text',     basicEquals)
	.set('Boolean',  basicEquals)
	.set('List',     listEquals)
	.set('Glossary', glossaryEquals)
	.set('Embed',    basicEquals)
	.set('Nada',     basicEquals);

/**
 * @param {Number} x
 * @returns {NumericValue}
 */
function makeNumber(x) {
	return {
		type: 'Number',
		value: x,
		compareTo: runtimeCompareToFns.get('Number'),
		equals: runtimeEqualsFns.get('Number'),
	};
}

/**
 * @param {String} x
 * @returns {TextValue}
 */
function makeText(x) {
	return {
		type: 'Text',
		value: x,
		compareTo: runtimeCompareToFns.get('Text'),
		equals: runtimeEqualsFns.get('Text'),
	};
}

/**
 * @param {Boolean} x
 * @returns {BooleanValue}
 */
function makeBoolean(x) {
	return {
		type: 'Boolean',
		value: x,
		compareTo: runtimeCompareToFns.get('Boolean'),
		equals: runtimeEqualsFns.get('Boolean'),
	};
}

/**
 * @param {Array} x
 * @returns {ListValue}
 */
function makeList(x) {
	return {
		type: 'List',
		elements: x,
		compareTo: runtimeCompareToFns.get('List'),
		equals: runtimeEqualsFns.get('List'),
	};
}

/**
 * @param {Map<String, RuntimeValue>} x
 * @returns {GlossaryValue}
 */
function makeGlossary(x) {
	return {
		type: 'Glossary',
		properties: x,
		compareTo: runtimeCompareToFns.get('Glossary'),
		equals: runtimeEqualsFns.get('Glossary'),
	};
}

/**
 * @returns {EmbedValue}
 */
function makeEmbed() {
	return {
		type: 'Embed',
		value: new EmbedBuilder(),
		compareTo: runtimeCompareToFns.get('Embed'),
		equals: runtimeEqualsFns.get('Embed'),
	};
}

/**
 * @returns {NadaValue}
 */
function makeNada() {
	return {
		type: 'Nada',
		value: null,
		compareTo: runtimeCompareToFns.get('Nada'),
		equals: runtimeEqualsFns.get('Nada'),
	};
}
//#endregion

//#region Comprobaciones de tipo de Runtime Value
/**
 * Comprueba si un valor es un NumericValue
 * @param {RuntimeValue} runtime 
 * @returns {runtime is NumericValue}
 */
function isNumeric(runtime) {
	return runtime.type === 'Number' && !isNotOperable(runtime.value);
}

/**
 * Comprueba si un valor es un TextValue
 * @param {RuntimeValue} runtime 
 * @returns {runtime is TextValue}
 */
function isText(runtime) {
	return runtime.type === 'Text' && typeof runtime.value === 'string';
}

/**
 * Comprueba si un valor es un BooleanValue
 * @param {RuntimeValue} runtime 
 * @returns {runtime is BooleanValue}
 */
function isBoolean(runtime) {
	return runtime.type === 'Boolean' && typeof runtime.value === 'boolean';
}

/**
 * Comprueba si un valor es un ListValue
 * @param {RuntimeValue} runtime 
 * @returns {runtime is ListValue}
 */
function isList(runtime) {
    const known = /**@type {ListValue}*/(/**@type {unknown}*/(runtime));
	return runtime.type === 'List' && Array.isArray(known.elements);
}

/**
 * Comprueba si un valor es un GlossaryValue
 * @param {RuntimeValue} runtime 
 * @returns {runtime is GlossaryValue}
 */
function isGlossary(runtime) {
    const known = /**@type {GlossaryValue}*/(/**@type {unknown}*/(runtime));
	return runtime.type === 'Glossary' && known.properties !== undefined;
}

/**
 * Comprueba si un valor es un EmbedValue
 * @param {RuntimeValue} runtime 
 * @returns {runtime is EmbedValue}
 */
function isEmbed(runtime) {
    const known = /**@type {EmbedValue}*/(/**@type {unknown}*/(runtime));
	return runtime.type === 'Embed' && known.value instanceof EmbedBuilder;
}

/**
 * Comprueba si un valor es un FunctionValue
 * @param {RuntimeValue} runtime 
 * @returns {runtime is FunctionValue}
 */
function isFunction(runtime) {
    const known = /**@type {FunctionValue}*/(/**@type {unknown}*/(runtime));
	return runtime.type === 'Function' && Array.isArray(known.body);
}

/**
 * Comprueba si un valor es un NativeFunctionValue
 * @param {RuntimeValue} runtime 
 * @returns {runtime is NativeFunctionValue}
 */
function isNativeFunction(runtime) {
    const known = /**@type {NativeFunctionValue}*/(/**@type {unknown}*/(runtime));
	return runtime.type === 'NativeFunction' && typeof known.call === 'function';
}

/**
 * Comprueba si un valor es Nada o inoperable
 * @param {RuntimeValue} node 
 * @returns {Boolean}
 */
function isNada(node) {
	if(node == undefined)
		return true;

	if(node.type === 'Nada')
		return true;

	return !(
		   isNumeric(node)
		|| isText(node)
		|| isBoolean(node)
		|| isList(node)
		|| isGlossary(node)
		|| isFunction(node)
		|| isEmbed(node)
		|| isNativeFunction(node)
	);
}
//#endregion

//#region Utilidades de Runtime Value
/**
 * Comprueba si un valor no existe o es numéricamente inoperable
 * @param {*} value 
 * @returns {Boolean}
 */
function isNotOperable(value) {
	return value == undefined || isNaN(value) || !isFinite(value);
}

/**
 * Comprueba si un valor es Nada o inoperable
 * @param {RuntimeValue} node 
 */
function isNotValidText(node) {
	return node?.type !== 'Text';
}

/**
 * @param {Function} fn
 * @returns {NativeFunctionValue}
 */
function makeNativeFunction(fn) {
	return {
		type: 'NativeFunction',
		compareTo: _ => makeNumber(-1),
		equals: n => makeBoolean(n.type === 'NativeFunction' && n.call === fn),
		call: fn,
	};
}

/**
 * @param {Readonly<Array<ParserStatementNode & ParserStatementMetadata>>} body
 * @param {Readonly<Array<ParserArgumentNode>>} args
 * @param {Readonly<IdentifierValue>} [identifier]
 * @returns {FunctionValue}
 */
function makeFunction(body, args, identifier = null) {
	return {
		type: 'Function',
		compareTo: _ => makeNumber(-1),
		equals: n => makeBoolean(n.type === 'Function' && n.identifier === identifier && n.body === body && n.arguments === args),
		identifier,
		body,
		arguments: args
	};
}

function extendList(list, item, position = null) {
	list.elements.splice(position ?? list.elements.length, 0, item);
}
//#endregion

//#region Mapas de relaciones de tipos
/**@type {Map<LanguageDataType, ParserNodeType>}*/
const LanguageDataToParserType = new Map();
LanguageDataToParserType
	.set(LanguageDataTypes.Number, ParserNodeTypes.Numeric)
	.set(LanguageDataTypes.Text, ParserNodeTypes.Text)
	.set(LanguageDataTypes.Boolean, ParserNodeTypes.Boolean)
	.set(LanguageDataTypes.List, ParserNodeTypes.List)
	.set(LanguageDataTypes.Glossary, ParserNodeTypes.Glossary)
	.set(LanguageDataTypes.Embed, ParserNodeTypes.Embed)
	.set(LanguageDataTypes.Input, ParserNodeTypes.Input)
	.set(LanguageDataTypes.Function, ParserNodeTypes.CallExpression);

/**@type {Map<String, LexerTokenType>}*/
const LanguageToLexerType = new Map();
LanguageToLexerType
	.set('con', LexerTokenTypes.Assign)
	.set('numero', LexerTokenTypes.Number)
	.set('texto', LexerTokenTypes.Text)
	.set('dupla', LexerTokenTypes.Boolean)
	.set('entrada', LexerTokenTypes.Input)
	.set('lista', LexerTokenTypes.List)
	.set('glosario', LexerTokenTypes.Glossary)
	.set('marco', LexerTokenTypes.Embed)
	.set('identificador', LexerTokenTypes.Identifier);

/**
 * @type {Map<LexerTokenType, ParserNodeType>}
 */
const LexerToParserType = new Map();
LexerToParserType
	.set(LexerTokenTypes.Assign,     ParserNodeTypes.AssignExpression)
	.set(LexerTokenTypes.Number,     ParserNodeTypes.Numeric)
	.set(LexerTokenTypes.Text,       ParserNodeTypes.Text)
	.set(LexerTokenTypes.Boolean,    ParserNodeTypes.Boolean)
	.set(LexerTokenTypes.Input,      ParserNodeTypes.Input)
	.set(LexerTokenTypes.List,       ParserNodeTypes.List)
	.set(LexerTokenTypes.Glossary,   ParserNodeTypes.Glossary)
	.set(LexerTokenTypes.Embed,      ParserNodeTypes.Embed)
	.set(LexerTokenTypes.Identifier, ParserNodeTypes.Identifier);

/**@type {Map<ParserNodeType, RuntimeType>}*/
const ParserToRuntimeType = new Map();
ParserToRuntimeType
	.set(ParserNodeTypes.Identifier, RuntimeNodeTypes.Identifier)
	.set(ParserNodeTypes.Numeric,    RuntimeNodeTypes.Number)
	.set(ParserNodeTypes.Text,       RuntimeNodeTypes.Text)
	.set(ParserNodeTypes.Boolean,    RuntimeNodeTypes.Boolean)
	.set(ParserNodeTypes.Input,      RuntimeNodeTypes.Input)
	.set(ParserNodeTypes.List,       RuntimeNodeTypes.List)
	.set(ParserNodeTypes.Glossary,   RuntimeNodeTypes.Glossary)
	.set(ParserNodeTypes.Embed,      RuntimeNodeTypes.Embed)
	.set(ParserNodeTypes.Nada,       RuntimeNodeTypes.Nada);

/**@type {Map<RuntimeType, ParserNodeType>}*/
const RuntimeToParserType = new Map();
RuntimeToParserType
	.set(RuntimeNodeTypes.Identifier, ParserNodeTypes.Identifier)
	.set(RuntimeNodeTypes.Number,     ParserNodeTypes.Numeric)
	.set(RuntimeNodeTypes.Text,       ParserNodeTypes.Text)
	.set(RuntimeNodeTypes.Boolean,    ParserNodeTypes.Boolean)
	.set(RuntimeNodeTypes.Input,      ParserNodeTypes.Input)
	.set(RuntimeNodeTypes.List,       ParserNodeTypes.List)
	.set(RuntimeNodeTypes.Glossary,   ParserNodeTypes.Glossary)
	.set(RuntimeNodeTypes.Embed,      ParserNodeTypes.Embed)
	.set(RuntimeNodeTypes.Nada,       ParserNodeTypes.Nada);
	
/**@type {Map<import('./commons.js').ParserNodeType, String>}*/
const ParserToLanguageType = new Map();
ParserToLanguageType
	.set(ParserStatementNodeTypes.Default,     'sentencia')
	.set(ParserStatementNodeTypes.Expression,  'sentencia de expresión')
	.set(ParserStatementNodeTypes.Block,       'sentencia de bloque')
	.set(ParserStatementNodeTypes.Conditional, 'sentencia SI')
	.set(ParserStatementNodeTypes.WhileLoop,   'sentencia MIENTRAS')
	.set(ParserStatementNodeTypes.DoWhileLoop, 'sentencia HACER...YSEGUIR MIENTRAS')
	.set(ParserStatementNodeTypes.ForLoop,     'sentencia PARA')
	.set(ParserStatementNodeTypes.ForInLoop,   'sentencia PARA CADA')
	.set(ParserStatementNodeTypes.Declare,     'sentencia CREAR')
	.set(ParserStatementNodeTypes.Registry,    'sentencia REGISTRAR')
	.set(ParserStatementNodeTypes.Relational,  'sentencia relacional')
	.set(ParserStatementNodeTypes.Send,        'sentencia ENVIAR')
	.set(ParserStatementNodeTypes.Return,      'sentencia DEVOLVER')
	.set(ParserStatementNodeTypes.Break,       'sentencia TERMINAR')
	.set(ParserStatementNodeTypes.Stop,        'sentencia PARAR')
	.set(ParserStatementNodeTypes.Comment,     'sentencia COMENTAR')

	.set(ParserLiteralNodeTypes.Numeric,  'numero')
	.set(ParserLiteralNodeTypes.Text,     'texto')
	.set(ParserLiteralNodeTypes.Boolean,  'dupla')
	.set(ParserLiteralNodeTypes.Input,    'entrada')
	.set(ParserLiteralNodeTypes.List,     'lista')
	.set(ParserLiteralNodeTypes.Glossary, 'glosario')
	.set(ParserNodeTypes.Embed,           'marco')

	.set(ParserNodeTypes.Identifier, 'identificador')

	.set(ParserExpressionNodeTypes.ArgumentsExpression, 'expresión de argumentos')
	.set(ParserExpressionNodeTypes.ArrowExpression,     'expresión de flecha')
	.set(ParserExpressionNodeTypes.AssignExpression,    'expresión de asignación')
	.set(ParserExpressionNodeTypes.BinaryExpression,    'expresión binaria')
	.set(ParserExpressionNodeTypes.CallExpression,      'expresión de llamado de función')
	.set(ParserExpressionNodeTypes.LogicalExpression,   'expresión lógica')
	.set(ParserExpressionNodeTypes.Property,            'expresión de propiedad')
	.set(ParserExpressionNodeTypes.SequenceExpression,  'expresión de secuencia')
	.set(ParserExpressionNodeTypes.UnaryExpression,     'expresión unaria')
	.set(ParserExpressionNodeTypes.UpdateExpression,    'expresión de actualización de valor');

/**@type {Map<RuntimeType, String>}*/
const RuntimeToLanguageType = new Map();
RuntimeToLanguageType
	.set(RuntimeNodeTypes.Identifier, 'Identificador')
	.set(RuntimeNodeTypes.Number,     'Número')
	.set(RuntimeNodeTypes.Text,       'Texto')
	.set(RuntimeNodeTypes.Boolean,    'Dupla')
	.set(RuntimeNodeTypes.Input,      'Entrada')
	.set(RuntimeNodeTypes.List,       'Lista')
	.set(RuntimeNodeTypes.Glossary,   'Glosario')
	.set(RuntimeNodeTypes.Embed,      'Marco')
	.set(RuntimeNodeTypes.Nada,       'Nada');

/**@type {Map<LexerTokenType, String>}*/
const LexerToLanguageType = new Map();
LexerToLanguageType
	.set(LexerTokenTypes.Assign, 'Asignación')
	.set(LexerTokenTypes.Arrow, 'Flecha')
	.set(LexerTokenTypes.Colon, 'Dos Puntos')
	.set(LexerTokenTypes.Comma, 'Coma')
	.set(LexerTokenTypes.Number, 'Número')
	.set(LexerTokenTypes.Text, 'Texto')
	.set(LexerTokenTypes.Boolean, 'Dupla')
	.set(LexerTokenTypes.Input, 'Entrada')
	.set(LexerTokenTypes.List, 'Lista')
	.set(LexerTokenTypes.Glossary, 'Glosario')
	.set(LexerTokenTypes.Embed, 'Marco')
	.set(LexerTokenTypes.DataType, 'Tipo de Dato')
	.set(LexerTokenTypes.Identifier, 'Identificador')
	.set(LexerTokenTypes.Statement, 'Sentencia')
	.set(LexerTokenTypes.GroupOpen, 'Apertura de Paréntesis')
	.set(LexerTokenTypes.GroupClose, 'Cierre de Paréntesis')
	.set(LexerTokenTypes.BlockOpen, 'Apertura de Bloque')
	.set(LexerTokenTypes.BlockClose, 'Cierre de Bloque')
	.set(LexerTokenTypes.ConditionOpen, 'Apertura de Bloque Condicional')
	.set(LexerTokenTypes.ConditionChange, 'Alternación de Bloque Condicional')
	.set(LexerTokenTypes.Repeat, 'Indicador de Iteración Definida')
	.set(LexerTokenTypes.RepeatOpen, 'Apertura de Bloque de Iteración Definida')
	.set(LexerTokenTypes.While, 'Apertura de Bloque de Iteración Condicional')
	.set(LexerTokenTypes.For, 'Apertura de Bloque de Iteración con Contador')
	.set(LexerTokenTypes.DoOpen, 'Apertura de Bloque de Iteración de Un Mínimo Ciclo')
	.set(LexerTokenTypes.DoClose, 'Cierre de Bloque de Iteración de Un Mínimo Ciclo')
	.set(LexerTokenTypes.Combination, 'Operador Aditivo')
	.set(LexerTokenTypes.Factor, 'Operador Multiplicativo')
	.set(LexerTokenTypes.Power, 'Operador de Potencia')
	.set(LexerTokenTypes.Compare, 'Operador de Comparación')
	.set(LexerTokenTypes.Equals, 'Operador de Ecuación')
	.set(LexerTokenTypes.Not, 'Operador No')
	.set(LexerTokenTypes.And, 'Operador Y')
	.set(LexerTokenTypes.Or, 'Operador O')
	.set(LexerTokenTypes.In, 'Operador En')
	.set(LexerTokenTypes.Identifier, 'Identificador')
	.set(LexerTokenTypes.Identifier, 'Identificador')
	.set(LexerTokenTypes.EoF, 'Fin de Programa');
//#endregion

//#region Mapa de coerciones de valores
/**@type {Map<(RuntimeData|NadaValue)['type'], Map<(RuntimeData)['type'], (x: *) => RuntimeValue>>}*/
const coercions = new Map();
coercions
	.set('Number',   new Map())
	.set('Text',     new Map())
	.set('Boolean',  new Map())
	.set('List',     new Map())
	.set('Glossary', new Map())
	.set('Embed',    new Map())
	.set('Nada',     new Map());

coercions.get('Number')
	.set('Number',   (x) => makeNumber(x))
	.set('Text',     (x) => makeText(`${x ?? 'Nada'}`))
	.set('Boolean',  (x) => makeBoolean(x ? true : false))
	.set('List',     (_) => makeNada())
	.set('Glossary', (_) => makeNada());

coercions.get('Text')
	.set('Number',   (x) => makeNumber(isNotOperable(+x) ? 0 : +x))
	.set('Text',     (x) => makeText(x))
	.set('Boolean',  (x) => makeBoolean(x ? true : false))
	.set('List',     (x) => makeList([ ...x ]))
	.set('Glossary', (_) => makeNada());

coercions.get('Boolean')
	.set('Number',   (x) => makeNumber(x ? 1 : 0))
	.set('Text',     (x) => makeText(x ? 'Verdadero' : 'Falso'))
	.set('Boolean',  (x) => makeBoolean(x))
	.set('List',     (_) => makeNada())
	.set('Glossary', (_) => makeNada());

coercions.get('List')
	.set('Number',   (_) => makeNada())
	.set('Text',     (x) => {
		return makeText(`(${x?.map(y => makeValue(y, 'Text').value).join('')})`)
	})
	.set('Boolean',  (x) => makeBoolean(x?.length ? true : false))
	.set('List',     (x) => makeList(x))
	.set('Glossary', (x) => {
		if(!Array.isArray(x)) return makeNada();
		const properties = new Map();
		x.forEach((element, i) => properties.set(i, element));
		return makeGlossary(properties);
	});

coercions.get('Glossary')
	.set('Number',   (_) => makeNada())
	.set('Text',     (/**@type Map<string, RuntimeValue>*/ x) => {
		let glossaryStrings = [];
		for(const [key, value] of x) {
			const coercedValue = makeValue(value, 'Text').value;
			glossaryStrings.push(`${key}: ${coercedValue}`);
		}
		return makeText(`{Gl ${glossaryStrings.join(', ')}}`);
	})
	.set('Boolean',  (x) => makeBoolean(x?.size ? true : false))
	.set('List',     (_) => makeNada())
	.set('Glossary', (x) => makeGlossary(x));

coercions.get('Embed')
	.set('Number',   (_) => makeNada())
	.set('Text',     (_) => makeText('[Marco]'))
	.set('Boolean',  (x) => makeBoolean(x ? true : false))
	.set('List',     (_) => makeNada())
	.set('Glossary', (/**@type {EmbedBuilder}*/x) => {
		if(x == null || x.data == null)
			return makeNada();

		const properties = new Map()
			.set('color', makeNumber(x.data.color));

		if(x.data.title)
			properties.set('título', makeText(x.data.title));

		if(x.data.description)
			properties.set('descripción', makeText(x.data.description));
		
		if(x.data.author)
			properties.set('autor', makeGlossary(new Map()
				.set('nombre', x.data.author.name ? makeText(x.data.author.name) : makeNada())
				.set('ícono', x.data.author.name ? makeText(x.data.author.icon_url) : makeNada())
			));
			
		if(x.data.footer)
			properties.set('pie', makeGlossary(new Map()
				.set('texto', x.data.author.name ? makeText(x.data.footer.text) : makeNada())
				.set('ícono', x.data.author.name ? makeText(x.data.footer.icon_url) : makeNada())
			));
		
		if(x.data.timestamp)
			properties.set('tiempo', makeText(x.data.timestamp));

		if(x.data.image?.url)
			properties.set('imagen', makeText(x.data.image.url));
		
		if(x.data.video?.url)
			properties.set('video', makeText(x.data.video.url));
		
		if(x.data.thumbnail?.url)
			properties.set('miniatura', makeText(x.data.thumbnail.url));
		
		if(x.data.url)
			properties.set('enlace', makeText(x.data.url));
		
		return makeGlossary(properties);
	});

coercions.get('Nada')
	.set('Number',   (_) => makeNada())
	.set('Text',     (_) => makeText('Nada'))
	.set('Boolean',  (_) => makeBoolean(false))
	.set('List',     (_) => makeNada())
	.set('Glossary', (_) => makeNada())
//#endregion

//#region Creación de Valor Arbitrario
/**@typedef {ParserLiteralExpressionNode|ParserListExpressionNode|ParserGlossaryExpressionNode|RuntimeValue} MakeableTypes*/
/**
 * @overload
 * @param {MakeableTypes} node
 * @param {'Number'} type
 * @return {NumericValue}
 */
/**
 * @overload
 * @param {MakeableTypes} node
 * @param {'Text'} type
 * @return {TextValue}
 */
/**
 * @overload
 * @param {MakeableTypes} node
 * @param {'Boolean'} type
 * @return {BooleanValue}
 */
/**
 * @overload
 * @param {MakeableTypes} node
 * @param {'List'} type
 * @return {ListValue}
 */
/**
 * @overload
 * @param {MakeableTypes} node
 * @param {'Glossary'} type
 * @return {GlossaryValue}
 */
/**
 * @overload
 * @param {MakeableTypes} node
 * @param {'Embed'} type
 * @return {EmbedValue}
 */
/**
 * @overload
 * @param {MakeableTypes} node
 * @param {'Function'} type
 * @return {FunctionValue}
 */
/**
 * @overload
 * @param {MakeableTypes} node
 * @param {'NativeFunction'} type
 * @return {NativeFunctionValue}
 */
/**
 * @overload
 * @param {MakeableTypes} node
 * @param {'Nada'} type
 * @return {NadaValue}
 */
/**
 * @overload
 * @param {ParserNode|RuntimeValue} node
 * @param {RuntimeType} type
 * @return {RuntimeValue}
 */
/**
 * Crea un valor del tipo especificado con el valor especificado.
 * Si el valor y el tipo no coinciden, se intentará convertir el valor al tipo indicado.
 * Si la conversión no es posible, se alzará un error
 * @param {MakeableTypes} node
 * @param {RuntimeValue['type']} type 
 */
function makeValue(node, type) {
	if(node == null || node.type == null)
		throw TuberInterpreterError('Tipo origen corrupto en creación de valor');

	if(type == null)
		throw TuberInterpreterError('Tipo destino corrupto en creación de valor');

	if(type === 'Nada' || type === 'Identifier' || type === 'Embed' || type === 'Function' || type === 'NativeFunction') {
		if((ParserToRuntimeType.get(/**@type {ParserNode}*/(node).type) ?? node.type) === type)
			return node;
		throw TuberInterpreterError(`Tipo destino de conversión inválido: ${RuntimeToLanguageType.get(type) ?? type}`);
	}

	if(isParserNode(node))
		return makeRuntimeValueFromParserNode(node, type);
	
	if(node.type === 'Identifier' || node.type === 'Function' || node.type === 'NativeFunction') {
		//@ts-expect-error
		if(node.type === type)
			return node;
		throw TuberInterpreterError(`Tipo origen inesperado en creación de valor: ${RuntimeToLanguageType.get(node.type) ?? node.type}`);
	}

	if(node.type === type)
		return node;

	if(node.type === 'List')
		return coercions.get('List').get(type)(node.elements);

	if(node.type === 'Glossary')
		return coercions.get('Glossary').get(type)(node.properties);

	const coercion = coercions.get(node.type).get(type);
	if(!coercion)
		throw TuberInterpreterError(`Tipo origen inesperado en creación de valor: ${RuntimeToLanguageType.get(node.type) ?? node.type}`);

	return coercion(node.value);
}

/**
 * Crea un valor del tipo especificado con el valor especificado.
 * Si el valor y el tipo no coinciden, se intentará convertir el valor al tipo indicado.
 * Si la conversión no es posible, se alzará un error
 * @param {ParserLiteralExpressionNode|ParserListExpressionNode|ParserGlossaryExpressionNode} node
 * @param {RuntimeData['type']} type 
 * @returns {RuntimeValue}
 */
function makeRuntimeValueFromParserNode(node, type) {
	if(node.type === 'ListExpression')
		return coercions.get('List').get(type)(node.elements);

	if(node.type === 'GlossaryExpression')
		return coercions.get('Glossary').get(type)(node.properties);

	const sourceCoercion = coercions.get(/**@type {(RuntimeData|NadaValue)['type']}*/(ParserToRuntimeType.get(node.type)));

	if(!sourceCoercion)
		throw TuberInterpreterError('Tipo origen inesperado en creación de valor');
	
	const coercion = sourceCoercion.get(type);
	if(!coercion)
		throw TuberInterpreterError('Tipo destino inesperado en creación de valor');

	return coercion(node.value);
}

/**
 * @param {RuntimeValue} runtime
 */
function extractFromRuntimeValue(runtime) {
	if(runtime == undefined)
		return undefined;
	
	if(runtime.type === 'List')
		return runtime.elements;
	
	if(runtime.type === 'Glossary')
		return runtime.properties;

	if(runtime.type === 'Function' || runtime.type === 'NativeFunction' || runtime.type === 'Identifier')
		throw TuberInterpreterError(`Símbolo inesperado en extracción de valor de expresión: ${RuntimeToLanguageType.get(runtime.type) ?? runtime.type}`);

	return runtime.value;
}
//#endregion

module.exports = {
	LanguageDataToParserType,
	LexerTokenTypes,
	ParserStatementNodeTypes,
	ParserDataNodeTypes,
	ParserLiteralNodeTypes,
	ParserExpressionNodeTypes,
	ParserSpecialNodeTypes,
	ParserNodeTypes,
	RuntimeNodeTypes,
	parserNodeWithin,
	basicCompareTo,
	basicEquals,
	makeNumber,
	makeText,
	makeBoolean,
	makeList,
	makeGlossary,
	makeEmbed,
	makeNada,
	makeNativeFunction,
	makeFunction,
	extendList,
	isNumeric,
	isText,
	isBoolean,
	isList,
	isGlossary,
	isEmbed,
	isFunction,
	isNada,
	isNotOperable,
	isNotValidText,
	TuberInterpreterError,
	makeValue,
	extractFromRuntimeValue,
	fileRegex,
	imageRegex,
	linkRegex,
	LanguageToLexerType,
	LexerToParserType,
	ParserToRuntimeType,
	RuntimeToParserType,
	RuntimeToLanguageType,
	ParserToLanguageType,
	LexerToLanguageType,
	coercions,
};