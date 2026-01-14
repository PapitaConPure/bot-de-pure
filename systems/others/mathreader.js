/**
 * @typedef {{ type: string, value: string | Number | undefined, operator?: string | undefined, leftOperand?: MathToken | undefined, rightOperand?: MathToken | undefined, argument?: number | undefined }} MathToken
 * @typedef {MathToken} MathTree
 */
const TokenTypes = /**@type {const}*/({
    COMBINATION: 'COMBINATION',
    FACTOR: 'FACTOR',
    FUNCTION: 'FUNCTION',
    NUMBER: 'NUMBER',
    LITERAL: 'LITERAL',
    UNARY: 'UNARY',
    BINARY: 'BINARY',
    GROUP_OPEN: 'GROUP_OPEN',
    GROUP_CLOSE: 'GROUP_CLOSE',
    EOF: 'EOF',
});

/**
 * @function
 * @param {String} type El tipo de Token
 * @param {String | Number} value El valor del Token
 * @return {MathToken}
 */
function createToken(type, value) {
    return {
        type: type,
        value: value,
    };
};

/**@type {Map<String, keyof TokenTypes>}*/
const operationTokens = new Map();
operationTokens.set('+', TokenTypes.COMBINATION);
operationTokens.set('-', TokenTypes.COMBINATION);
operationTokens.set('*', TokenTypes.FACTOR);
operationTokens.set('/', TokenTypes.FACTOR);
operationTokens.set('%', TokenTypes.FACTOR);
operationTokens.set('^', TokenTypes.FUNCTION);

const operationAliases = new Map();
operationAliases.set('x', '*');
operationAliases.set(':', '/');

class MathLexer {
    #stream = '';
    #cursor = 0;
    /**
     * @type {MathToken}
     */
    #lastToken;

