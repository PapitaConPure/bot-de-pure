const { TokenTypes } = require('./pslexer.js');
const {
    TuberToken,
    NodeStatementType,
    NodeLiteralType,
    NodeType,
    TuberNode,
    TuberIdentifierNode,
    TuberBinaryNode,
    TuberStatementNode,
    TuberBlockNode,
    TuberProgramNode,
} = require('./commons.js');

/**
 * @readonly
 * @enum {String}
 */
const NodeTypes = {
    PROGRAM: 'Program',

    STATEMENT:   'Statement',
    EXPRESSION:  'ExpressionStatement',
    BLOCK:       'BlockStatement',
    CONDITIONAL: 'ConditionalStatement',
    WHILE:       'WhileLoopStatement',
    DO_WHILE:    'DoWhileLoopStatement',
    FOR:         'ForLoopStatement',
    FOR_IN:      'ForInLoopStatement',
    DECLARE:     'DeclareStatement',
    REGISTRY:    'RegistryStatement',
    RELATION:    'RelationalStatement',
    SEND:        'SendStatement',
    RETURN:      'ReturnStatement',
    BREAK:       'BreakStatement',
    COMMENT:     'CommentStatement',
    
    IDENTIFIER:    'Identifier',
    ASSIGN:        'AssignExpression',
    UPDATE:        'UpdateExpression',
    LOGIC:         'LogicalExpression',
    SEQUENCE:      'SequenceExpression',
    FUNCTION_CALL: 'CallExpression',
    ARGUMENTS:     'ArgumentsExpression',
    ARROW:         'ArrowExpression',
    UNARY:         'UnaryExpression',
    BINARY:        'BinaryExpression',
    PROPERTY:      'Property',

    NUMBER_LITERAL:   'NumericLiteral',
    TEXT_LITERAL:     'TextLiteral',
    TEXT_TEMPLATE:    'TextTemplateExpression',
    BOOLEAN_LITERAL:  'BooleanLiteral',
    LIST_LITERAL:     'ListExpression',
    GLOSSARY_LITERAL: 'GlossaryExpression',
    NADA_LITERAL:     'NadaLiteral',
    INPUT:            'InputExpression',
    EMBED:            'EmbedExpression',
};

const LanguageToToken = {
    'con': TokenTypes.ASSIGN,
    'numero': TokenTypes.NUMBER,
    'texto': TokenTypes.TEXT,
    'dupla': TokenTypes.BOOLEAN,
    'entrada': TokenTypes.INPUT,
    'lista': TokenTypes.LIST,
    'glosario': TokenTypes.GLOSSARY,
    'marco': TokenTypes.EMBED,
    'identificador': TokenTypes.IDENTIFIER,
};

const TokenToLanguage = {};
Object.entries(LanguageToToken).forEach(([k, v]) => {
    TokenToLanguage[v] = k;
});
TokenToLanguage['STATEMENT'] = 'sentencia';
TokenToLanguage['EXPRESSION'] = 'expresión';
TokenToLanguage['BLOCK'] = 'bloque';
TokenToLanguage['RELATION'] = 'relacional';
TokenToLanguage['DATA_TYPE'] = 'tipo de dato';
TokenToLanguage['ARROW'] = 'flecha';
TokenToLanguage['COLON'] = 'dos puntos';
TokenToLanguage['NADA'] = 'nada';
TokenToLanguage['EOF'] = 'fin de código';

/**
 * @type {Map<String, NodeType>}
 */
const TokenToNode = new Map();
TokenToNode
    .set(TokenTypes.ASSIGN,     'AssignExpression')
    .set(TokenTypes.NUMBER,     'NumericLiteral')
    .set(TokenTypes.TEXT,       'TextLiteral')
    .set(TokenTypes.BOOLEAN,    'BooleanLiteral')
    .set(TokenTypes.INPUT,      'InputExpression')
    .set(TokenTypes.LIST,       'ListExpression')
    .set(TokenTypes.GLOSSARY,   'GlossaryExpression')
    .set(TokenTypes.EMBED,      'EmbedExpression')
    .set(TokenTypes.IDENTIFIER, 'Identifier');

/**
 * @type {Map<NodeType, String>}
 */
