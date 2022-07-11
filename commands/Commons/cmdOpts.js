/**
 * @typedef {{name: String, expression: String|Number}} ParamTypeStrict Parámetros de CommandOption que siguen una sintaxis estricta
 * @typedef {'NUMBER'|'TEXT'|'USER'|'ROLE'|'CHANNEL'|'MESSAGE'|'EMOTE'|'IMAGE'|'FILE'|'URL'|'ID'|ParamTypeStrict} ParamType Tipos de parámetro de CommandOption
 * @typedef {'SINGLE'|'MULTIPLE'|Array<String>} ParamPoly Capacidad de entradas de parámetro de CommandOption
 * @typedef {Map<String, CommandOption>} CommandOptionsCollection Colección de opciones de comando indexadas por nombre de parámetro
 */

const commonTypes = {
    'NUMBER':   'número',
    'TEXT':     'texto',
    'USER':     'u{mención/texto/id}',
    'ROLE':     'r{mención/texto/id}',
    'GUILD':    'g{texto/id}',
    'CHANNEL':  'c{enlace/texto/id}',
    'MESSAGE':  'm{enlace/texto/id}',
    'EMOTE':    'emote',
    'IMAGE':    'imagen/enlace',
    'FILE':     'archivo/enlace',
    'URL':      'enlace',
    'ID':       'id'
};

/**
 * Devuelve el tipo ingresado como texto de página de ayuda
 * @param {ParamType} type El tipo a convertir
 * @returns {String}
 */
const typeHelp = (type) => commonTypes[type];

/**
 * Devuelve si el parámetro es estricto
 * @param {*} pt - una instancia ParamType
 * @returns {pt is ParamTypeStrict}
 */
const isParamTypeStrict = (pt) => pt?.name && pt?.expression;

/**Representa una opción de comando*/
class CommandOption {
    /**@type {String}*/
    _desc;

    /**
     * Define la descripción de la opción
     * @param {String} desc La descripción de la opción
     * @returns
     */
    setDesc(desc) {
        this._desc = desc;
        return this;
    };
};

/**Representa un parámetro de comando*/
class CommandParam extends CommandOption {
    /**@type {String}*/
    _name;
    /**@type {ParamType|Array<ParamType>}*/
    _type;
    /**@type {Boolean}*/
    _optional;
    /**@type {ParamPoly}*/
    _poly;
    /**@type {Number}*/
    _polymax;

    /**
     * @constructor
     * @param {String} name El nombre del parámetro
     * @param {ParamType} type El tipo del parámetro
     */
    constructor(name, type) {
        super();
        this._name = name;
        this._type = type;
        this._optional = false;
        this._poly = 'SINGLE';
        this._polymax = 8;
    };

    /**
     * Define el tipo del parámetro
     * @param {ParamType} type El tipo del parámetro
     * @returns
     */
    setType(type) {
        this._type = type;
        return this;
    };
    /**
     * Define si el parámetro es opcional
     * @param {Boolean} optional La optabilidad del parámetro
     * @returns
     */
    setOptional(optional) {
        this._optional = optional;
        return this;
    };
    /**
     * Define la capacidad de entradas del parámetro
     * @param {ParamPoly} poly La capacidad del parámetro
     * @param {Number?} max El máximo de entradas admitidas (para parámetros de tipo múltiple)
     * @returns
     */
    setPoly(poly, max) {
        this._poly = poly;
        if(max) this._polymax = max;
        return this;
    };

    /**
     * String del nombre de parámetro
     * @type {String}
     */
    get name() {
        return this._name;
    }
    /**
     * String del tipo de parámetro
     * @type {String}
     */
    get typeDisplay() {
        const typeString = [
            isParamTypeStrict(this._type)
                ? `${this._type.name}: ${this._type.expression}`
                : (Array.isArray(this._type)
                    ? this._type.map(t => typeHelp(t)).join(',')
                    : typeHelp(this._type)
                )
        ];

        if(this._poly === 'MULTIPLE')
            typeString.push(`[múltiple/${this._polymax}]`);
        else if(Array.isArray(this._poly))
            typeString.push(`[${this._poly.length}]`);
        
        return typeString.join(' ');
    };
    /**
     * String de ayuda del parámetro
     * @returns {String}
     */
    get display() {
        const identifier = [this._name];

        if(this._optional) identifier.push('?');
        if(this._poly === 'MULTIPLE') identifier.push('(...)');
        else if(Array.isArray(this._poly)) identifier.push(`(${this._poly.join(',')})`);

        return `\`<${identifier.join('')}>\` _(${this.typeDisplay})_ ${this._desc}`;
    };
};

