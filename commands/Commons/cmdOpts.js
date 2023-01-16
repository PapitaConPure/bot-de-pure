/**
 * @typedef {{name: String, expression: String|Number}} ParamTypeStrict Parámetros de CommandOption que siguen una sintaxis estricta
 * @typedef {'NUMBER'|'TEXT'|'USER'|'MEMBER'|'ROLE'|'CHANNEL'|'MESSAGE'|'EMOTE'|'IMAGE'|'FILE'|'URL'|'ID'|ParamTypeStrict} ParamType Tipos de parámetro de CommandOption
 * @typedef {'SINGLE'|'MULTIPLE'|Array<String>} ParamPoly Capacidad de entradas de parámetro de CommandOption
 */

const PARAM_TYPES = {
    'NUMBER':  { getMethod: 'getNumber',  help: 'número' },
    'TEXT':    { getMethod: 'getString',  help: 'texto' },
    'USER':    { getMethod: 'getUser',    help: 'U{mención/texto/id}' },
    'MEMBER':  { getMethod: 'getUser',    help: 'M{mención/texto/id}' },
    'ROLE':    { getMethod: 'getRole',    help: 'R{mención/texto/id}' },
    'GUILD':   { getMethod: 'getString',  help: 'g{texto/id}' },
    'CHANNEL': { getMethod: 'getChannel', help: 'C{enlace/texto/id}' },
    'MESSAGE': { getMethod: 'getString',  help: 'm{enlace/texto/id}' },
    'EMOTE':   { getMethod: 'getString',  help: 'emote' },
    'IMAGE':   { getMethod: 'getString',  help: 'imagen/enlace' },
    'FILE':    { getMethod: 'getString',  help: 'archivo/enlace' },
    'URL':     { getMethod: 'getString',  help: 'enlace' },
    'ID':      { getMethod: 'getInteger', help: 'id' },
};

/**
 * @function
 * @param {Array<String>} args
 * @return {String}
 */
const fetchMessageFlagText = (args, i) => {
    if(i >= args.length)
        return undefined;

    //Conjunto de palabras, señalado entre ""
    if(args[i].startsWith('"')) {
        let lastIndex = i;
        let text;

        while(lastIndex < args.length && !args[lastIndex].endsWith('"'))
            lastIndex++;
        text = args.slice(i, lastIndex + 1).join(' ').slice(1);
        args.splice(i, lastIndex - i);
        if(text.length > 1) return (text.endsWith('"')) ? text.slice(0, -1) : text;
        else return undefined;
    }

    return args.splice(i, 1)[0];
}

/**
 * @typedef {(value, isSlash: Boolean) => *} FlagCallback
 * @function
 * @param {Array<String>} args
 * @param {{
 *  property: Boolean,
 *  short: Array<String>,
 *  long: Array<String>,
 *  callback: FlagCallback,
 *  fallback: *,
 * }} flag
 */
const fetchMessageFlag = (args, flag = { property, short: [], long: [], callback, fallback }) => {
    //Ahorrarse procesamiento en vano si no se ingresa nada
    if(!args.length) return flag.fallback;

    //Recorrer parámetros y procesar flags
    let flagValue;
    args.forEach((arg, i) => {
        if(flag.property && i === (args.length - 1)) return;
        arg = arg.toLowerCase();

        if(flag.long?.length && arg.startsWith('--') && flag.long.includes(arg.slice(2))) {
            flagValue = flag.property ? fetchMessageFlagText(args, i + 1) : arg;
            return args.splice(i, 1);
        }

        if(flag.short?.length && arg.startsWith('-')) {
            const flagChars = [...arg.slice(1)].filter(c => flag.short.includes(c));
            for(c of flagChars) {
                flagValue = flag.property ? fetchMessageFlagText(args, i + 1) : c;
                const flagSize = 1;

                if(arg.length <= 2)
                    return args.splice(i, flagSize);

                const flagToRemove = new RegExp(c, 'g')
                let temp = args.splice(i, flagSize); //Remover temporalmente el stack completo de flags cortas y el parámetro si es flag-propiedad
                args.push(temp[0].replace(flagToRemove, '')); //Reincorporar lo eliminado, descartando las flags ya procesadas
                if(flag.property) args.push(temp[1]);
            }
        }
    });
    
    if(flagValue == undefined)
        return flag.fallback;

    if(flag.callback == undefined)
        return flag.property ? flagValue : true;

    return typeof flag.callback === 'function' ? flag.callback(flagValue, false) : flag.callback;
}

