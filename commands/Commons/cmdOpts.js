/**
 * @typedef {{name: String, expression: String|Number}} ParamTypeStrict Parámetros de CommandOption que siguen una sintaxis estricta
 * @typedef {'NUMBER'|'TEXT'|'USER'|'MEMBER'|'ROLE'|'GUILD'|'CHANNEL'|'MESSAGE'|'EMOTE'|'IMAGE'|'FILE'|'URL'|'ID'} BaseParamType
 * @typedef {BaseParamType|ParamTypeStrict} ParamType Tipos de parámetro de CommandOption
 * @typedef {'SINGLE'|'MULTIPLE'|Array<String>} ParamPoly Capacidad de entradas de parámetro de CommandOption
 * @typedef {'getBoolean'|'getString'|'getNumber'|'getInteger'|'getChannel'|'getUser'|'getMember'|'getRole'} GetMethodName
 */
const { fetchUser, fetchMember, fetchChannel, fetchMessage } = require('../../func');

/**
 * @type {Map<BaseParamType, { getMethod: GetMethodName, help: String }>}
 */
const PARAM_TYPES = new Map();
PARAM_TYPES
    .set('NUMBER',  { getMethod: 'getNumber',  help: 'número' })
    .set('TEXT',    { getMethod: 'getString',  help: 'texto' })
    .set('USER',    { getMethod: 'getUser',    help: 'U{mención/texto/id}' })
    .set('MEMBER',  { getMethod: 'getUser',    help: 'M{mención/texto/id}' })
    .set('ROLE',    { getMethod: 'getRole',    help: 'R{mención/texto/id}' })
    .set('GUILD',   { getMethod: 'getString',  help: 'g{texto/id}' })
    .set('CHANNEL', { getMethod: 'getChannel', help: 'C{enlace/texto/id}' })
    .set('MESSAGE', { getMethod: 'getString',  help: 'm{enlace/texto/id}' })
    .set('EMOTE',   { getMethod: 'getString',  help: 'emote' })
    .set('IMAGE',   { getMethod: 'getString',  help: 'imagen/enlace' })
    .set('FILE',    { getMethod: 'getString',  help: 'archivo/enlace' })
    .set('URL',     { getMethod: 'getString',  help: 'enlace' })
    .set('ID',      { getMethod: 'getInteger', help: 'id' });

/**@param {BaseParamType} pt*/
const ParamTypes = (pt) => PARAM_TYPES.get(pt);

/**
 * @param {Array<String>} args
 * @return {String}
 */
