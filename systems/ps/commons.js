/**
 * @typedef {{ type: String, value: String }} TuberToken
 * 
 * @typedef {'Statement'
 * |         'ExpressionStatement'
 * |         'BlockStatement'
 * |         'ConditionalStatement'
 * |         'WhileLoopStatement'
 * |         'DoWhileLoopStatement'
 * |         'ForLoopStatement'
 * |         'ForInLoopStatement'
 * |         'DeclareStatement'
 * |         'RegistryStatement'
 * |         'RelationalStatement'
 * |         'SendStatement'
 * |         'ReturnStatement'
 * |         'BreakStatement'
 * |         'CommentStatement'
 * } NodeStatementType
 * @typedef {'Identifier'
 * |         'NumericLiteral'
 * |         'TextLiteral'
 * |         'TextTemplateExpression'
 * |         'BooleanLiteral'
 * |         'ListExpression'
 * |         'GlossaryExpression'
 * |         'InputExpression'
 * |         'EmbedExpression'
 * |         'NadaLiteral'
 * } NodeLiteralType
 * @typedef {'Program'
 * |         NodeStatementType
 * |         'AssignExpression'
 * |         'UpdateExpression'
 * |         'LogicalExpression'
 * |         'SequenceExpression'
 * |         'CallExpression'
 * |         'ArgumentsExpression'
 * |         'ArrowExpression'
 * |         'UnaryExpression'
 * |         'BinaryExpression'
 * |         'Property'
 * |         NodeLiteralType
 * } NodeType
 * @typedef {{ type: NodeType, value: *? }} TuberNode
 * @typedef {{ type: 'Identifier', name: String }} TuberIdentifierNode
 * @typedef {{ type: 'BinaryExpression', operator: String, leftOperand: TuberNode, rightOperand: TuberNode }} TuberBinaryNode
 * @typedef {{ type: NodeStatementType, operator: String?, expression: (TuberNode | TuberBinaryNode)?, identifier: TuberIdentifierNode?, as: NodeType?, context: NodeType? }} TuberStatementNode
 * @typedef {{ type: 'BlockStatement', test: (TuberNode | TuberBinaryNode)?, body: Array<TuberStatementNode | TuberBlockNode> }} TuberBlockNode
 * @typedef {{ type: 'Program', body: Array<TuberStatementNode | TuberBlockNode> }} TuberProgramNode
 * 
 * @typedef {'Identifier'
 * | 'Number'
 * | 'Text'
 * | 'Boolean'
 * | 'Input'
 * | 'List'
 * | 'Glossary'
 * | 'Embed'
 * | 'Nada'
 * | 'NativeFunction'
 * } ProgramType
 * @typedef {{ key: String, value: RuntimeValue }} PropertyValue
 * @typedef {{ type: ProgramType, value: any     }} RuntimeValue
 * @typedef {{ type: 'Number',    value: Number  }} NumericValue
 * @typedef {{ type: 'Text',      value: String  }} TextValue
 * @typedef {{ type: 'Boolean',   value: Boolean }} BooleanValue
 * @typedef {{ type: 'List', elements: Array<RuntimeValue> }} ListValue
 * @typedef {{ type: 'Glossary', properties: Map<String, PropertyValue> }} GlossaryValue
 * @typedef {{ type: 'Embed', value: EmbedBuilder }} EmbedValue
 * @typedef {{ type: 'Nada', value: null }} NadaValue
 * @typedef {{ type: 'NativeFunction', call: Function }} NativeFunctionValue
 * @typedef {{ type: 'Function', body: Array<TuberStatementNode> }} FunctionValue
 * @typedef {{ type: ProgramType, value: RuntimeValue }} TuberRuntimeNode
 * @exports
 */

const { EmbedBuilder } = require("discord.js");

/**
 * @param {Number} x
 * @returns {NumericValue}
 */
function makeNumber(x) {
    return { type: 'Number', value: x };
}

/**
 * @param {Text} x
 * @returns {TextValue}
 */
function makeText(x) {
    return { type: 'Text', value: x };
}

/**
 * @param {Boolean} x
 * @returns {BooleanValue}
 */
function makeBoolean(x) {
    return { type: 'Boolean', value: x };
}

/**
 * @param {Array} x
 * @returns {ListValue}
 */
function makeList(x) {
    return { type: 'List', elements: x };
}