/**Representa una bandera de comando*/
class CommandFlag extends CommandOption {
    /**@type {Array<String>}*/
    _short;
    /**@type {Array<String>}*/
    _long;
    /**@type {Boolean}*/
    _expressive;

    /**@constructor*/
    constructor() {
        super();
        this._expressive = false;
    }
    /**
     * Define los identificadores cortos de la bandera
     * @param {String | Array<String>} flags El/los identificadores
     * @returns
     */
    setShort(flags) {
        this._short = [...flags];
        return this;
    };
    /**
     * Define los identificadores largos de la bandera
     * @param {String | Array<String>} flags El/los identificadores
     * @returns
     */
    setLong(flags) {
        this._long = Array.isArray(flags) ? flags : [flags];
        return this;
    };
    /**
     * String de ayuda de la bandera
     * @returns {String}
     */
    get display() {
        const { _short: short, _long: long, _desc: desc } = this;
        const flagString = [];
        if(Array.isArray(short) && short.length) flagString.push(`\`-${short[0]}\``);
        if(Array.isArray(long) && long.length)   flagString.push(`\`--${long[0]}\``);
        return `${flagString.join(' o ')} ${desc}`;
    };
    /**
     * Estructura de objeto de los identificadores de la bandera
     * @returns {{ short?: Array<String>, long?: Array<String> }}
     */
    get structure() {
        return { short: this._short, long: this._long };
    }
};

/**Representa una bandera expresiva de comando*/
class CommandFlagExpressive extends CommandFlag {
    /**@type {String}*/
    _name;
    /**@type {ParamType}*/
    _type;

    /**
     * @constructor
     * @param {String} name El nombre de entrada de la bandera
     * @param {ParamType} type El tipo de entrada de la bandera
     */
    constructor(name, type) {
        super();
        this._name = name;
        this._type = type;
        this._expressive = true;
    };

    /**
     * Define el nombre de entrada de la bandera
     * @param {String} name El tipo de la bandera
     * @returns
     */
    setName(name) {
        this._name = name;
        return this;
    };

    /**
     * Define el tipo de entrada de la bandera
     * @param {ParamType} type El tipo de la bandera
     * @returns
     */
    setType(type) {
        this._type = type;
        return this;
    };

    /**
     *String del tipo de bandera
     * @returns {String}
     */
    get typeDisplay() {
        return isParamTypeStrict(this._type)
            ? `${this._type.name}: ${this._type.expression}`
            : commonTypes[this._type];
    };
    /**
     *String de ayuda de la bandera
     * @returns {String}
     */
    get display() {
        const { _short: short, _long: long, _name: name, typeDisplay: type, _desc: desc } = this;
        const flagString = [];
        if(Array.isArray(short) && short.length) flagString.push(`\`-${short[0]} <${name}>\``);
        if(Array.isArray(long) && long.length)  flagString.push(`\`--${long[0]} <${name}>\``);
        return `${flagString.join(' o ')} _(${type})_ ${desc}`;
    }
};

/**Representa un administrador de opciones de comando*/
class CommandOptionsManager {
    /**
     * Opciones del administrador
     * @type {CommandOptionsCollection}
     */
    options;
    /**
     * Parámetros del administrador
     * @type {CommandOptionsCollection}
     */
    params;
    /**
     * Banderas del administrador
     * @type {CommandOptionsCollection}
     */
    flags;
    /**
     * Propiedades por defecto 
     */
    defaults;

    /**@constructor*/
    constructor() {
        this.options = new Map();
        this.params = new Map();
        this.flags = new Map();
        this.defaults = {
            polymax: 5
        };
    };
    
    /**
     * Añade un parámetro al administrador
     * @param {String} name El nombre del parámetro
     * @param {ParamType|Array<ParamType>} type El tipo de parámetro
     * @param {String} desc La descripción del parámetro
     * @param {{ poly?: ParamPoly, polymax?: Number, optional?: Boolean }} optionModifiers Los modificadores del parámetro
     * @returns
     */
    addParam(name, type, desc, optionModifiers = { poly: undefined, polymax: undefined, optional: undefined } ) {
        const commandParam = new CommandParam(name, type)
            .setType(type)
            .setDesc(desc)
            .setPoly(optionModifiers?.poly || 'SINGLE', optionModifiers?.polymax || this.defaults.polymax)
            .setOptional(optionModifiers?.optional || false);
        this.options.set(commandParam._name, commandParam);
        this.params.set(commandParam._name, commandParam);
        return this;
    };
    /**
     * Añade una bandera al administrador
     * @param {String | Array<String>} short El/los identificadores cortos
     * @param {String | Array<String>} long El/los identificadores largos
     * @param {String} desc La descripción de la bandera
     * @param {{name?: String, type?: ParamType}?} expression La propiedad que modifica la bandera, si es expresiva
     * @returns
     */
    addFlag(short, long, desc, expression) {
        const commandFlag = (expression)
            ? new CommandFlagExpressive(expression.name, expression.type)
            : new CommandFlag();
        commandFlag
            .setShort(short)
            .setLong(long)
            .setDesc(desc);
        const flagIdentifier = commandFlag._long.length
            ? (Array.isArray(commandFlag._long) ? commandFlag._long[0] : commandFlag._long)
            : commandFlag._short[0];
        this.options.set(flagIdentifier, commandFlag);
        this.flags.set(flagIdentifier, commandFlag);
        return this;
    };