/**
 * Devuelve el tipo ingresado como texto de página de ayuda
 * @param {ParamType} type El tipo a convertir
 * @returns {String}
 */
const typeHelp = (type) => PARAM_TYPES[type].help;

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
    isExpressive() {
        return this._expressive;
    }
    /**
     * Tipo de bandera como un string
     * @returns {String?}
     */
    get type() {
        return this._type;
    }
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
        return { property: this.isExpressive(), short: this._short, long: this._long };
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
            : PARAM_TYPES[this._type].help;
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
     * @type {Map<String, CommandOption>}
     */
    options;
    /**
     * Parámetros del administrador
     * @type {Map<String, CommandParam>}
     */
    params;
    /**
     * Banderas del administrador
     * @type {Map<String, CommandFlag | CommandFlagExpressive>}
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
        if(optionModifiers && typeof optionModifiers !== 'object')
            throw new TypeError('Modificadores de parámetro inválidos');
            
        const { poly, polymax, optional } = optionModifiers ?? {};
        if(poly && !Array.isArray(poly) && !['SINGLE', 'MULTIPLE',].includes(poly))
            throw new TypeError('Multiplicidad de parámetro inválida');

        const commandParam = new CommandParam(name, type)
            .setDesc(desc)
            .setPoly(poly || 'SINGLE', polymax || this.defaults.polymax)
            .setOptional(optional || false);
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
     * Si es un comando Slash, devuelve el valor del parámetro ingresado
     * Si es un comando de mensaje, remueve y devuelve la siguente entrada o devuelve todas las entradas en caso de que whole sea verdadero
     * Si no se recibe ningún parámetro, se devuelve undefined
     * @param {import('discord.js').CommandInteractionOptionResolver | Array<String>} args El conjunto de entradas
     * @param {String} slashIdentifier El identificador del parámetro para comandos Slash
     * @param {Boolean?} whole Indica si devolver todas las entradas en caso de un comando de mensaje
     * @returns {*} El valor del parámetro
     */
    fetchParam(args, slashIdentifier, whole = false) {
        /**@type {CommandParam}*/
        const param = this.params.get(slashIdentifier);

        if(!param)
            throw new ReferenceError(`No se pudo encontrar un parámetro con el identificador: ${slashIdentifier}`);

        if(Array.isArray(args))
            return whole ? args.join(' ') : args.shift();

        let getMethod = 'getString';
        
        if(!isParamTypeStrict(param._type))
            getMethod = PARAM_TYPES[param._type].getMethod;
        
        return args[getMethod](slashIdentifier, !param._optional);
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
     * @param {import('discord.js').CommandInteractionOptionResolver | Array<String>} args El conjunto de entradas
     * @param {String} identifier El identificador de la flag
     * @typedef {{
     *  callback: FlagCallback,
     *  fallback: *
     * }} FeedbackOptions
     * @param {FeedbackOptions} output Define la respuestas en cada caso
     * @returns {*} El valor de retorno de callback si la flag fue respondida, o en cambio, el de fallback
     */
    fetchFlag(args, identifier, output = { callback: null, fallback: null }) {
        /**@type {CommandFlagExpressive}*/
        const flag = this.flags.get(identifier);

        if(!flag)
            throw new ReferenceError(`No se pudo encontrar una Flag con el identificador: ${identifier}`);

        if(Array.isArray(args))
            return fetchMessageFlag(args, {
                property: flag.isExpressive(),
                ...this.flags.get(identifier).structure,
                ...output
            });

        let getMethod = 'getBoolean';
        let flagValue;

        if(flag.isExpressive())
            getMethod = PARAM_TYPES[flag._type].getMethod;
        
        flagValue = args[getMethod](identifier);
        
        if(flagValue == undefined)
            return output.fallback;

        if(output.callback == undefined)
            return flagValue;

        return typeof output.callback === 'function' ? output.callback(flagValue, true) : output.callback;
    };
};

module.exports = {
    typeHelp,
    CommandOptionsManager,
};