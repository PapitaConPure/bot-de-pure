const { LexerTokenTypes } = require('./commons.js');

function TuberLexerError(message) {
    const error = new Error(message);
    error.name = 'TuberLexerError';
    return error;
}

/**
 * @typedef {(match: RegExpExecArray) => void} RegExpHandler
 */

/**@class Clase para parsear tokens de PuréScript*/
class TuberLexer {
    #cursor = 0;
    #line = 0;
    #column = 0;
    #stream = '';

    /**
     * Crea un Token con el valor especificado
     * @param {import('./commons.js').LexerTokenType} type Un string de `TokenTypes` especificando el tipo de Token
     * @param {*} value El valor del Token
     * @param {Number} length El valor del Token
     * @param {Number} [start] El valor del Token
     * @param {Number} [line] El valor del Token
     * @returns {import("./commons.js").LexerToken}
     */
    createToken(type, value, length = 1, start = this.#column, line = this.#line) {
        return {
            type,
            value,
            start,
            end: start + length,
            line,
        };
    }

    get #lineString () {
        return this.#stream.split('\n')[this.#line - 1];
    }

    /**
     * El caracter en la posición actual del cursor
     * @returns {String}
     */
    get #current() {
        return this.#stream.charAt(this.#cursor);
    }

    /**
     * El caracter en la anterior posición del cursor
     * @returns {String}
     */
    get #previous() {
        return this.#stream.charAt(this.#cursor - 1);
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

        const testFn = (typeof match === 'string')
            ? ((/**@type {string} */ str) => match === str)
            : ((/**@type {string}*/ str) => match.test(str));

        while(this.#cursor < this.#stream.length && testFn(this.#current)) {
            matched += this.#current;
            this.#augmentCursor();
        }
        this.#augmentCursor(-1);

        return matched;
    }

    get #remainder() {
        return this.#stream.slice(this.#cursor);
    }

    /**
     * @typedef {Object} ProcessOptions
     * @property {Boolean} [includeMatches]
     * @property {Boolean} [checkFirst]
     * @property {String} [escapeCharacter]
     */

    /**
     * Procesa caracteres hasta que se encuentra el caracter buscado.
     * Devuelve todos los caracteres procesados
     * @param {RegExp | String} match El caracter a buscar
     * @param {ProcessOptions} [processOptions] Opciones de procesado
     */
    #processUntil(match, processOptions = {}) {
        processOptions.includeMatches ??= false;
        processOptions.checkFirst ??= false;
        processOptions.escapeCharacter ??= '\\';

        const { includeMatches, checkFirst, escapeCharacter } = processOptions;

        let matched = '';

        const testFn = (typeof match === 'string')
            ? ((/** @type {string} */ str) => match === str)
            : match.test;

        if(!checkFirst) {
            matched += this.#current;
            this.#augmentCursor();
        }

        while(!testFn(this.#current) && this.#cursor < this.#stream.length) {
            if(this.#current === escapeCharacter) {
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
     * @returns {import("./commons.js").LexerToken | undefined}
     */
    #processCharacters() {
        if(/[\s;]/.test(this.#current)) {
            if(this.#current === '\n') {
                this.#line++;
                this.#column = 0;
            }
            return;
        }

        if(this.#current === '!')
            return this.createToken(LexerTokenTypes.Not, 'no');

        if(this.#current === '=') {
            if(this.#next === '=' || this.#previous === '!') {
                this.#augmentCursor();
                return this.createToken(LexerTokenTypes.Equals, 'es');
            }

            if(this.#previous === '<')
                return this.createToken(LexerTokenTypes.Compare, 'excede');

            if(this.#previous === '>')
                return this.createToken(LexerTokenTypes.Compare, 'precede');

            return this.createToken(LexerTokenTypes.Assign, 'con');
        }

        if(this.#current === '~' && (this.#previous === '!' || this.#next === '~'))
            return this.createToken(LexerTokenTypes.Equals, 'parece');
        
        if(this.#current === '<') {
            if(this.#next === '=')
                return this.createToken(LexerTokenTypes.Not, 'no');
            else
                return this.createToken(LexerTokenTypes.Compare, 'precede');
        }
        
        if(this.#current === '>'){
            if(this.#next === '=')
                return this.createToken(LexerTokenTypes.Not, 'no');
            else
                return this.createToken(LexerTokenTypes.Compare, 'excede');
        }

        if(this.#current === '&' && this.#next === '&')
            return this.createToken(LexerTokenTypes.And, 'y');

        if(this.#current === '|' && this.#next === '|')
            return this.createToken(LexerTokenTypes.And, 'y');

        const symbol = this.#current.match(/[+\-*/^%]/)?.[0];
        if(symbol) {
            let tokenType;
            if(symbol === '-') {
                if(this.#next === '>') {
                    this.#augmentCursor();
                    return this.createToken(LexerTokenTypes.Arrow, '->', 2);
                }
                
                return this.createToken(LexerTokenTypes.Combination, '-');
            }
            else if(symbol == '+') tokenType = LexerTokenTypes.Combination;
            else if('*/%'.includes(symbol)) tokenType = LexerTokenTypes.Factor;
            else if('^'.includes(symbol)) tokenType = LexerTokenTypes.Power;
            return this.createToken(tokenType, symbol);
        }

        if('()'.includes(this.#current)) {
            const tokenType = this.#current === '(' ? LexerTokenTypes.GroupOpen : LexerTokenTypes.GroupClose;
            return this.createToken(tokenType, this.#current);
        }

        if(/[\d\.]/.test(this.#current)) {
            const numberString = this.#processSimilar(/[\d\.]/);
            const numberValue = +numberString;

            if(isNaN(numberValue))
                throw new Error(`Número inválido en posición ${this.#cursor}: ${this.#current}`);

            return this.createToken(LexerTokenTypes.Number, numberValue, numberString.length);
        }
        
        if(/[\wÁ-öø-ÿ]/.test(this.#current)) {
            const start = this.#column;
            const rawWord = this.#processSimilar(/[\wÁ-öø-ÿ]/);
            const word = rawWord.toLowerCase().normalize('NFD').replace(/([aeiou])\u0301/gi, '$1');

            switch(word) {
            case 'con':
                return this.createToken(LexerTokenTypes.Assign, 'con', word.length, start);
            case 'en':
                return this.createToken(LexerTokenTypes.In, 'en', word.length, start);
            case 'no':
                return this.createToken(LexerTokenTypes.Not, 'no', word.length, start);
            case 'falso':
                return this.createToken(LexerTokenTypes.Boolean, false, word.length, start);
            case 'verdadero':
                return this.createToken(LexerTokenTypes.Boolean, true, word.length, start);
            case 'y':
                return this.createToken(LexerTokenTypes.And, 'y', word.length, start);
            case 'o':
                return this.createToken(LexerTokenTypes.Or, 'o', word.length, start);
            case 'es':
                return this.createToken(LexerTokenTypes.Equals, 'es', word.length, start);
            case 'parece':
                return this.createToken(LexerTokenTypes.Equals, 'parece', word.length, start);
            case 'precede':
                return this.createToken(LexerTokenTypes.Compare, 'precede', word.length, start);
            case 'excede':
                return this.createToken(LexerTokenTypes.Compare, 'excede', word.length, start);
            case 'bloque':
                return this.createToken(LexerTokenTypes.BlockOpen, 'bloque', word.length, start);
            case 'fin':
                return this.createToken(LexerTokenTypes.BlockClose, 'fin', word.length, start);
            case 'si':
                return this.createToken(LexerTokenTypes.ConditionOpen, 'si', word.length, start);
            case 'sino':
                return this.createToken(LexerTokenTypes.ConditionChange, 'sino', word.length, start);
            case 'mientras':
                return this.createToken(LexerTokenTypes.While, 'mientras', word.length, start);
            case 'hacer':
                return this.createToken(LexerTokenTypes.DoOpen, 'hacer', word.length, start);
            case 'yseguir':
                return this.createToken(LexerTokenTypes.DoClose, 'yseguir', word.length, start);
            case 'repetir':
                return this.createToken(LexerTokenTypes.Repeat, 'repetir', word.length, start);
            case 'veces':
                return this.createToken(LexerTokenTypes.RepeatOpen, 'veces', word.length, start);
            case 'para':
            case 'cada':
                return this.createToken(LexerTokenTypes.For, word, word.length, start);
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
            case 'usar':
            case 'devolver':
            case 'terminar':
            case 'parar':
            case 'enviar':
            case 'decir':
            case 'comentar':
                return this.createToken(LexerTokenTypes.Statement, word, word.length, start);
            case 'numero':
            case 'texto':
            case 'dupla':
            case 'lista':
            case 'glosario':
            case 'marco':
            case 'entrada':
            case 'funcion':
                return this.createToken(LexerTokenTypes.DataType, word, word.length, start);
            case 'nada':
                return this.createToken(LexerTokenTypes.Nada, null, word.length, start);
            default:
                return this.createToken(LexerTokenTypes.Identifier, rawWord, rawWord.length, start);
            }
        }
            
        if(this.#current === '"') {
            const start = this.#column;
            const text = this.#processUntil('"');

            return this.createToken(LexerTokenTypes.Text, text, text.length, start);
        }

        if(this.#current === ':')
            return this.createToken(LexerTokenTypes.Colon, ':');

        if(this.#current === ',')
            return this.createToken(LexerTokenTypes.Comma, ',');

        const errPointerString = ' '.repeat(this.#column - 1)  + '↑'

        throw TuberLexerError([
            '',
            this.#lineString,
            errPointerString,
            '',
            `Caracter inválido en línea ${this.#line}, columna ${this.#column}: ${this.#current}`
        ].join('\n'));
    }

    /**
     * Devuelve un arreglo de {@link LexerToken}s según el string de PuréScript ingresado.
     * Si el string no es PuréScript válido, se devuelve un error
     * @param {String} input El string de PuréScript
     * @returns {Array<import("./commons.js").LexerToken>}
     */
    tokenize(input) {
        if(Array.isArray(input)) {
            const error = Error('Se detectó código de PuréScript antiguo ilegible. Bot de Puré ya no es compatible con este formato de PuréScript. Deberás volver a crear el Tubérculo en la versión actual.');
            error.name = 'TuberVersionError';
            throw error;
        }
        this.#stream = input;
        this.#cursor = 0;
        this.#line = 1;
        this.#column = 1;

        /**@type {Array<import("./commons.js").LexerToken>}*/
        const tokens = [];
        while(this.#cursor < this.#stream.length) {
            const token = this.#processCharacters();

            if(token)
                tokens.push(token);

            this.#augmentCursor();
        }
        
        tokens.push(this.createToken(LexerTokenTypes.EoF, 'eof'));

        return tokens;
    }
};

module.exports = {
    TuberLexer,
};