const NodeToLanguage = new Map();
NodeToLanguage
    .set('Statement',            'sentencia')
    .set('BlockStatement',       'bloque')
    .set('ConditionalStatement', 'si')
    .set('WhileLoopStatement',   'mientras')
    .set('DoWhileLoopStatement', 'hacer...mientras')
    .set('ForLoopStatement',     'para')
    .set('ForInLoopStatement',   'para cada')
    .set('DeclareStatement',     'crear')
    .set('RegistryStatement',    'registrar')
    .set('RelationalStatement',  'relacional')
    .set('SendStatement',        'enviar')
    .set('ReturnStatement',      'devolver')
    .set('BreakStatement',       'terminar')
    .set('CommentStatement',     'comentar')

    .set('AssignExpression',     'con')
    .set('NumericLiteral',       'numero')
    .set('TextLiteral',          'texto')
    .set('BooleanLiteral',       'dupla')
    .set('InputExpression',      'entrada')
    .set('ListExpression',       'lista')
    .set('GlossaryExpression',   'glosario')
    .set('EmbedExpression',      'marco')
    .set('Identifier',           'identificador');

/**@class Clase para parsear tokens de PuréScript*/
class TuberParser {
    #tokens = [];
    #cursor = 0;
    #statement = '';
    #statementNumber = 1;
    #insideTemplate;
    #insideListing;

    /**
     * @constructor
     * @param {Array<TuberToken>} tokens Los tokens a parsear
     */
    constructor(tokens) {
        this.#tokens = tokens;
        this.#insideListing = false;
        this.#insideTemplate = false;
    }

