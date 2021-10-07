/**
 * @typedef {{name: String, expression: String|Number}} ParamTypeStrict Parámetros de CommandOption que siguen una sintaxis estricta
 * @typedef {'NUMBER'|'TEXT'|'USER'|'ROLE'|'CHANNEL'|'MESSAGE'|'EMOTE'|'IMAGE'|'URL'|'ID'|ParamTypeStrict} ParamType Tipos de parámetro de CommandOption
 * @typedef {'SINGLE'|'MULTIPLE'|Array<String>} ParamPoly Capacidad de entradas de parámetro de CommandOption
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
const isParamTypeStrict = (pt) => pt && typeof pt.name === 'string' && ['string', 'number'].includes(typeof pt.expression);

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
     * @returns
     */
    setPoly(poly) {
        this._poly = poly;
        return this;
    };
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
            typeString.push('[múltiple]');
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
     * @type {Array<CommandOption>}
     */
    options;
    /**
     * Parámetros del administrador
     * @type {Array<CommandParam>}
     */
    params;
    /**
     * Banderas del administrador
     * @type {Array<CommandFlag>}
     */
    flags;

    /**@constructor*/
    constructor() {
        this.options = [];
        this.params = [];
        this.flags = [];
    };
    
    /**
     * Añade un parámetro al administrador
     * @param {String} name El nombre del parámetro
     * @param {ParamType|Array<ParamType>} type El tipo de parámetro
     * @param {String} desc La descripción del parámetro
     * @param {{ poly?: ParamPoly, optional?: Boolean }} optionModifiers Los modificadores del parámetro
     * @returns
     */
    addParam(name, type, desc, optionModifiers = { poly: undefined, optional: undefined } ) {
        const commandParam = new CommandParam(name, type)
            .setType(type)
            .setDesc(desc)
            .setPoly(optionModifiers?.poly || 'Single')
            .setOptional(optionModifiers?.optional || false);
        this.options.push(commandParam);
        this.params.push(commandParam);
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
        this.options.push(commandFlag);
        this.flags.push(commandFlag);
        return this;
    };
    /**
     * String de ayuda de las opciones de comando del administrador
     * @returns {String}
     */
    get display() {
        return [
            ...this.params.map(p => p.display),
            ...(Array.isArray(this.flags) ? this.flags.map(p => p.display) : this.flags)
        ].join('\n');
    };
};

module.exports = {
    typeHelp,
    CommandParam,
    CommandFlag,
    CommandFlagExpressive,
    CommandOptionsManager
};