const fetchMessageFlagText = (args, i) => {
    if(i >= args.length)
        return undefined;
    if(!args[i].startsWith('"'))
        return args.splice(i, 1)[0];

    let lastIndex = i;
    let text;
    while(lastIndex < args.length && !args[lastIndex].endsWith('"'))
        lastIndex++;
    text = args.splice(i, lastIndex - i + 1).join(' ').slice(1);
    
    if(text.length === 0 || text === '"')
        return undefined;

    return text.endsWith('"') ? text.slice(0, -1) : text;
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

        if(arg.startsWith('--')) {
            if(!flag.long?.length || !flag.long.includes(arg.slice(2)))
                return;
            flagValue = flag.property ? fetchMessageFlagText(args, i + 1) : arg;
            return args.splice(i, 1);
        }

        if(flag.short?.length && arg.startsWith('-') && arg !== '-') {
            const flagChars = [...arg].slice(1).filter(c => flag.short.includes(c));
            for(c of flagChars) {
                flagValue = flag.property ? fetchMessageFlagText(args, i + 1) : c;

                if(arg.length <= 2)
                    return args.splice(i, 1);

                const flagToRemove = new RegExp(c, 'g')
                let temp = args.splice(i, 1); //Remover temporalmente el stack completo de flags cortas
                args.push(temp[0].replace(flagToRemove, '')); //Reincorporar lo eliminado, descartando las flags ya procesadas
            }
            if(args[i] === '-')
                args.splice(i, 1);
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
const typeHelp = (type) => ParamTypes(type).help;

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
            : typeHelp(this._type);
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
    /**Propiedades por defecto*/
    #defaults;
    /**
     * Contexto de Request
     * @type {import('./typings').CommandRequest?}
     */
    #request;

    /**
     * @constructor
     * @param {import('./typings').CommandRequest?} request El contexto de Request actual. Esto solo se ingresa dentro de una ejecución
     */
    constructor(request = null) {
        this.options = new Map();
        this.params = new Map();
        this.flags = new Map();
        this.#defaults = {
            polymax: 5
        };
        this.#request = request;
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
            .setPoly(poly || 'SINGLE', polymax || this.#defaults.polymax)
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
     * Crea una copia del administrador de opciones bajo el contexto de ejecución actual
     * Es una tarea cara que se usa al querer fetchear un miembro, usuario u otro tipo de dato que requiera el contexto de ejecución. De lo contrario, no debería usarse
     * @param {import('./typings').CommandRequest} request
     * @returns {CommandOptionsManager} La copia del administrador de opciones
     */
    in(request) {
        const newCOM = new CommandOptionsManager(request);

        newCOM.options = this.options;
        newCOM.params = this.params;
        newCOM.flags = this.flags;

        return newCOM;
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
     * Remueve y devuelve la siguiente entrada o devuelve todas las entradas en caso de que {@linkcode whole} sea verdadero
     * @param {Array<String>} args El conjunto de entradas
     * @param {ParamType} type El tipo de entrada buscado
     * @param {Boolean} whole Indica si devolver todas las entradas o no
     */
    #fetchMessageParam(args, type, whole = false) {
        if([ 'USER', 'MEMBER', 'MESSAGE', 'CHANNEL' ].includes(type) && !this.#request)
            throw ReferenceError('Se requiere un contexto para realizar este fetch. Usa <CommandOptionsManager>.in(request)');
        
        const argsPrototype = whole ? args.join(' ') : args.shift();
        if(!argsPrototype) return;
        
        if(isParamTypeStrict(type))
            return argsPrototype;
        switch(type) {
        case 'USER':
            return fetchUser(argsPrototype, this.#request);
        case 'MEMBER':
            return fetchMember(argsPrototype, this.#request);
        case 'ROLE':
            return argsPrototype; //Pendiente
        case 'MESSAGE':
            return fetchMessage(argsPrototype, this.#request); //Pendiente
        case 'CHANNEL':
            return fetchChannel(argsPrototype, this.#request.guild); //Pendiente
        case 'IMAGE':
            return argsPrototype; //Pendiente
        case 'NUMBER':
            return +argsPrototype;
        default:
            return argsPrototype;
        }
    }

    /**
     * Si es un comando Slash, devuelve el valor del parámetro ingresado
     * Si es un comando de mensaje, remueve y devuelve la siguente entrada o devuelve todas las entradas en caso de que {@linkcode whole} sea verdadero
     * Si no se recibe ningún parámetro, se devuelve undefined
     * 
     * @param {import('discord.js').CommandInteractionOptionResolver | Array<String>} input El conjunto de entradas
     * @param {String} slashIdentifier El identificador del parámetro para comandos Slash
     * @param {Boolean?} whole Indica si devolver todas las entradas en caso de un comando de mensaje
     * @returns El valor del parámetro
     */
    fetchParam(input, slashIdentifier, whole = false) {
        /**@type {CommandParam}*/
        const param = this.params.get(slashIdentifier);

        if(!param)
            throw ReferenceError(`No se pudo encontrar un parámetro con el identificador: ${slashIdentifier}`);

        if(param._poly !== 'SINGLE')
            throw TypeError(`No se puede devolver un solo valor con un poliparámetro: ${slashIdentifier}`);

        if(Array.isArray(input))
            return this.#fetchMessageParam(input, param._type, whole);

        /**@type {GetMethodName}*/
        let getMethodName = 'getString';
        if(!isParamTypeStrict(param._type))
            getMethodName = ParamTypes(param._type).getMethod;

        return input[getMethodName](slashIdentifier, !param._optional);
    };

    /**
     * Devuelve un arreglo de todas las entradas recibidas.
     * Si no se recibe ninguna entrada, se devuelve fallback
     * @param {CommandInteractionOptionResolver} input El resolvedor de opciones de interacción
     * @param {String} identifier El identificador del parámetro
     * @param {Function} callbackFn Una función de SlashCommandBuilder para leer un valor
     * @param {(Function | *)?} fallback Un valor por defecto si no se recibe ninguna entrada
     * @returns {Array<*>} Un arreglo con las entradas procesadas por callbackFn, o alternativamente, un valor devuelto por fallback
     */
    fetchParamPoly(input, identifier, callbackFn, fallback = undefined) {
        /**@type {CommandParam}*/
        const option = this.params.get(identifier);
        if(!option)
            throw new ReferenceError(`No se pudo encontrar un Poly-parámetro con el identificador: ${identifier}`);

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
                if(!Array.isArray(params))
                    throw TypeError('Se esperaba un arreglo como Poly-parámetro');
                break;
            }

        params = params
            .map((opt, i) => callbackFn.call(input, opt, !i && !option._optional))
            .filter(param => param);
            
        return params.length ? params : [ (typeof fallback === 'function') ? fallback() : fallback ];
    };

    /**
     * Devuelve un valor o función basado en si se ingresó la flag buscada o no.
     * Si no se recibe ninguna entrada, se devuelve fallback.
     * Si callback no está definido, se devuelve el valor encontrado
     * @param {import('discord.js').CommandInteractionOptionResolver | Array<String>} input Los datos de entrada
     * @param {String} identifier El identificador de la flag
     * @typedef {{
     *  callback: FlagCallback,
     *  fallback: *
     * }} FeedbackOptions
     * @param {FeedbackOptions} output Define la respuestas en cada caso
     * @returns {*} El valor de retorno de callback si la flag fue respondida, o en cambio, el de fallback
     */
    fetchFlag(input, identifier, output = { callback: null, fallback: null }) {
        /**@type {CommandFlagExpressive}*/
        const flag = this.flags.get(identifier);

        if(!flag)
            throw new ReferenceError(`No se pudo encontrar una Flag con el identificador: ${identifier}`);

        if(Array.isArray(input))
            return fetchMessageFlag(input, {
                property: flag.isExpressive(),
                ...this.flags.get(identifier).structure,
                ...output
            });

        /**@type {GetMethodName}*/
        let getMethod = 'getBoolean';
        let flagValue;

        if(flag.isExpressive())
            getMethod = ParamTypes(flag._type)?.getMethod ?? 'getString';
        
        flagValue = input[getMethod](identifier);
        
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