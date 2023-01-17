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

            const symbol = this.#current.match(/[+\-*/^%]/)?.[0];
            if(symbol) {
                let tokenType;
                if('+-'.includes(symbol)) tokenType = TokenTypes.COMBINATION;
                else if('*/%'.includes(symbol)) tokenType = TokenTypes.FACTOR;
                else if('^'.includes(symbol)) tokenType = TokenTypes.FUNCTION;
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
        if(this.#current.type === tokenType)
            this.#cursor++;
        else
            throw new Error(`Se esperaba un Token de tipo: ${tokenType}; se encontró: ${this.#current.type}`);
    }

    parse() {
        let expression = this.#parseExpressions();
        return expression;
    }

    //Suma y resta
    #parseExpressions() {
        let leftOperand = this.#parseFactors();
        
        while(this.#current.type === TokenTypes.COMBINATION) {
            const operator = this.#current.value;
            this.#digest(TokenTypes.COMBINATION);
            let rightOperand = this.#parseFactors();

            leftOperand = this.#createBinaryToken(operator, leftOperand, rightOperand);
        }

        return leftOperand;
    }

    //Multiplicación y división
    #parseFactors() {
        let leftOperand = this.#parseFunctions();
        
        while(this.#current.type === TokenTypes.FACTOR) {
            const operator = this.#current.value;
            this.#digest(TokenTypes.FACTOR);
            let rightOperand = this.#parseFunctions();

            leftOperand = this.#createBinaryToken(operator, leftOperand, rightOperand);
        }
        
        return leftOperand;
    }

    //Potencias y funciones
    #parseFunctions() {
        let leftOperand = this.#parseHighest();
        
        while(this.#current.type === TokenTypes.FUNCTION) {
            const operator = this.#current.value;
            this.#digest(TokenTypes.FUNCTION);
            let rightOperand = this.#parseHighest();

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

        if(this.#current.type === TokenTypes.GROUP_OPEN) {
            this.#digest(TokenTypes.GROUP_OPEN);
            const expr = this.#parseExpressions();
            this.#digest(TokenTypes.GROUP_CLOSE);
            return expr;
        }

        throw new Error(`Token inesperado en posición ${this.#cursor}: ${this.#current.type}`)
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
     * Realiza una operación binaria
     * @param {String} operator 
     * @param {Number} leftOperand 
     * @param {Number} rightOperand 
     * @returns {Number} El resultado de la operación
     */
    #operate(operator, leftOperand, rightOperand) {
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

        if(token.type === TokenTypes.UNARY) {
            if(token.operator === '+')
                return token.argument;
            else
                return (-token.argument);
        }

        if(token.type === TokenTypes.BINARY) {
            const leftOperand = this.#calculateToken(token.leftOperand);
            const rightOperand = this.#calculateToken(token.rightOperand);
            return this.#operate(token.operator, leftOperand, rightOperand);
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
    MathLexer,
    MathParser,
    MathCalculator,
    calc,
};