/**
 * @typedef {{ type: String, value: String | Number | undefined, operator: String | undefined, leftOperand: MathToken | undefined, rightOperand: MathToken | undefined, argument: Number | undefined }} MathToken
 * @typedef {MathToken} MathTree
 */
const TokenTypes = {
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
};

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

class MathLexer {
    #stream = '';
    #cursor = 0;

    get #current() {
        return this.#stream.charAt(this.#cursor);
    }
    #createToken(type, value) {
        return {
            type: type,
            value: value,
        };
    };
    
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

            if(operationTokens.has(this.#current)) {
                const symbol = this.#current;
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

                while(/[\d\.]/.test(this.#current) && this.#cursor < this.#stream.length) {
                    numberString += this.#current;
                    this.#cursor++;
                }

                const finalNumber = parseFloat(numberString);

                if(isNaN(finalNumber))
                    throw new Error('Número inválido en posición', this.#cursor);

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
                        break;

                    case 'e':
                        tokens.push(createToken(TokenTypes.NUMBER, Math.E));
                        break;
                        
                    case 'sqrt':
                    case 'sin':
                    case 'cos':
                    case 'tan':
                    case 'rad':
                    case 'deg':
                        tokens.push(createToken(TokenTypes.FUNCTION, text));
                        break;

                    default: {
                        throw Error(`Texto inválido en posición ${this.#cursor}: ${text}`);
                    }
                }

                continue;
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

    #next(i = 1) {
        return this.#tokens[this.#cursor + i];
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
     * @param {String} operator 
     * @param {Number} argument 
     * @returns {Number} El resultado de la operación
     */
    #operateUnary(operator, argument) {
        if(argument.type === TokenTypes.LITERAL)
            argument = argument.value;
        if(argument.type === TokenTypes.UNARY)
            argument = this.#operateUnary(argument.operator, argument.argument);
        if(argument.type === TokenTypes.BINARY)
            argument = this.#calculateToken(argument);

        const operations = {
            '+': (argument) => argument,
            '-': (argument) => (-argument),
            'sqrt': (argument) => Math.sqrt(argument),
            'sin': (argument) => Math.sin(argument),
            'cos': (argument) => Math.cos(argument),
            'tan': (argument) => Math.tan(argument),
            'rad': (argument) => argument * (Math.PI / 180),
            'deg': (argument) => argument * (180 / Math.PI),
        };

        return operations[operator](argument);
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
     * @returns {Number} El resultado de la operación del Token
     */
    #calculateToken(token) {
        if(token.type === TokenTypes.LITERAL)
            return token.value;

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