/**
 * @param {Map<String, PropertyValue>} x
 * @returns {GlossaryValue}
 */
function makeGlossary(x) {
    return { type: 'Glossary', properties: x };
}

/**
 * @returns {EmbedValue}
 */
function makeEmbed() {
    return { type: 'Embed', value: new EmbedBuilder() };
}

/**
 * @returns {NadaValue}
 */
function makeNada() {
    return { type: 'Nada', value: null };
}

/**
 * Comprueba si un valor es Nada o inoperable
 * @param {RuntimeValue} node 
 * @returns {Boolean}
 */
function isNada(node) {
    if(node == undefined)
        return true;

    if(node.type === 'Number' && isNotOperable(node.value))
        return true;

    if([ node.value, node.body, node.elements, node.properties, node.call ].every(val => val == undefined))
        return true;

    return false;
}

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
 * @returns {Boolean}
 */
function isNotValidText(node) {
    if(node == undefined)
        return true;

    if(node.type !== 'Text' || !node.value.length)
        return true;

    return false;
}

/**
 * @param {Function} fn
 * @returns {NativeFunctionValue}
 */
function makeNativeFunction(fn) {
    return { type: 'NativeFunction', call: fn };
}

/**
 * @param {Array<TuberStatementNode>} body
 * @param {Array<TuberNode>} args
 * @returns {FunctionValue}
 */
function makeFunction(body, args, identifier = null) {
    return { type: 'Function', identifier, body, arguments: args };
}

function extendList(list, item, position = null) {
    list.elements.splice(position ?? list.elements.length, 0, item);
}

/**
 * Alza un error e indica la posición del error
 * @param {String} message 
 * @param {{ number: Number, name: String }} statement 
 * @returns {Error}
 */
function TuberInterpreterError(message = 'Se encontró un Token inesperado', statement = { number: -1, name: 'desconocida' }) {
    const err = new Error(`[Sentencia ${statement.number}: ${statement.name.toUpperCase()}] ${message}`);
    err.name = 'TuberInterpreterError';
    return err;
}