    /**
     * String de ayuda de las opciones de comando del administrador
     * @returns {String}
     */
    get display() {
        return [
            ...[...this.params.values()].map(p => p.display),
            ...[...this.flags.values()].map(f => f.display)
        ].join('\n');
    };
    /**
     * String de ayuda de las opciones de comando del administrador
     * @returns {String}
     */
    get callSyntax() {
        /**@type {Array<CommandParam>}*/
        const params = [...this.params.values()];
        return params.map(p => {
                const paramExpressions = [ p.name ];
                if(Array.isArray(p._poly)) paramExpressions.push(` (${p._poly.join(',')})`);
                else if(p._poly === 'MULTIPLE') paramExpressions.push(' (...)');
                if(p.optional) paramExpressions.push('?');
                return `<${paramExpressions.join('')}>`;
            }).join(' ');
    };
    /**
     * Devuelve un arreglo de todas las entradas recibidas.
     * Si no se recibe ninguna entrada, se devuelve fallback
     * @param {CommandInteractionOptionResolver} args El resolvedor de opciones de interacción
     * @param {String} identifier El identificador del parámetro
     * @param {Function} callbackFn Una función de SlashCommandBuilder para leer un valor
     * @param {(Function | *)?} fallback Un valor por defecto si no se recibe ninguna entrada
     * @returns {Array<*>} Un arreglo con las entradas procesadas por callbackFn, o alternativamente, un valor devuelto por fallback
     */
    fetchParamPoly(args, identifier, callbackFn, fallback = undefined) {
        /**@type {CommandParam}*/
        const option = this.params.get(identifier);
        const singlename = identifier.replace(/[Ss]$/, '');
        let params;
        if(option && option._poly)
            switch(option._poly) {
            case 'MULTIPLE':
                params = new Array(option._polymax)
                    .fill(null)
                    .map((_, i) => `${singlename}_${i + 1}`)
                    .filter(param => param);
                break;
            case 'SINGLE':
                params = [ identifier ];
                break;
            default:
                params = option._poly;
                break;
            }
        params = params
            .map((opt, i) => callbackFn.call(args, opt, !i && !option._optional))
            .filter(param => param);
        return params.length ? params : [ (typeof fallback === 'function') ? fallback() : fallback ];
    };
    /**
     * Devuelve un valor o función basado en si se ingresó la flag buscada o no
     * Si no se recibe ninguna entrada, se devuelve fallback
     * @param {import('discord.js').CommandInteractionOptionResolver} args El conjunto de entradas
     * @param {String} identifier El identificador de la flag
     * @param {Function} getMethod El método de procesado de entrada
     * @typedef {Object} feedback
     * @property {*} callback Valor de retorno si se respondió la flag
     * @property {*} fallback Un valor por defecto si no se respondió la flag
     * @param {feedback} output Define la respuestas en cada caso
     * @returns {*} El valor de retorno de callback si la flag fue respondida, o en cambio, el de fallback
     */
    fetchFlag(args, identifier, output = { callback, fallback }) {
        /**@type {CommandFlagExpressive}*/
        const flag = this.flags.get(identifier);

        if(!flag)
            throw new ReferenceError(`Cannot find command flag by identifier: ${identifier}`);

        let getMethod = 'getBoolean';
        let flagValue;

        if(flag._expressive) {
            switch(flag._type) {
                case 'NUMBER':  getMethod = 'getNumber';  break;
                case 'USER':    getMethod = 'getUser';    break;
                case 'ROLE':    getMethod = 'getRole';    break;
                case 'CHANNEL': getMethod = 'getChannel'; break;
                case 'ID':      getMethod = 'getInteger'; break;
                default:        getMethod = 'getString';  break;
            }
        }
        
        flagValue = args[getMethod](identifier, false);
        
        if(flagValue == undefined)
            return output.fallback;

        if(output.callback == undefined)
            return flagValue;

        return typeof output.callback === 'function' ? output.callback(flagValue) : output.callback;
    };
};

module.exports = {
    typeHelp,
    CommandOptionsManager
};