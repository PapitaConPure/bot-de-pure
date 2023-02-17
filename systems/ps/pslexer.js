const { TuberToken } = require('./commons.js');

/**
 * @readonly
 * @enum {String}
 */
const TokenTypes = {
    STATEMENT: 'STATEMENT',

    BLOCK_OPEN:       'BLOCK_OPEN',
    BLOCK_CLOSE:      'BLOCK_CLOSE',
    CONDITION_OPEN:   'CONDITION_OPEN',
    CONDITION_CHANGE: 'CONDITION_CHANGE',
    WHILE:            'WHILE',
    DO_OPEN:          'DO_OPEN',
    DO_CLOSE:         'DO_CLOSE',
    FOR:              'FOR',
    IN:               'IN',
    
    COMMA:       'COMMA',
    GROUP_OPEN:  'GROUP_OPEN',
    GROUP_CLOSE: 'GROUP_CLOSE',

    ASSIGN:      'ASSIGN',
    EQUALS:      'EQUALS',
    COMPARE:     'COMPARE',
    NOT:         'NOT',
    AND:         'AND',
    OR:          'OR',
    COMBINATION: 'COMBINATION',
    FACTOR:      'FACTOR',
    POWER:       'POWER',
    ARROW:       'ARROW',
    COLON:       'COLON',

    IDENTIFIER:    'IDENTIFIER',
    NUMBER:        'NUMBER',
    TEXT:          'TEXT',
    BOOLEAN:       'BOOLEAN',
    LIST:          'LIST',
    INPUT:         'INPUT',
    GLOSSARY:      'GLOSSARY',
    EMBED:         'EMBED',
    NADA:          'NADA',
    DATA_TYPE:     'DATA_TYPE',

    EOF: 'EOF',
};

/**
 * Crea un Token con el valor especificado
 * @param {String} type Un string de `TokenTypes` especificando el tipo de Token
 * @param {String} value El valor del Token
 * @returns {TuberToken}
 */
function createToken(type, value) {
    return {
        type,
        value,
    };
}

function TuberLexerError(message) {
    const error = new Error(message);
    error.name = 'TuberLexerError';
    return error;
}

/**@class Clase para parsear tokens de PuréScript*/
class TuberLexer {
    #cursor = 0;
    #line = 0;
    #column = 0;
    #stream = '';