const fileRegex = /(http:\/\/|https:\/\/)(www\.)?(([a-zA-Z0-9-]){1,}\.){1,4}([a-zA-Z]){2,6}\/[a-zA-Z-_\/\.0-9#:?=&;,]*\.(txt|png|jpg|jpeg|webp|gif|webm|mp4|mp3|wav|flac|ogg)[a-zA-Z-_\.0-9#:?=&;,]*/;
const imageRegex = /(http:\/\/|https:\/\/)(www\.)?(([a-zA-Z0-9-]){1,}\.){1,4}([a-zA-Z]){2,6}\/[a-zA-Z-_\/\.0-9#:?=&;,]*\.(png|jpg|jpeg|webp)[a-zA-Z-_\.0-9#:?=&;,]*/;
const linkRegex = /(http:\/\/|https:\/\/)(www\.)?(([a-zA-Z0-9-]){1,}\.){1,4}([a-zA-Z]){2,6}(\/[a-zA-Z-_\/\.0-9#:?=&;,]*)?/;

/**@type {Map<NodeType, ProgramType>}*/
const NodeToProgram = new Map();
NodeToProgram
    .set('Identifier',         'Identifier')
    .set('NumericLiteral',     'Number')
    .set('TextLiteral',        'Text')
    .set('BooleanLiteral',     'Boolean')
    .set('InputExpression',    'Input')
    .set('ListExpression',     'List')
    .set('GlossaryExpression', 'Glossary')
    .set('EmbedExpression',    'Embed')
    .set('NadaLiteral',        'Nada');

/**@type {Map<ProgramType, String>}*/
const ProgramToLanguage = new Map();
ProgramToLanguage
    .set('Identifier', 'Identificador')
    .set('Number',     'Número')
    .set('Text',       'Texto')
    .set('Boolean',    'Dupla')
    .set('Input',      'Entrada')
    .set('List',       'Lista')
    .set('Glossary',   'Glosario')
    .set('Embed',      'Marco')
    .set('Nada',       'Nada');

//#region Mapa de coerciones de valores
/**@type {Map<NodeType, Map<NodeType, Function>>}*/
const coercions = new Map();
coercions
    .set('NumericLiteral',     new Map())
    .set('TextLiteral',        new Map())
    .set('BooleanLiteral',     new Map())
    .set('ListExpression',     new Map())
    .set('GlossaryExpression', new Map())
    .set('NadaLiteral',        new Map());

coercions.get('NumericLiteral')
    .set('Text',     (x) => `${x ?? 'Nada'}`)
    .set('Boolean',  (x) => x ? true : false)
    .set('List',     (_) => null)
    .set('Glossary', (_) => null);

coercions.get('TextLiteral')
    .set('Number',   (x) => {
        const parsed = parseFloat(x);
        if(isNotOperable(parsed))
            return 0;
        return parsed;
    })
    .set('Boolean',  (x) => x ? true : false)
    .set('List',     (_) => null)
    .set('Glossary', (_) => null);

coercions.get('BooleanLiteral')
    .set('Number',   (x) => x ? 1 : 0)
    .set('Text',     (x) => x ? 'Verdadero' : 'Falso')
    .set('List',     (_) => null)
    .set('Glossary', (_) => null);

coercions.get('ListExpression')
    .set('Number',   (_) => null)
    .set('Text',     (x) => x?.map(y => `${y.value ?? 'Nada'}`).join(''))
    .set('Boolean',  (x) => x?.length ? true : false)
    .set('Glossary', (x) => {
        if(!Array.isArray(x)) return null;
        const properties = new Map();
        x.forEach((element, i) => { properties.set(i, element); });
        return properties;
    });

coercions.get('GlossaryExpression')
    .set('Number',   (_) => null)
    .set('Text',     (x) => {
        let glossaryStrings = [];
        for(const [key, value] of x)
            glossaryStrings.push(`${key}: ${value.value ?? 'Nada'}`);
        return glossaryStrings.join(', ');
    })
    .set('Boolean',  (x) => x?.size ? true : false)
    .set('List',     (_) => null);

coercions.get('NadaLiteral')
    .set('Number',   (_) => null)
    .set('Text',     (_) => 'Nada')
    .set('Boolean',  (_) => false)
    .set('List',     (_) => null)
    .set('Glossary', (_) => null)
//#endregion

/**
 * Crea un valor del tipo especificado con el valor especificado.
 * Si el valor y el tipo no coinciden, se intentará convertir el valor al tipo indicado.
 * Si la conversión no es posible, se alzará un error
 * @param {TuberNode} node 
 * @param {ProgramType} type 
 * @returns {RuntimeValue}
 */
function makeValue(node, type) {
    /**@type {NodeType}*/
    let origin;
    
    if(typeof node.value === 'number')
        origin = 'NumericLiteral';
    else if(typeof node.value === 'string')
        origin = 'TextLiteral';
    else if(typeof node.value === 'boolean')
        origin = 'BooleanLiteral';
    else if(node.elements != undefined)
        origin = 'ListExpression';
    else if(node.properties != undefined)
        origin = 'GlossaryExpression';
    else if(node.value === null)
        origin = 'NadaLiteral';
    else
        return node;

    if(NodeToProgram.get(origin) === type)
        return { ...node, type: NodeToProgram.get(node.type) ?? node.type };

    /**@type { RuntimeValue }*/
    const newNode = { type };
    try {
        // console.log('Realizando coerción:', origin, '=>', type);
        /**@type {Function}*/
        const coerce = coercions.get(origin).get(type);
        // console.log('Función de coerción utilizada:', coerce.toString());
        let result;
        if(origin === 'ListExpression') {
            const elements = node.elements.map(element => makeValue(element, type));
            result = coerce(elements);
        } else if(origin === 'GlossaryExpression') {
            const properties = new Map();
            for(const [key, value] of node.properties) {
                properties.set(key, makeValue(value, type));
            }
            result = coerce(properties);
        } else
            result = coerce(node.value);

        if(type === 'List')
            newNode.elements = result;
        else if(type === 'Glossary')
            newNode.properties = result;
        else
            newNode.value = result;
    } catch(e) {
        console.error(e);
        newNode.value = null;
    }

    if(newNode.value === null)
        return makeNada();

    return newNode;
}

module.exports = {
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
    isNada,
    isNotOperable,
    isNotValidText,
    TuberInterpreterError,
    makeValue,
    fileRegex,
    imageRegex,
    linkRegex,
    NodeToProgram,
    ProgramToLanguage,
    coercions,
};