    /**
     * El Token en la posición actual del cursor
     * @returns {TuberToken}
     */
    get #current() {
        return this.#tokens[this.#cursor];
    }

    /**
     * El Token en la siguiente posición del cursor
     * @returns {TuberToken}
     */
    get #next() {
        return this.#tokens[this.#cursor + 1];
    }

    /**
     * Devuelve si un Nodo es un Literal
     * @param {TuberNode} nodeType
     * @returns {Boolean}
     */
    #isLiteral(nodeType) {
        /**@type {Array<NodeType>}*/
        const literals = [
            TokenTypes.IDENTIFIER,
            TokenTypes.NUMBER,
            TokenTypes.TEXT,
            TokenTypes.BOOLEAN,
            TokenTypes.LIST,
            TokenTypes.GLOSSARY,
            TokenTypes.IDENTIFIER,
        ];
        return literals.includes(nodeType);
    }

    get #endOfStatement() {
        return this.#current.type !== TokenTypes.STATEMENT && this.#current.type !== TokenTypes.EOF;
    }

    TuberParserError(message = `Se encontró un Token inesperado: ${TokenToLanguage.get(this.#current.type)}; con valor: ${this.#current.value}`) {
        const err = new Error(message);
        err.name = 'TuberParserError';
        return err;
    }

    /**
     * Digiere un Token
     * @returns {TuberToken}
     */
    #digest() {
        const current = this.#current;
        // console.log('Se digerió', this.#current);
        this.#cursor++;
        return current;
    }

    /**
     * Digiere un Token y verifica que sea del tipo correcto
     * @param {TokenTypes} tokenType Un string de `TokenTypes` especificando el tipo de Token
     * @param {String} errorMessage Mensaje de error al fallar la verificación de Token
     * @returns {TuberToken}
     */
    #expect(tokenType, errorMessage) {
        if(this.#current.type !== tokenType)
            throw this.TuberParserError(errorMessage ?? `Se esperaba un Token de tipo: ${TokenToLanguage[tokenType] ?? tokenType}; se encontró: ${TokenToLanguage[this.#current.type] ?? this.#current.type}; con valor: ${this.#current.value ?? 'Nada'}`);

        const current = this.#current;
        // console.log('Se digerió', this.#current);
        this.#cursor++;
        return current;
    }

    #ommitRemainingScope(hasToReturn) {
        const openStatements = [
            TokenTypes.BLOCK_OPEN,
            TokenTypes.CONDITION_OPEN,
            TokenTypes.DO_OPEN,
            TokenTypes.WHILE,
            TokenTypes.DO_OPEN,
            TokenTypes.FOR,
        ];
        const originalCursor = this.#cursor;
        let blockLevels = 0;
        do {
            if(openStatements.includes(this.#current.type) && this.#current.value !== 'cada')
                blockLevels++;
                
            if(this.#current.type === TokenTypes.BLOCK_CLOSE || blockLevels === 0 && this.#current.type === TokenTypes.CONDITION_CHANGE)
                blockLevels--;
            
            if([ TokenTypes.DO_OPEN, TokenTypes.DO_CLOSE ].includes(this.#current.type)) {
                this.#cursor = originalCursor;
                break;
            }
            
            if(this.#current.type === TokenTypes.EOF) {
                if(hasToReturn)
                    throw this.TuberParserError('DEVOLVER no puede ser usado en el bloque Programa');
                break;
            }
        } while(blockLevels >= 0 && this.#digest());
    }

    /**
     * Parsea Tokens de PuréScript y devuelve un árbol de Tokens listos para ejecutar
     * Si la sintaxis es incorrecta, se alzará un error
     * @typedef {{ type: 'PROGRAM', body: Array<TuberToken> }} Program
     * @returns {TuberProgramNode} El programa devuelto
     */
    parse() {
        return this.#parseProgram()
    }

    /**
     * Parsea un programa
     * @returns {TuberProgramNode}
     */
    #parseProgram() {
        const program = {
            type: NodeTypes.PROGRAM,
            body: [],
        };

        while(this.#current.type !== TokenTypes.EOF) {
            const statementNumber = this.#statementNumber++;
            const statement = this.#parseStatement();
            program.body.push({ ...statement, number: statementNumber });
        }

        return program;
    }

    /**
     * Parsea una sentencia
     * @returns {TuberStatementNode}
     */
    #parseStatement() {
        switch(this.#current.type) {
        case TokenTypes.BLOCK_OPEN:
        case TokenTypes.CONDITION_OPEN: {
            const statement = this.#parseConditional();
            this.#expect(TokenTypes.BLOCK_CLOSE);
            return statement;
        }
        case TokenTypes.WHILE: {
            const statement = this.#parseWhile();
            this.#expect(TokenTypes.BLOCK_CLOSE);
            return statement;
        }
        case TokenTypes.DO_OPEN: {
            const statement = this.#parseDoWhile();
            // this.#expect(TokenTypes.BLOCK_CLOSE);
            return statement;
        }
        case TokenTypes.FOR: {
            const statement = this.#parseFor();
            this.#expect(TokenTypes.BLOCK_CLOSE);
            return statement;
        }
        case TokenTypes.GROUP_OPEN: {
            return {
                type: NodeTypes.EXPRESSION,
                expression: this.#parseExpression(),
            };
        }
        case TokenTypes.DATA_TYPE:
        case TokenTypes.IDENTIFIER:
        // case TokenTypes.NUMBER:
        // case TokenTypes.TEXT:
        // case TokenTypes.BOOLEAN:
            return {
                type: NodeTypes.EXPRESSION,
                expression: this.#parseGlossary()
            };
        }

        // console.log('Sentencia:', this.#current)
        let statement = this.#expect(TokenTypes.STATEMENT);
        this.#statement = statement.value;
        // console.log('A punto de:', this.#current)
        
        switch(statement.value) {
        case 'crear':
            statement = this.#parseDeclare();
            break;
        //<identifier> CON <expression>
        case 'registrar': {
            const registryType = this.#expect(TokenTypes.DATA_TYPE);
            return {
                type: NodeTypes.REGISTRY,
                initialize: this.#parseAssign(registryType),
                as: registryType.value,
            }
        }

        case 'sumar':
        case 'restar':
            if(this.#next.type !== TokenTypes.ASSIGN)
                return {
                    type: NodeTypes.EXPRESSION,
                    expression: this.#parseUpdate()
                };

        case 'multiplicar':
        case 'dividir':
        case 'guardar':
        case 'cargar':
        case 'extender':
            return {
                type: NodeTypes.RELATION,
                operator: this.#statement,
                expression: this.#parseAssign(),
            };
        
        case 'ejecutar': {
            let expression = this.#parseMemberCall();
            if(expression.type === 'Identifier')
                expression = {
                    type: NodeTypes.FUNCTION_CALL,
                    emitter: expression,
                    arguments: [],
                };
            statement = {
                type: NodeTypes.EXPRESSION,
                expression,
            };
            break;
        }
        case 'enviar':
            statement = {
                type: NodeTypes.SEND,
                value: this.#parseExpression(),
            };
            break;
        case 'devolver':
            statement = {
                type: NodeTypes.RETURN,
                value: this.#parseExpression(),
            };
            this.#ommitRemainingScope(true);
            break;
        case 'terminar':
            statement = {
                type: NodeTypes.BREAK,
            };
            this.#ommitRemainingScope(false);
            break;
        case 'comentar':
            statement = {
                type: NodeTypes.COMMENT,
                value: this.#parseComment(),
            };
            break;
        default:
            statement.context = this.#parseExpression();
        }

        return statement;
    }

    /**
     * 
     * @returns {TuberBlockNode}
     */
    #parseConditional() {
        let statement = this.#parseBlock();

        if(this.#current.type === TokenTypes.CONDITION_OPEN && this.#digest()) {
            const test = this.#parseOr();

            while(![ TokenTypes.CONDITION_CHANGE, TokenTypes.BLOCK_CLOSE ].includes(this.#current.type))
                statement.body.push({ ...this.#parseStatement(), number: this.#statementNumber++ });

            statement = {
                type: NodeTypes.CONDITIONAL,
                test,
                consequent: statement,
            }
        }

        if(this.#current.type === TokenTypes.CONDITION_CHANGE) {
            const alternateNumber = this.#statementNumber++;
            statement.alternate = { ...this.#parseBlock(), number: alternateNumber };
        }

        return statement;
    }

    /**
     * 
     * @returns {TuberBlockNode}
     */
    #parseWhile() {
        let statement = this.#parseBlock();

        this.#expect(TokenTypes.WHILE);
        const test = this.#parseOr();

        while(this.#current.type !== TokenTypes.BLOCK_CLOSE)
            statement.body.push({ ...this.#parseStatement(), number: this.#statementNumber++ });
        
        statement.type = NodeTypes.WHILE;
        statement.test = test;
        
        return statement;
    }

    /**
     * 
     * @returns {TuberBlockNode}
     */
    #parseDoWhile() {
        let statement = this.#parseBlock();

        this.#expect(TokenTypes.DO_OPEN);
        while(this.#current.type !== TokenTypes.DO_CLOSE)
            statement.body.push({ ...this.#parseStatement(), number: this.#statementNumber++ });
        
        this.#digest();
        this.#expect(TokenTypes.WHILE);
        
        statement.type = NodeTypes.DO_WHILE;
        statement.test = this.#parseOr();
        
        return statement;
    }

    /**
     * 
     * @returns {TuberBlockNode}
     */
    #parseFor() {
        let statement = this.#parseSimpleFor();

        if(this.#current.type === TokenTypes.FOR && this.#current.value === 'cada' && this.#digest()) {
            statement.type = NodeTypes.FOR_IN;
            statement.element = this.#parseExpression();
            this.#expect(TokenTypes.IN, 'Se esperaba el operador especial "en" entre el identificador de elemento y el identificador de Lista en estructura PARA CADA');
            statement.list = this.#parseExpression();
        }

        statement = { ...statement, body: statement.body };

        while(this.#current.type !== TokenTypes.BLOCK_CLOSE)
            statement.body.push({ ...this.#parseStatement(), number: this.#statementNumber++ });
        
        return statement;
    }

    #parseSimpleFor() {
        let statement = this.#parseBlock();

        this.#expect(TokenTypes.FOR);

        if(this.#current.type !== TokenTypes.FOR) {
            statement.type = NodeTypes.FOR;
            statement.assignment = this.#parseAssign();
            this.#expect(TokenTypes.WHILE);
            statement.test = this.#parseOr();
            statement.step = this.#parseStatement();
            if(statement.step.type !== 'ExpressionStatement' || statement.step.expression?.type !== 'UpdateExpression')
                throw this.TuberParserError('Se esperaba una sentencia SUMAR o RESTAR como tercer componente de estructura PARA');
        }

        return statement;
    }

    /**
     * 
     * @returns {TuberBlockNode}
     */
    #parseBlock() {
        let block = {
            type: NodeTypes.BLOCK,
            body: [],
        };

        if(this.#current.type === TokenTypes.BLOCK_OPEN && this.#digest()) {
            while(this.#current.type !== TokenTypes.BLOCK_CLOSE) {
                const statementNumber = this.#statementNumber++;
                block.body.push({ ...this.#parseStatement(), number: statementNumber });
            }
            this.#statementNumber++;
        }

        if(this.#current.type === TokenTypes.CONDITION_CHANGE && this.#digest()) {
            if(this.#current.type === TokenTypes.CONDITION_OPEN)
                return { ...this.#parseConditional(), number: this.#statementNumber++ };
            if(this.#current.type !== TokenTypes.BLOCK_CLOSE)
                block.body.push({ ...this.#parseStatement(), number: this.#statementNumber++ });
            this.#statementNumber++;
        }

        return block;
    }

    /**
     * Ignora expresiones hasta la próxima orden y retorna los valores de cada expresión, unidos con espacios
     * @returns {TuberToken} El contenido del comentario
     */
    #parseComment() {
        let data = this.#expect(TokenTypes.TEXT);

        return data;
    }

    /**
     * Parsea una expresión
     * @returns {TuberNode}
     */
    #parseExpression() {
        let block = this.#parseAssign();

        return block;
    }

    /**
     * Parsea una asignación
     * @returns {TuberStatementNode}
     */
    #parseDeclare() {
        const typeToken = this.#expect(TokenTypes.DATA_TYPE);
        /**@type {TuberToken}*/
        let identifier = this.#expect(TokenTypes.IDENTIFIER);
        const idType = LanguageToToken[typeToken.value];

        if(idType === TokenTypes.INPUT)
            throw this.TuberParserError(`Tipo inválido en declaración: ${typeToken.value}`);

        // console.log('Maquetando una declaración...');
        /**@type {TuberStatementNode}*/
        const result = {
            type: 'DeclareStatement',
            identifier: {
                type: TokenToNode.get(identifier.type),
                name: identifier.value,
            },
            as: TokenToNode.get(idType),
        };

        return result;
    }

    /**
     * Parsea una actualización de valor
     * @returns {TuberNode}
     */
    #parseUpdate() {
        let argument = this.#parseGlossary();

        if(argument.type !== TokenToNode.get(TokenTypes.IDENTIFIER))
            throw this.TuberParserError('El receptor de la asignación debe ser un identificador');

        // console.log('Maquetando un aumento o decremento...');
        argument = {
            type: NodeTypes.UPDATE,
            operator: this.#statement,
            argument,
        };
        // console.log(argument);

        return argument;
    }

    /**
     * Parsea una asignación
     * @param {TuberToken} registryType
     * @returns {TuberNode}
     */
    #parseAssign(registryType) {
        /**@type {TuberNode}*/
        let receptor = this.#parseText();
        // console.log(receptor);

        if(this.#current.type === TokenTypes.ASSIGN) {
            this.#digest();

            // console.log(registryType, receptor.type, this.#current);

            if(registryType?.value === 'funcion') {
                if(receptor.type !== 'CallExpression')
                    throw this.TuberParserError('El receptor de la asignación debe ser una maqueta de Función');

                const reception = this.#parseBlock();
                this.#expect(TokenTypes.BLOCK_CLOSE, 'Se esperaba un cierre de cuerpo de Función');

                return {
                    type: 'AssignExpression',
                    receptor,
                    reception,
                };
            }

            if(receptor.type !== 'Identifier' && receptor.type !== 'ArrowExpression')
                throw this.TuberParserError('El receptor de la asignación debe ser un identificador, elemento de lista o propiedad de glosario');

            let reception;
            if(this.#current.type === TokenTypes.DATA_TYPE && this.#current.value === 'funcion' && this.#digest()) {
                // console.log(this.#current);
                let identifier = receptor;
                if(this.#current.type === TokenTypes.IDENTIFIER)
                    identifier = this.#parsePrimary();

                receptor = {
                    type: 'CallExpression',
                    emitter: receptor,
                    arguments: this.#parseArguments(),
                };
                // console.log('Esto debería ser una apertura', this.#current);
                const { type, ...restOfBlock } = this.#parseBlock();
                reception = { type, identifier, ...restOfBlock };
                this.#expect(TokenTypes.BLOCK_CLOSE, 'Se esperaba un cierre de Función');
            } else
                reception = this.#parseAssign();

            return {
                type: 'AssignExpression',
                receptor,
                reception,
            };
        }

        return receptor;
    }

    /**
     * Parsea un texto
     * @returns {TuberNode}
     */
    #parseText() {
        if(this.#current.type !== TokenTypes.DATA_TYPE)
            return this.#parseOr();

        if(this.#current.value === TokenTypes.INPUT)
            throw this.TuberParserError(`Tipo de asignación inválido: ${this.#current.value}`);

        const tokenType = LanguageToToken[this.#current.value];
        if(tokenType !== TokenTypes.TEXT)
            return this.#parseGlossary();

        this.#digest();
        let expectGroupClose = false;
        if(this.#current.value === TokenTypes.GROUP_OPEN) {
            this.#digest();
            expectGroupClose = true;
        }
        const text = this.#parseTextTemplate();
        if(expectGroupClose)
            this.#expect(TokenTypes.GROUP_CLOSE);

        return text;
    }

    /**
     * Parsea un glosario
     * @returns {TuberNode}
     */
    #parseGlossary() {
        if(this.#current.type !== TokenTypes.DATA_TYPE)
            return this.#parseOr();

        if(this.#current.value === TokenTypes.INPUT)
            throw this.TuberParserError(`Tipo de asignación inválido: ${this.#current.value}`);

        const tokenType = LanguageToToken[this.#current.value];
        if(tokenType !== TokenTypes.GLOSSARY)
            return this.#parseList();

        this.#digest();
        let expectGroupClose = false;
        if(this.#current.value === TokenTypes.GROUP_OPEN) {
            this.#digest();
            expectGroupClose = true;
        }

        const properties = [];
        this.#insideListing = true;
        while(![ TokenTypes.STATEMENT, TokenTypes.GROUP_CLOSE, TokenTypes.EOF ].includes(this.#current.type)) {
            let key = this.#parseExpression();
            if(key.type !== 'Identifier')
                throw this.TuberParserError('Se esperaba un identificador de miembro de Glosario');
            this.#expect(TokenTypes.COLON);
            const value = this.#parseExpression();
            properties.push({
                type: NodeTypes.PROPERTY,
                key,
                value,
            });
            
            if(this.#current.type !== TokenTypes.COMMA)
                break;
            this.#digest();
            if(this.#current.type === TokenTypes.COMMA)
                throw this.TuberParserError('No se pueden añadir comas extra en expresiones de Glosario');
        }
        this.#insideListing = false;

        if(expectGroupClose)
            this.#expect(TokenTypes.GROUP_CLOSE);

        return {
            type: NodeTypes.GLOSSARY_LITERAL,
            properties,
        }
    }

    /**
     * Parsea una lista
     * @returns {TuberNode}
     */
    #parseList() {
        if(this.#current.type !== TokenTypes.DATA_TYPE)
            return this.#parseMember();
        
        const tokenType = LanguageToToken[this.#current.value];
        if(tokenType !== TokenTypes.LIST)
            return this.#parseLiteral();

        this.#digest();
        let expectGroupClose = false;
        if(this.#current.value === TokenTypes.GROUP_OPEN) {
            this.#digest();
            expectGroupClose = true;
        }

        const elements = [];
        this.#insideListing = true;
        while(![
            TokenTypes.GROUP_CLOSE,
            TokenTypes.STATEMENT,
            TokenTypes.CONDITION_OPEN,
            TokenTypes.CONDITION_CHANGE,
            TokenTypes.WHILE,
            TokenTypes.DO_OPEN,
            TokenTypes.FOR,
            TokenTypes.BLOCK_OPEN,
            TokenTypes.BLOCK_CLOSE,
            TokenTypes.DO_CLOSE,
            TokenTypes.IN,
            TokenTypes.EOF,
        ].includes(this.#current.type)) {
            elements.push(this.#parseExpression());
            if(this.#current.type !== TokenTypes.COMMA)
                break;
            this.#digest();
            while(this.#current.type === TokenTypes.COMMA && this.#digest())
                elements.push(null);
        }
        this.#insideListing = false;
        
        if(expectGroupClose)
            this.#expect(TokenTypes.GROUP_CLOSE);

        return {
            type: NodeTypes.LIST_LITERAL,
            elements,
        }
    }

    /**
     * Parsea un literal
     * @returns {TuberNode}
     */
    #parseLiteral() {
        if(this.#current.type !== TokenTypes.DATA_TYPE)
            return this.#parseOr();
    
        const targetType = LanguageToToken[this.#digest().value];
        const reception = this.#parseCombination();
            
        return {
            ...reception,
            as: TokenToNode.get(targetType),
        };
    }

    /**
     * Parsea un "O" lógico
     * @returns {TuberNode}
     */
    #parseOr() {
        let leftHand = this.#parseAnd();

        while(this.#current.type === TokenTypes.OR) {
            this.#digest();
            // console.log('Maquetando una comprobación lógica O...', this.#current.type);
            const rightHand = this.#parseOr();
            leftHand = {
                type: NodeTypes.LOGIC,
                leftHand,
                operator: 'o',
                rightHand,
            };
        }
        
        return leftHand;
    }
    
    /**
     * Parsea un "Y" lógico
     * @returns {TuberNode}
    */
    #parseAnd() {
        let leftHand = this.#parseEquality();

        while(this.#current.type === TokenTypes.AND) {
            this.#digest();
            // console.log('Maquetando una comprobación lógica Y...', this.#current.type);
            const rightHand = this.#parseAnd();
            leftHand = {
                type: NodeTypes.LOGIC,
                leftHand,
                operator: 'y',
                rightHand,
            };
        }

        return leftHand;
    }

    /**
     * Parsea una igualdad lógica
     * @returns {TuberNode}
    */
    #parseEquality() {
        let leftHand = this.#parseComparation();

        while(this.#current.type === TokenTypes.EQUALS || this.#current.type === TokenTypes.NOT) {
            let operator = this.#digest().value;
            if(operator === 'no')
                operator += ` ${this.#expect(TokenTypes.EQUALS).value}`;

            // console.log('Maquetando una comprobación de igualdad...', this.#current.type);
            const rightHand = this.#parseEquality();
            leftHand = {
                type: NodeTypes.LOGIC,
                leftHand,
                operator,
                rightHand,
            };
        }

        if(this.#current.type === TokenTypes.NOT && ![ TokenTypes.EQUALS, TokenTypes.COMPARE ].includes(this.#next.type))
            throw this.TuberParserError('Operador lógico inválido');

        return leftHand;
    }

    /**
     * Parsea una comparación lógica
     * @returns {TuberNode}
     */
    #parseComparation() {
        let leftHand = this.#parseCombination();

        while(this.#current.type === TokenTypes.COMPARE || this.#current.type === TokenTypes.NOT && this.#next.type === TokenTypes.COMPARE) {
            let operator = this.#digest().value;
            if(operator === 'no')
                operator += ` ${this.#expect(TokenTypes.COMPARE).value}`;
            // console.log('Maquetando una comparación...', this.#current.type);
            const rightHand = this.#parseComparation();
            leftHand = {
                type: NodeTypes.LOGIC,
                leftHand,
                operator,
                rightHand,
            };
        }

        return leftHand;
    }

    /**
     * Parsea sumas y restas
     * @returns {TuberNode}
     */
    #parseCombination() {
        let leftOperand = this.#parseFactor();
        
        while(this.#current.type === TokenTypes.COMBINATION) {
            const operator = this.#current.value;
            this.#digest();
            let rightOperand = this.#parseCombination();
            leftOperand = {
                type: NodeTypes.BINARY,
                operator,
                leftOperand,
                rightOperand,
            };
        }

        return leftOperand;
    }

    /**
     * Parsea multiplicaciones, divisiones y operaciones de módulo
     * @returns {TuberNode}
     */
    #parseFactor() {
        let leftOperand = this.#parsePowers();
        
        while(this.#current.type === TokenTypes.FACTOR) {
            const operator = this.#current.value;
            this.#digest();
            let rightOperand = this.#parseFactor();
            leftOperand = {
                type: NodeTypes.BINARY,
                operator,
                leftOperand,
                rightOperand
            };
        }
        
        return leftOperand;
    }

    /**
     * Parsea potencias y funciones matemáticas
     * @returns {TuberNode}
     */
    #parsePowers() {
        let leftOperand = this.#parseMemberCall();
        
        while(this.#current.type === TokenTypes.POWER) {
            const operator = this.#current.value;
            this.#digest();
            let rightOperand = this.#parsePowers();

            if(operator !== '^')
                throw new Error(`Token inesperado en posición ${this.#cursor}: FUNCTION (^)`);
            
            leftOperand = {
                type: NodeTypes.BINARY,
                operator,
                leftOperand,
                rightOperand
            };
        }

        return leftOperand;
    }

    /**
     * Parsea llamados de miembros
     * @returns {TuberNode}
     */
    #parseMemberCall() {
        let member = this.#parseMember();

        // console.log('En parseMemberCall', this.#current)

        while([ TokenTypes.GROUP_OPEN ].includes(this.#current.type))
            member = this.#parseFunctionCall(member);

        // console.log('A punto de comprobar parseMemberCall con', member, '\nVeamos:', this.#current)
        
        if(this.#current.type === TokenTypes.ARROW && this.#digest()) {
            let emitterProperty = this.#parseMemberCall();

            member = {
                type: 'CallExpression',
                emitter: {
                    type: NodeTypes.ARROW,
                    container: member,
                    property: emitterProperty.emitter,
                },
                arguments: emitterProperty.arguments,
            };
        }

        // console.log('Fin de parseMemberCall', this.#current)

        return member;
    }

    /**
     * Parsea una llamada de función desde un miembro emisor
     * @param {TuberToken} emitter El emisor de la llamada de función
     * @returns {TuberNode}
     */
    #parseFunctionCall(emitter) {
        let expr = {
            type: NodeTypes.FUNCTION_CALL,
            emitter,
        };

        // if(this.#current.type === TokenTypes.IDENTIFIER) {
        //     expr.arguments = [ this.#parseExpression() ];
        //     return expr;
        // }

        // console.log('En parseFunctionCall', this.#current)

        expr.arguments = this.#parseArguments();

        // console.log('Fin de parseFunctionCall', this.#current)

        return expr;
    }

    /**
     * Evalúa 1 ó más expresiones y las devuelve como un arreglo de argumentos
     * @returns {Array<TuberNode>} El arreglo de argumentos
     */
    #parseArguments() {
        // console.log('En parseArguments:', this.#current);
        this.#expect(TokenTypes.GROUP_OPEN, 'Se esperaba una apertura de función');

        const wasInsideListing = this.#insideListing;
        this.#insideListing = true;
        const args = [ TokenTypes.GROUP_CLOSE, TokenTypes.STATEMENT, TokenTypes.EOF ].includes(this.#current.type)
            ? []
            : this.#parseArgumentsList();
        this.#insideListing = wasInsideListing;

        this.#expect(TokenTypes.GROUP_CLOSE, 'Se esperaba un cierre de función');
        // console.log('Fin de parseArguments:', this.#current)

        return args;
    }

    /**
     * Evalúa una secuencia de expresiones separadas por coma y las devuelve como un arreglo de argumentos
     * @returns {Array<TuberNode>} El arreglo de argumentos
     */
    #parseArgumentsList() {
        const args = [ this.#parseAssign(TokenTypes.IDENTIFIER) ];

        while(this.#current.type === TokenTypes.COMMA && this.#digest()) {
            const arg = this.#parseText();
            if(this.#current.type === TokenTypes.COLON && this.#digest())
                arg.default = this.#parseExpression();
            args.push(arg);
        }

        return args;
    }

    /**
     * Parsea miembros y busca propiedades de miembro
     * @returns {TuberNode}
     */
    #parseMember() {
        let expr = this.#parsePrimary();
        // console.log('En parseMember:', expr);

        if(this.#current.type === TokenTypes.ARROW && this.#digest()) {
            expr = {
                type: NodeTypes.ARROW,
                container: expr,
                property: this.#parseMember(),
            };
        }

        return expr;
    }
    
    /**
     * Parsea una expresión primaria
     * @returns {Array<TuberNode>} La expresión evaluada
     */
    #parsePrimary() {
        const tokenType = this.#current.type;
        // console.log('Verificando casos de parsePrimary con:', this.#current);
        switch(tokenType) {
        case TokenTypes.NOT:
            if([ TokenTypes.EQUALS, TokenTypes.COMPARE ].includes(this.#next.type))
                return;
            const operator = this.#digest().value;
            const argument = this.#parsePrimary();
            return {
                type: 'UnaryExpression',
                operator,
                argument,
            };

        case TokenTypes.NUMBER:
            return {
                type: NodeTypes.NUMBER_LITERAL,
                value: this.#digest().value,
            };

        case TokenTypes.TEXT:
            return this.#parseTextTemplate();
        
        case TokenTypes.COMBINATION: {
            const number = {
                type: 'UnaryExpression',
                operator: this.#digest().value,
                argument: this.#parsePrimary(),
            };
            return number;
        }

        case TokenTypes.BOOLEAN:
            return {
                type: NodeTypes.BOOLEAN_LITERAL,
                value: this.#digest().value,
            };

        // case TokenTypes.POWER: {
        //     if(this.#current.value === '^')
        //         throw this.TuberParserError('Se esperaba un nombre de función matemática');
        //     const operator = this.#current.value;
        //     this.#expect(TokenTypes.POWER);
        //     const expr = this.#parsePrimary();
        //     const func = {
        //         type: 'UnaryExpression',
        //         operator,
        //         value: expr,
        //     };
        //     return func;
        // }

        case TokenTypes.GROUP_OPEN: {
            this.#digest();
            const wasInsideTemplate = this.#insideTemplate;
            const wasInsideListing = this.#insideListing;
            this.#insideTemplate = false;
            this.#insideListing = false;
            const expr = this.#parseExpression();
            this.#insideTemplate = wasInsideTemplate;
            this.#insideListing = wasInsideListing;
            this.#expect(TokenTypes.GROUP_CLOSE);
            return expr;
        }

        case TokenTypes.GROUP_CLOSE:
            throw this.TuberParserError('Se esperaba una expresión entre paréntesis');
        
        case TokenTypes.IDENTIFIER:
            return {
                type: NodeTypes.IDENTIFIER,
                name: this.#digest().value,
            };
        
        case TokenTypes.NADA:
            this.#digest();
            return {
                type: NodeTypes.NADA_LITERAL,
                value: null,
            };
        }

        throw this.TuberParserError(`Token inesperado: ${this.#current.value}`);
    }

    /**
     * Parsea una plantilla de texto
     * @returns {TuberNode} El valor de texto o la plantilla de texto evaluados
     */
    #parseTextTemplate() {
        let text;
        // console.log(this.#current);
        if(this.#current.type === TokenTypes.TEXT)
            text = { ...this.#digest(), type: 'TextLiteral' };
        else
            text = this.#parseExpression();

        // console.log('parseTextTemplate está en ejecución con', text, { alreadyInsideList: this.#insideListing, alreadyInsideTemplate: this.#insideTemplate, type: this.#current.type });

        if(!this.#insideTemplate && !this.#insideListing && this.#current.type === TokenTypes.COMMA) {
            const expressions = [ text ];
            
            this.#insideTemplate = true;
            while(this.#current.type === TokenTypes.COMMA) {
                this.#digest();
                expressions.push(this.#parseExpression());
                // console.log(this.#current);
            }
            this.#insideTemplate = false;
            
            return {
                type: NodeTypes.TEXT_TEMPLATE,
                expressions,
            }
        }

        if(typeof text.value !== 'string')
            return {
                ...text,
                as: 'TextLiteral',
            };

        return {
            type: 'TextLiteral',
            value: text.value,
        }
    }
};

module.exports = {
    NodeTypes,
    LanguageToToken,
    TokenToLanguage,
    TokenToNode,
    NodeToLanguage,
    TuberParser,
};