    /**
     * El caracter en la posición actual del cursor
     * @returns {String}
     */
    get #current() {
        return this.#stream.charAt(this.#cursor);
    }

    /**
     * El caracter en la siguiente posición del cursor
     * @returns {String}
     */
    get #next() {
        return this.#stream.charAt(this.#cursor + 1);
    }
    
    /**
     * Devuelve el caracter en las siguientes X posiciones del cursor
     * @param {Number} steps
     * @returns {String}
     */
    #offset(steps) {
        return this.#stream.charAt(this.#cursor + steps);
    }

    /**
     * Incrementa el cursor y el contador de columnas
     * @param {Number?} steps La cantidad de pasos a incrementar
     * @returns {void}
     */
    #augmentCursor(steps = 1) {
        this.#cursor += steps;
        this.#column += steps;
    }

    /**
     * Procesa caracteres hasta que no coincidan con la búsqueda, y devuelve todos los procesados
     * @param {RegExp | String} match El caracter a buscar
     */
    #processSimilar(match) {
        let matched = '';

        if(typeof match === 'string') {
            match = {
                value: match,
                test: (str) => match.value === str,
            };
        }

        while(match.test(this.#current) && this.#cursor < this.#stream.length) {
            matched += this.#current;
            this.#augmentCursor();
        }
        this.#augmentCursor(-1);

        return matched;
    }

    /**
     * Procesa caracteres hasta que se encuentra el caracter buscado.
     * Devuelve todos los caracteres procesados
     * @param {RegExp | String} match El caracter a buscar
     * @param {{ includeMatches: Boolean, checkFirst: Boolean, escapeCharacter: String }} processOptions Opciones de procesado
     */
    #processUntil(match, processOptions = {}) {
        processOptions.includeMatches ??= false;
        processOptions.checkFirst ??= false;
        processOptions.escapeCharacter ??= '\\';
        const { includeMatches, checkFirst, escapeCharacter } = processOptions;

        let matched = '';

        if(typeof match === 'string') {
            match = {
                value: match,
                test: (str) => match.value === str,
            };
        }

        if(!checkFirst) {
            matched += this.#current;
            this.#augmentCursor();
        }

        while(!match.test(this.#current) && this.#cursor < this.#stream.length) {
            if(this.#current === escapeCharacter) {
                // console.log(this.#current);
                this.#augmentCursor();
                switch(this.#current) {
                case '\\':
                    matched += '\\';
                    break;
                case '"':
                    matched += '"';
                    break;
                case 'n':
                    matched += '\n';
                    break;
                }
                this.#augmentCursor();
                continue;
            }
            matched += this.#current;
            this.#augmentCursor();
        }

        matched += this.#current;

        if(!includeMatches)
            matched = matched.slice(1, -1);

        return matched;
    }

    /**
     * Procesa uno o más caracteres y devuelve un token con los mismos
     * Si el caracter es ignorable, se devuelve `undefined`
     * @returns {TuberToken | undefined}
     */
    #processCharacters() {
        if(/[\s;]/.test(this.#current)) {
            if(this.#current === '\n') {
                this.#line++;
                this.#column = 0;
            }
            return;
        }

        const symbol = this.#current.match(/[+\-*/^%]/)?.[0];
        if(symbol) {
            let tokenType;
            if(symbol === '-') {
                if(this.#next === '>') {
                    this.#cursor++;
                    return createToken(TokenTypes.ARROW, '->');
                }
                
                return createToken(TokenTypes.COMBINATION, '-');
            }
            else if(symbol == '+') tokenType = TokenTypes.COMBINATION;
            else if('*/%'.includes(symbol)) tokenType = TokenTypes.FACTOR;
            else if('^'.includes(symbol)) tokenType = TokenTypes.POWER;
            return createToken(tokenType, symbol);
        }

        if('()'.includes(this.#current)) {
            const tokenType = this.#current === '(' ? TokenTypes.GROUP_OPEN : TokenTypes.GROUP_CLOSE;
            return createToken(tokenType, this.#current);
        }

        if(/[\d\.]/.test(this.#current)) {
            const numberString = this.#processSimilar(/[\d\.]/);
            const numberValue = parseFloat(numberString);

            if(isNaN(numberValue))
                throw new Error(`Número inválido en posición ${this.#cursor}: ${this.#current}`);

            return createToken(TokenTypes.NUMBER, numberValue);
        }
        
        if(/[\wÁ-öø-ÿ]/.test(this.#current)) {
            const rawWord = this.#processSimilar(/[\wÁ-öø-ÿ]/);
            const word = rawWord.toLowerCase().normalize('NFD').replace(/([aeiou])\u0301/gi, '$1');

            switch(word) {
            case 'con':
                return createToken(TokenTypes.ASSIGN, 'con');
            case 'en':
                return createToken(TokenTypes.IN, 'en');
            case 'no':
                return createToken(TokenTypes.NOT, 'no');
            case 'falso':
                return createToken(TokenTypes.BOOLEAN, false);
            case 'verdadero':
                return createToken(TokenTypes.BOOLEAN, true);
            case 'y':
                return createToken(TokenTypes.AND, 'y');
            case 'o':
                return createToken(TokenTypes.OR, 'o');
            case 'es':
                return createToken(TokenTypes.EQUALS, 'es');
            case 'parece':
                return createToken(TokenTypes.EQUALS, 'parece');
            case 'precede':
                return createToken(TokenTypes.COMPARE, 'precede');
            case 'excede':
                return createToken(TokenTypes.COMPARE, 'excede');
            case 'bloque':
                return createToken(TokenTypes.BLOCK_OPEN, 'bloque');
            case 'fin':
                return createToken(TokenTypes.BLOCK_CLOSE, 'fin');
            case 'si':
                return createToken(TokenTypes.CONDITION_OPEN, 'si');
            case 'sino':
                return createToken(TokenTypes.CONDITION_CHANGE, 'sino');
            case 'mientras':
                return createToken(TokenTypes.WHILE, 'mientras');
            case 'hacer':
                return createToken(TokenTypes.DO_OPEN, 'hacer');
            case 'yseguir':
                return createToken(TokenTypes.DO_CLOSE, 'yseguir');
            case 'para':
            case 'cada':
                return createToken(TokenTypes.FOR, word);
            case 'registrar':
            case 'crear':
            case 'guardar':
            case 'cargar':
            case 'sumar':
            case 'restar':
            case 'multiplicar':
            case 'dividir':
            case 'extender':
            case 'ejecutar':
            case 'devolver':
            case 'terminar':
            case 'enviar':
            case 'comentar':
                return createToken(TokenTypes.STATEMENT, word);
            case 'numero':
            case 'texto':
            case 'dupla':
            case 'lista':
            case 'glosario':
            case 'marco':
            case 'entrada':
            case 'funcion':
                return createToken(TokenTypes.DATA_TYPE, word);
            case 'nada':
                return createToken(TokenTypes.NADA, null);
            // case 'detener':
            //     this.#cursor = this.#stream.length;
            //     return;
            default:
                return createToken(TokenTypes.IDENTIFIER, rawWord);
            }
        }
            
        if(this.#current === '"') {
            let text = this.#processUntil('"');

            return createToken(TokenTypes.TEXT, text);
        }

        if(this.#current === ':')
            return createToken(TokenTypes.COLON, ':');

        if(this.#current === ',')
            return createToken(TokenTypes.COMMA, ',');

        throw TuberLexerError(`Caracter inválido en línea ${this.#line}, columna ${this.#column} (posición ${this.#cursor + 1}): ${this.#current}`);
    }

    /**
     * Devuelve un arreglo de {@link TuberToken}s según el string de PuréScript ingresado.
     * Si el string no es PuréScript válido, se devuelve un error
     * @param {String} input El string de PuréScript
     * @returns {Array<TuberToken>}
     */
    tokenize(input) {
        if(Array.isArray(input))
            throw TuberLexerError('Se detectó código de Puréscript antiguo no-ejecutable. Bot de Puré ya no es compatible con este formato de PuréScript. Deberás volver a crear el Tubérculo en la versión actual.');
        this.#stream = input;
        this.#cursor = 0;
        this.#line = 1;
        this.#column = 1;

        /**@type {Array<TuberToken>}*/
        const tokens = [];
        while(this.#cursor < this.#stream.length) {
            const token = this.#processCharacters();

            if(token)
                tokens.push(token);

            this.#augmentCursor();
        }
        
        tokens.push(createToken(TokenTypes.EOF, 'eof'));

        return tokens;
    }
};

module.exports = {
    TokenTypes,
    TuberLexer,
};