    get #current() {
        return this.#stream.charAt(this.#cursor);
    }
    
    /**@returns {Array<MathToken>}*/
    tokenize(str) {
        this.#stream = str;
        this.#cursor = 0;

        const tokens = [];

        while(this.#cursor < this.#stream.length) {
            if(/\s/.test(this.#current)) {
                this.#cursor++;
                continue;
            }

            if(operationTokens.has(this.#current) || operationAliases.has(this.#current)) {
                const symbol = operationAliases.get(this.#current) || this.#current;
                const tokenType = operationTokens.get(symbol);
                tokens.push(createToken(tokenType, symbol));
                this.#cursor++;
                continue;
            }

            if('()'.includes(this.#current)) {
                const tokenType = this.#current === '(' ? TokenTypes.GROUP_OPEN : TokenTypes.GROUP_CLOSE;
                tokens.push(createToken(tokenType, this.#current));
                this.#cursor++;
                continue;
            }
            
            if(/\d/.test(this.#current)) {
                let numberString = '';

                while(/[\d.]/.test(this.#current) && this.#cursor < this.#stream.length) {
                    numberString += this.#current;
                    this.#cursor++;
                }

                const finalNumber = parseFloat(numberString);

                if(isNaN(finalNumber))
                    throw new Error(`Número inválido en posición ${this.#cursor}`);

                tokens.push(createToken(TokenTypes.NUMBER, finalNumber));
                continue;
            }
            
            if(/\w/.test(this.#current)) {
                let text = '';

                while(/\w/.test(this.#current) && this.#cursor < this.#stream.length) {
                    text += this.#current;
                    this.#cursor++;
                }

                text = text.toLowerCase();

                switch(text) {
                    case 'pi':
                        tokens.push(createToken(TokenTypes.NUMBER, Math.PI));
                        continue;

                    case 'e':
                        tokens.push(createToken(TokenTypes.NUMBER, Math.E));
                        continue;

                    case 'inf':
                        tokens.push(createToken(TokenTypes.NUMBER, Number.POSITIVE_INFINITY));
                        continue;
                        
                    case 'sqrt':
                    case 'sin':
                    case 'cos':
                    case 'tan':
                    case 'rad':
                    case 'deg':
                        tokens.push(createToken(TokenTypes.FUNCTION, text));
                        continue;

                    default: {
                        throw Error(`Texto inválido en posición ${this.#cursor}: ${text}`);
                    }
                }
            }

            if(this.#current === 'π') {
                tokens.push(createToken(TokenTypes.NUMBER, Math.PI));
                this.#cursor++;
                continue;
            }

            if(this.#current === '∞') {
                tokens.push(createToken(TokenTypes.NUMBER, Number.POSITIVE_INFINITY));
                this.#cursor++;
                continue;
            }

            if(this.#current === '√') {
                tokens.push(createToken(TokenTypes.FUNCTION, 'sqrt'));
                this.#cursor++;
                continue;
            }

            if('⁰¹²³⁴⁵⁶⁷⁸⁹'.includes(this.#current)) {
                if(this.#lastToken && this.#lastToken.type === TokenTypes.FUNCTION && this.#lastToken.value === '^')
                    throw Error(`Potencia inválida en posición ${this.#cursor}: ${this.#current}\nUsa "^X" o un símbolo exponente, pero no ambos juntos`);

                tokens.push(createToken(TokenTypes.FUNCTION, '^'));

                switch((this.#cursor++, this.#current)) {
                case '⁰':
                    tokens.push(createToken(TokenTypes.NUMBER, '0'));
                    continue;
                    
                case '¹':
                    tokens.push(createToken(TokenTypes.NUMBER, '1'));
                    continue;
                    
                case '²':
                    tokens.push(createToken(TokenTypes.NUMBER, '2'));
                    continue;
                    
                case '³':
                    tokens.push(createToken(TokenTypes.NUMBER, '3'));
                    continue;

                case '⁴':
                    tokens.push(createToken(TokenTypes.NUMBER, '4'));
                    continue;
                    
                case '⁵':
                    tokens.push(createToken(TokenTypes.NUMBER, '5'));
                    continue;
                    
                case '⁶':
                    tokens.push(createToken(TokenTypes.NUMBER, '6'));
                    continue;
                    
                case '⁷':
                    tokens.push(createToken(TokenTypes.NUMBER, '7'));
                    continue;
                    
                case '⁸':
                    tokens.push(createToken(TokenTypes.NUMBER, '8'));
                    continue;
                    
                case '⁹':
                    tokens.push(createToken(TokenTypes.NUMBER, '9'));
                    continue;
                }
            }
            
            throw new Error(`Caracter inválido en posición ${this.#cursor}: ${this.#current}`);
        }

        tokens.push(createToken(TokenTypes.EOF, 'EOF'));

        return tokens;
    }
}

class MathParser {
    /**@type {Array<MathToken>}*/
    #tokens = [];
    #cursor = 0;

    /**
     * @constructor
     * @param {Array<MathToken>} tokens 
     */
    constructor(tokens) {
        this.#tokens = tokens;
    }

    get #current() {
        return this.#tokens[this.#cursor];
    }

    #createUnaryToken(operator, argument) {
        return {
            type: TokenTypes.UNARY,
            operator,
            argument,
        };
    }

    #createBinaryToken(operator, leftOperand, rightOperand) {
        return {
            type: TokenTypes.BINARY,
            operator,
            leftOperand,
            rightOperand,
        };
    }

    /**@param {String} tokenType*/
    #digest(tokenType) {
        if(this.#current.type !== tokenType)
            throw new Error(`Se esperaba un Token de tipo: ${tokenType}; se encontró: ${this.#current.type}; con valor: ${this.#current.value}`);
        this.#cursor++;
    }

    parse() {
        let expression = this.#parseCombination();
        return expression;
    }

    //Suma y resta
    #parseCombination() {
        let leftOperand = this.#parseFactor();
        
        while(this.#current.type === TokenTypes.COMBINATION) {
            const operator = this.#current.value;
            this.#digest(TokenTypes.COMBINATION);
            let rightOperand = this.#parseFactor();
            leftOperand = this.#createBinaryToken(operator, leftOperand, rightOperand);
        }

        return leftOperand;
    }

    //Multiplicación y división
    #parseFactor() {
        let leftOperand = this.#parseFunction();
        
        while(this.#current.type === TokenTypes.FACTOR) {
            const operator = this.#current.value;
            this.#digest(TokenTypes.FACTOR);
            let rightOperand = this.#parseFunction();
            leftOperand = this.#createBinaryToken(operator, leftOperand, rightOperand);
        }
        
        return leftOperand;
    }

    //Potencias y funciones
    #parseFunction() {
        let leftOperand = this.#parseHighest();
        
        while(this.#current.type === TokenTypes.FUNCTION) {
            const operator = this.#current.value;
            this.#digest(TokenTypes.FUNCTION);
            let rightOperand = this.#parseHighest();

            if(operator !== '^')
                throw new Error(`Token inesperado en posición ${this.#cursor}: FUNCTION (^)`);
            
            leftOperand = this.#createBinaryToken(operator, leftOperand, rightOperand);
        }

        return leftOperand;
    }

    #parseHighest() {
        if(this.#current.type === TokenTypes.NUMBER) {
            const number = createToken(TokenTypes.LITERAL, this.#current.value);
            this.#digest(TokenTypes.NUMBER);
            return number;
        }
        
        if(this.#current.type === TokenTypes.COMBINATION) {
            const operator = this.#current.value;
            this.#digest(TokenTypes.COMBINATION);
            const number = this.#createUnaryToken(operator, this.#current.value);
            this.#digest(TokenTypes.NUMBER);
            return number;
        }

        if(this.#current.type === TokenTypes.FUNCTION && this.#current.value !== '^') {
            const operator = this.#current.value;
            this.#digest(TokenTypes.FUNCTION);
            const expr = this.#parseHighest();
            const func = this.#createUnaryToken(operator, expr);
            return func;
        }

        if(this.#current.type === TokenTypes.GROUP_OPEN) {
            this.#digest(TokenTypes.GROUP_OPEN);
            const expr = this.#parseCombination();
            this.#digest(TokenTypes.GROUP_CLOSE);
            return expr;
        }

        throw new Error(`Token inesperado en posición ${this.#cursor}: ${this.#current.type} (${this.#current.value})`);
    }
}

/**@class*/
class MathCalculator {
    #tree;

    /**
     * @constructor
     * @param {MathTree} tree
     */
    constructor(tree) {
        this.#tree = tree;
    }

    /**
     * Realiza una operación unaria
     * @param {string} operator 
     * @param {number | MathToken} argument 
     * @returns {number} El resultado de la operación
     */
    #operateUnary(operator, argument) {
        let numArgument = +argument;

        if(typeof argument !== 'number')  {
            if(argument.type === TokenTypes.LITERAL)
                numArgument = +argument.value;
            if(argument.type === TokenTypes.UNARY)
                numArgument = this.#operateUnary(argument.operator, argument.argument);
            if(argument.type === TokenTypes.BINARY)
                numArgument = this.#calculateToken(argument);
        }

        /**@satisfies {Record<string, (x: number) => number>}*/
        const operations = {
            '+': x => x,
            '-': x => (-x),
            'sqrt': x => Math.sqrt(x),
            'sin': x => Math.sin(x),
            'cos': x => Math.cos(x),
            'tan': x => Math.tan(x),
            'rad': x => x * (Math.PI / 180),
            'deg': x => x * (180 / Math.PI),
        };

        return operations[operator](numArgument);
    }

    /**
     * Realiza una operación binaria
     * @param {String} operator 
     * @param {Number} leftOperand 
     * @param {Number} rightOperand 
     * @returns {Number} El resultado de la operación
     */
    #operateBinary(operator, leftOperand, rightOperand) {
        const operations = {
            '+': (leftOperand, rightOperand) => leftOperand + rightOperand,
            '-': (leftOperand, rightOperand) => leftOperand - rightOperand,
            '*': (leftOperand, rightOperand) => leftOperand * rightOperand,
            '/': (leftOperand, rightOperand) => leftOperand / rightOperand,
            '%': (leftOperand, rightOperand) => leftOperand % rightOperand,
            '^': (leftOperand, rightOperand) => Math.pow(leftOperand, rightOperand),
        };

        return operations[operator](leftOperand, rightOperand);
    }

    /**
     * @function
     * @returns {Number} El resultado de la operación del árbol
     */
    calculate() {
        return this.#calculateToken(this.#tree);
    }

    /**
     * @function
     * @param {MathToken} token
     * @returns {number} El resultado de la operación del Token
     */
    #calculateToken(token) {
        if(token.type === TokenTypes.LITERAL)
            return +token.value;

        if(token.type === TokenTypes.UNARY)
            return this.#operateUnary(token.operator, token.argument);

        if(token.type === TokenTypes.BINARY) {
            const leftOperand = this.#calculateToken(token.leftOperand);
            const rightOperand = this.#calculateToken(token.rightOperand);
            return this.#operateBinary(token.operator, leftOperand, rightOperand);
        }
    }
}

/**
 * Realiza un cálculo en base al string ingresado
 * @param {String} operation La operación a realizar
 * @returns {Number} El resultado de la operación
 */
function calc(operation) {
    const lexer = new MathLexer();
    const tokens = lexer.tokenize(operation);

    const parser = new MathParser(tokens);
    const tree = parser.parse();

    const calculator = new MathCalculator(tree);
    const result = calculator.calculate();

    return result;
}

module.exports = {
    TokenTypes,
    MathLexer,
    MathParser,
    MathCalculator,
    calc,
};