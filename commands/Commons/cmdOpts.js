const { User, GuildMember, Message, TextChannel, VoiceChannel, GuildChannel, CommandInteractionOptionResolver, BaseGuildTextChannel, BaseGuildVoiceChannel, ChannelType, Role } = require('discord.js');
const { fetchUser, fetchMember, fetchChannel, fetchMessage, fetchRole, fetchSentence, toLowerCaseNormalized } = require('../../func');

/**
 * @typedef {{name: String, expression: String|Number}} ParamTypeStrict Parámetros de CommandOption que siguen una sintaxis estricta
 * @typedef {'NUMBER'|'TEXT'|'USER'|'MEMBER'|'ROLE'|'GUILD'|'CHANNEL'|'MESSAGE'|'EMOTE'|'IMAGE'|'FILE'|'URL'|'ID'} BaseParamType
 * @typedef {BaseParamType|ParamTypeStrict} ParamType Tipos de parámetro de CommandOption
 * @typedef {'SINGLE'|'MULTIPLE'|Array<String>} ParamPoly Capacidad de entradas de parámetro de CommandOption
 * @typedef {'getBoolean'|'getString'|'getNumber'|'getInteger'|'getChannel'|'getMessage'|'getUser'|'getMember'|'getRole'|'getAttachment'} GetMethodName
 * @typedef {Number | String | User | GuildMember | import('discord.js').GuildBasedChannel | Message<Boolean> | Role | undefined} ParamResult
 */

/**
 * @type {Map<BaseParamType, { getMethod: GetMethodName, help: String }>}
 */
const PARAM_TYPES = new Map();
PARAM_TYPES
    .set('NUMBER',  { getMethod: 'getNumber',     help: 'número' })
    .set('TEXT',    { getMethod: 'getString',     help: 'texto' })
    .set('USER',    { getMethod: 'getUser',       help: 'U{mención/texto/id}' })
    .set('MEMBER',  { getMethod: 'getMember',     help: 'M{mención/texto/id}' })
    .set('ROLE',    { getMethod: 'getRole',       help: 'R{mención/texto/id}' })
    .set('GUILD',   { getMethod: 'getString',     help: 'g{texto/id}' })
    .set('CHANNEL', { getMethod: 'getChannel',    help: 'C{enlace/texto/id}' })
    .set('MESSAGE', { getMethod: 'getMessage',    help: 'm{enlace/texto/id}' })
    .set('EMOTE',   { getMethod: 'getString',     help: 'emote' })
    .set('IMAGE',   { getMethod: 'getAttachment', help: 'imagen/enlace' })
    .set('FILE',    { getMethod: 'getAttachment', help: 'archivo/enlace' })
    .set('URL',     { getMethod: 'getString',     help: 'enlace' })
    .set('ID',      { getMethod: 'getInteger',    help: 'id' });

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
 * @template [T=*]
 * @typedef {(value: any, isSlash: Boolean) => T} FlagCallback
 */
/**
 * @typedef {Object} FeedbackOptions
 * @property {FlagCallback|number|string|boolean|bigint|object} [callback] Una función de mapeo de retorno o un valor de retorno positivo
 * @property {*} [fallback] Un valor de retorno negativo
 */
/**
 * @typedef {Object} FetchMessageFlagOptions
 * @property {Boolean} property
 * @property {Array<String>} short
 * @property {Array<String>} long
 * @property {FlagCallback} callback
 * @property {*} fallback
 */
/**
 * @function
 * @param {Array<String>} args
 * @param {FetchMessageFlagOptions} flag
 */
const fetchMessageFlag = (args, flag = { property: undefined, short: [], long: [], callback: undefined, fallback: undefined }) => {
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
            // @ts-ignore
            const flagChars = [...arg].slice(1).filter(c => flag.short.includes(c));
            for(let c of flagChars) {
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
const typeHelp = (type) => isParamTypeStrict(type)
    ? `${type.name}: ${type.expression}`
    : ParamTypes(type).help;

/**
 * Devuelve si el parámetro es no-estricto
 * @param {ParamType} pt - una instancia ParamType
 * @returns {pt is BaseParamType}
 */
const isBaseParamType = (pt) => typeof pt === 'string' && PARAM_TYPES.get(pt) != undefined;

/**
 * Devuelve si el parámetro es estricto
 * @param {ParamType} pt - una instancia ParamType
 * @returns {pt is ParamTypeStrict}
 */
const isParamTypeStrict = (pt) => (typeof pt === 'object') && pt?.name != undefined && pt?.expression != undefined;

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

    /**@returns {this is CommandParam}*/
    isCommandParam() { return false; }

    /**@returns {this is CommandFlag}*/
    isCommandFlag() { return false; }
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
     * @param {ParamType|Array<ParamType>} type El tipo del parámetro
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

    /**@returns {this is CommandParam}*/
    isCommandParam() {
        return true;
    }

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
            Array.isArray(this._type)
                ? this._type.map(t => typeHelp(t)).join(',')
                : typeHelp(this._type)
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
    /**@type {ParamType|undefined}*/
    _type;

    /**@constructor*/
    constructor() {
        super();
        this._expressive = false;
        this._type = undefined;
    }
    /**
     * Define los identificadores cortos de la bandera
     * @param {String | Array<String>} flags El/los identificadores
     * @returns
     */
    setShort(flags) {
        // @ts-ignore
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
    
    /**@returns {this is CommandFlagExpressive}*/
    isExpressive() {
        return this._expressive;
    }

    /**@returns {this is CommandFlag}*/
    isCommandFlag() {
        return true;
    }

    /**
     * Tipo de bandera como un string
     * @returns {String|undefined}
     */
    get type() {
        if(this._type == undefined) return '';
        if(isParamTypeStrict(this._type)) return 'ParamTypeStrict';
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
     * @returns {{ property: Boolean, short: Array<String>, long: Array<String> }}
     */
    get structure() {
        return { property: this.isExpressive(), short: this._short, long: this._long };
    }
};

/**Representa una bandera expresiva de comando*/
class CommandFlagExpressive extends CommandFlag {
    /**@type {String}*/
    _name;

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
        return typeHelp(this._type);
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
class CommandOptions {
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
    // @ts-ignore
    #defaults;
    /**
     * Contexto de Request
     * @type {import('./typings').CommandRequest?}
     */
    // @ts-ignore
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
     * @param {{name?: String, type?: ParamType}} [expression] La propiedad que modifica la bandera, si es expresiva
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
     * @returns {CommandOptions} La copia del administrador de opciones
     */
    in(request) {
        const newCOM = new CommandOptions(request);

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
            // @ts-ignore
            ...[...this.params.values()].map(p => p.display),
            // @ts-ignore
            ...[...this.flags.values()].map(f => f.display)
        ].join('\n');
    };

    /**
     * String de ayuda de las opciones de comando del administrador
     * @returns {String}
     */
    get callSyntax() {
        /**@type {Array<CommandParam>}*/
        // @ts-ignore
        const params = [...this.params.values()];
        return params.map(p => {
            const paramExpressions = [ p.name ];
            if(Array.isArray(p._poly)) paramExpressions.push(` (${p._poly.join(',')})`);
            else if(p._poly === 'MULTIPLE') paramExpressions.push(' (...)');
            if(p._optional) paramExpressions.push('?');
            return `<${paramExpressions.join('')}>`;
        }).join(' ');
    };

    /**@returns {Array<string>}*/
    static get requestDependantTypes() {
        /**@type {Array<BaseParamType>}*/
        const t = [ 'USER', 'MEMBER', 'MESSAGE', 'CHANNEL', 'ROLE' ];
        return t;
    }

    /**
     * Remueve y devuelve la siguiente entrada o devuelve todas las entradas en caso de que {@linkcode whole} sea verdadero
     * @param {Array<String>} args El conjunto de entradas
     * @param {ParamType} type El tipo de entrada buscado
     * @param {Boolean} whole Indica si devolver todas las entradas o no
     * @returns {Promise<ParamResult>}
     */
    async fetchMessageParam(args, type, whole = false) {
        if(CommandOptions.requestDependantTypes.includes(type.toString()) && !this.#request)
            throw ReferenceError('Se requiere un contexto para realizar este fetch. Usa <CommandOptions>.in(request)');

        const getArgsPrototype = () => (whole ? args.join(' ') : fetchSentence(args, 0)) || undefined;
        
        if(isParamTypeStrict(type))
            return getArgsPrototype();

        if(type === 'MESSAGE')
            return fetchMessage(getArgsPrototype(), this.#request);

        return this.fetchMessageParamSync(args, type, whole);
    }

    /**
     * Remueve y devuelve la siguiente entrada o devuelve todas las entradas en caso de que {@linkcode whole} sea verdadero
     * @param {Array<String>} args El conjunto de entradas
     * @param {ParamType} type El tipo de entrada buscado
     * @param {Boolean} whole Indica si devolver todas las entradas o no
     * @returns {ParamResult}
     */
    fetchMessageParamSync(args, type, whole = false) {
        if(CommandOptions.requestDependantTypes.includes(type.toString()) && !this.#request)
            throw ReferenceError('Se requiere un contexto para realizar este fetch. Usa <CommandOptions>.in(request)');

        const argsPrototype = whole ? args.join(' ') : fetchSentence(args, 0);
        if(!argsPrototype) return;
        
        if(isParamTypeStrict(type))
            return argsPrototype;
        switch(type) {
        case 'USER':
            return fetchUser(argsPrototype, this.#request);
        case 'MEMBER':
            return fetchMember(argsPrototype, this.#request);
        case 'ROLE':
            return fetchRole(argsPrototype, this.#request.guild);
        case 'MESSAGE':
            throw 'Los parámetros de mensaje solo pueden ser manejados mediante promesas';
        case 'CHANNEL':
            return fetchChannel(argsPrototype, this.#request.guild);
        case 'IMAGE':
            return argsPrototype;
        case 'NUMBER':
            //No quiero pelotudeces con números de JavaScript por favor
            if(argsPrototype == undefined)
                return;

            const correctedNumber = argsPrototype
                .replace(/,/g, '.')
                .replace(/_+/g, '')
                .replace(/^([\d\.]+) .*/, '$1');

            return +correctedNumber;
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
     * @param {Boolean} whole Indica si devolver todas las entradas en caso de un comando de mensaje. Por defecto: false
     * @returns {Promise<ParamResult>} El valor del parámetro
     */
    async fetchParam(input, slashIdentifier, whole = false) {
        /**@type {CommandParam}*/
        const param = this.params.get(slashIdentifier);

        if(!param)
            throw ReferenceError(`No se pudo encontrar un parámetro con el identificador: ${slashIdentifier}`);

        if(param._poly !== 'SINGLE')
            throw TypeError(`No se puede devolver un solo valor con un poliparámetro: ${slashIdentifier}`);

        if(Array.isArray(input)) {
            if(Array.isArray(param._type)) {
                const results = await Promise.all(param._type.map(pt => this.fetchMessageParam(input, pt, whole)));
                return results.find(r => r);
            } else
                return this.fetchMessageParam(input, param._type, whole);
        }

        /**@type {GetMethodName}*/
        let getMethodName = 'getString';

        if(Array.isArray(param._type)) {
            /**@type {ParamResult}*/
            let result;

            for(let pt of param._type) {
                if(!isParamTypeStrict(pt))
                    getMethodName = ParamTypes(pt).getMethod;

                try {
                    // @ts-ignore
                    result = input[getMethodName](slashIdentifier, !param._optional);
                } catch {
                    result = undefined;
                }

                if(result !== undefined) break;
            };

            return result;
        } else {
            if(!isParamTypeStrict(param._type))
                getMethodName = ParamTypes(param._type).getMethod;
            
            // @ts-ignore
            return input[getMethodName](slashIdentifier, !param._optional);
        }
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
     * @param {FeedbackOptions} output Define la respuestas en cada caso
     * @returns {*} El valor de retorno de callback si la flag fue respondida, o en cambio, el de fallback
     */
    fetchFlag(input, identifier, output = { callback: undefined, fallback: undefined }) {
        const flag = this.flags.get(identifier);

        if(!flag)
            throw new ReferenceError(`No se pudo encontrar una Flag con el identificador: ${identifier}`);

        if(Array.isArray(input))
            // @ts-ignore
            return fetchMessageFlag(input, {
                property: flag.isExpressive(),
                ...this.flags.get(identifier).structure,
                ...output
            });

        /**@type {GetMethodName}*/
        let getMethod = 'getBoolean';
        let flagValue;

        if(flag.isExpressive()) {
            if(isParamTypeStrict(flag._type))
                throw "No se pueden tener expresiones estrictas en una flag de comando";
            else
                getMethod = ParamTypes(flag._type)?.getMethod ?? 'getString';
        }
        
        // @ts-ignore
        flagValue = input[getMethod](identifier);
        
        if(flagValue == undefined)
            return output.fallback;

        // @ts-ignore
        if(output.callback == undefined)
            return flagValue;

        // @ts-ignore
        return typeof output.callback === 'function' ? output.callback(flagValue, true) : output.callback;
    };
};

/**
 * @template {import('./typings').CommandArguments} [TArgs=import('./typings').CommandArguments]
 * @class Representa un resolvedor de opciones de comando, sea este un comando de mensaje o un comandoSlash
 */
class CommandOptionSolver {
    /**@type {import('./typings').ComplexCommandRequest}*/
    #request;
    /**@type {Boolean}*/
    #requestified;
    /**@type {TArgs}*/
    #args;
    /**@type {String | null}*/
    #rawArgs;
    /**@type {CommandOptions}*/
    #options;
    /**@type {Boolean}*/
    #isSlash = false;

    /**
     * 
     * @param {import('./typings').ComplexCommandRequest} request 
     * @param {TArgs} args 
     * @param {CommandOptions} options 
     * @param {String} [rawArgs=null] 
     */
    constructor(request, args, options, rawArgs = null) {
        this.#request = request;
        this.#requestified = false;
        this.#args = args;
        this.#rawArgs = rawArgs;
        this.#options = options;
        this.#isSlash = args instanceof CommandInteractionOptionResolver;
    }

    get remainder() {
        if(this.isMessageSolver(this.#args))
            return this.#args.join(' ');

        return `${this.#args}`;
    }

    get args() {
        return this.#args;
    }

    get rawArgs() {
        return this.#rawArgs;
    }

    get empty() {
        return this.isMessageSolver(this.#args) && this.#args.length === 0;
    }

    //#region What is "this"
    /**
     * @param {*} args
     * @returns {args is Array<String>}
     */
    isMessageSolver(args) {
        return !this.#isSlash;
    }

    /**
     * @param {*} args
     * @returns {args is CommandInteractionOptionResolver}
     */
    isInteractionSolver(args) {
        return this.#isSlash;
    }
    //#endregion

    //#region Getters
    /**
     * @param {String} identifier 
     * @param {Boolean} [getRestOfMessageWords=false] 
     */
    getString(identifier, getRestOfMessageWords = false) {
        if(this.isInteractionSolver(this.#args))
            return this.#args.getString(identifier);

        const result = this.#getResultFromParamSync(identifier, getRestOfMessageWords);
        return CommandOptionSolver.asString(result);
    }

    /**
     * @param {String} identifier 
     */
    getNumber(identifier) {
        if(this.isInteractionSolver(this.#args))
            return this.#args.getNumber(identifier);

        const result = this.#getResultFromParamSync(identifier, false);
        return CommandOptionSolver.asNumber(result);
    }

    /**
     * @param {String} identifier 
     * @param {Boolean} [getRestOfMessageWords=false] 
     */
    getUser(identifier, getRestOfMessageWords = false) {
        if(this.isInteractionSolver(this.#args))
            return this.#args.getUser(identifier);

        this.ensureRequistified();

        const result = this.#getResultFromParamSync(identifier, getRestOfMessageWords);
        return CommandOptionSolver.asUser(result);
    }

    /**
     * @param {String} identifier 
     * @param {Boolean} [getRestOfMessageWords=false] 
     */
    getMember(identifier, getRestOfMessageWords = false) {
        if(this.isInteractionSolver(this.#args)) {
            const member = this.#args.getMember(identifier);

            if(member == undefined) return;
            if(!(member instanceof GuildMember)) return;

            return member;
        }

        this.ensureRequistified();

        const result = this.#getResultFromParamSync(identifier, getRestOfMessageWords);
        return CommandOptionSolver.asMember(result);
    }

    /**
     * @param {String} identifier 
     * @param {Boolean} [getRestOfMessageWords=false] 
     */
    getChannel(identifier, getRestOfMessageWords = false) {
        if(this.isInteractionSolver(this.#args)) {
            const channel = this.#args.getChannel(identifier);
            const valid = channel instanceof GuildChannel;

            if(!valid) return;
            
            return channel;
        }

        this.ensureRequistified();

        const result = this.#getResultFromParamSync(identifier, getRestOfMessageWords);
        return CommandOptionSolver.asChannel(result);
    }

    /**
     * @param {String} identifier 
     * @param {Boolean} [getRestOfMessageWords=false] 
     */
    async getMessage(identifier, getRestOfMessageWords = false) {
        if(this.isInteractionSolver(this.#args)) {
            const message = this.#args.getMessage(identifier);
            
            if(!message.inGuild())
                return undefined;

            return message;
        }

        this.ensureRequistified();

        const result = await this.#getResultFromParam(identifier, getRestOfMessageWords);
        return CommandOptionSolver.asMessage(result);
    }

    /**
     * @param {String} identifier 
     * @param {Boolean} [getRestOfMessageWords] 
     */
    getRole(identifier, getRestOfMessageWords = false) {
        if(this.isInteractionSolver(this.#args)) {
            const role = this.#args.getRole(identifier);

            if(role == undefined) return;
            if(!(role instanceof Role)) return;

            return role;
        }

        this.ensureRequistified();

        const result = this.#getResultFromParamSync(identifier, getRestOfMessageWords);
        return CommandOptionSolver.asRole(result);
    }

    /**
     * @template {(identifier: String, required?: Boolean) => *} TMethod
     * @template [TFallback=null]
     * @param {String} identifier 
     * @param {TMethod} method 
     * @param {TFallback} [fallback=null]
     * @returns {Array<ReturnType<TMethod>>|Array<TFallback>}
     */
    parsePolyParam(identifier, method, fallback) {
        if(this.isMessageSolver(this.#args))
            throw 'Función parsePolyParam no permitida para comandos de mensaje';

        return this.#options
            .fetchParamPoly(this.#args, identifier, this.#args.getString, fallback)
            .filter(input => input);
    }

    /**
     * Devuelve `true` si se ingresó la bandera especificada, o `false` de lo contrario
     * @param {String} identifier
     */
    parseFlag(identifier) {
        return CommandOptionSolver.asBoolean(
            this.#options.fetchFlag(
                this.#args,
                identifier,
                {
                    callback: true,
                    fallback: false,
                },
            )
        );
    }

    /**
     * Devuelve {@linkcode P} si se ingresó la bandera especificada, o {@linkcode N} de lo contrario
     * @template P
     * @template [N=undefined]
     * @param {String} identifier
     * @param {P} positiveResult
     * @param {N} [negativeResult=undefined]
     * @returns {P|N}
     */
    parseFlagExt(identifier, positiveResult, negativeResult = undefined) {
        return this.#options.fetchFlag(
            this.#args,
            identifier,
            {
                callback: positiveResult,
                fallback: negativeResult,
            },
        );
    }

    /**
     * Devuelve {@linkcode P} si se ingresó la bandera especificada, o {@linkcode N} de lo contrario
     * @template P
     * @template [N=undefined]
     * @param {string} identifier
     * @param {FlagCallback<P>} callback
     * @param {N} [fallback=undefined]
     * @returns {ReturnType<FlagCallback<P>>|N}
     */
    parseFlagExpr(identifier, callback, fallback = undefined) {
        return this.#options.fetchFlag(
            this.#args,
            identifier,
            {
                callback,
                fallback,
            },
        );
    }
    //#endregion

    //#region Casters
    /**
     * @param {ParamResult} paramResult The ParamResult to treat
     * @returns {Boolean|undefined}
     */
    static asBoolean(paramResult) {
        if(paramResult == undefined) return;
        if(typeof paramResult !== 'boolean')
            throw `Se esperaba el tipo de parámetro: Boolean, pero se recibió: ${typeof paramResult}`;
        return paramResult;
    }

    /**
     * @param {ParamResult} paramResult The ParamResult to treat
     * @returns {String|undefined}
     */
    static asString(paramResult) {
        if(paramResult == undefined) return;
        if(typeof paramResult !== 'string')
            throw `Se esperaba el tipo de parámetro: String, pero se recibió: ${typeof paramResult}`;
        return paramResult;
    }

    /**
     * @param {ParamResult} paramResult The ParamResult to treat
     * @returns {Number|undefined}
     */
    static asNumber(paramResult) {
        if(paramResult == undefined) return;
        if(typeof paramResult !== 'number')
            throw `Se esperaba el tipo de parámetro: Number, pero se recibió: ${typeof paramResult}`;
        return paramResult;
    }

    /**
     * @param {ParamResult} paramResult The ParamResult to treat
     * @returns {User|undefined}
     */
    static asUser(paramResult) {
        if(paramResult == undefined) return;
        if(!CommandOptionSolver.isUser(paramResult))
            throw `Se esperaba el tipo de parámetro: User, pero se recibió: ${typeof paramResult}`;
        return paramResult;
    }

    /**
     * @param {ParamResult} paramResult The ParamResult to treat
     * @returns {GuildMember|undefined}
     */
    static asMember(paramResult) {
        if(paramResult == undefined) return;
        if(!CommandOptionSolver.isMember(paramResult))
            throw `Se esperaba el tipo de parámetro: GuildMember, pero se recibió: ${typeof paramResult}`;
        return paramResult;
    }

    /**
     * @param {ParamResult} paramResult The ParamResult to treat
     * @returns {GuildChannel|undefined}
     */
    static asChannel(paramResult) {
        if(paramResult == undefined) return;
        if(!CommandOptionSolver.isChannel(paramResult))
            throw `Se esperaba el tipo de parámetro: Channel, pero se recibió: ${typeof paramResult}`;
        return paramResult;
    }

    /**
     * @param {ParamResult} paramResult The ParamResult to treat
     * @returns {Message<true>|undefined}
     */
    static asMessage(paramResult) {
        if(paramResult == undefined) return;
        if(!CommandOptionSolver.isMessage(paramResult))
            throw `Se esperaba el tipo de parámetro: Message<true>, pero se recibió: ${typeof paramResult}`;
        return paramResult;
    }

    /**
     * @param {ParamResult} paramResult The ParamResult to treat
     * @returns {Role|undefined}
     */
    static asRole(paramResult) {
        if(paramResult == undefined) return;
        if(!CommandOptionSolver.isRole(paramResult))
            throw `Se esperaba el tipo de parámetro: Role, pero se recibió: ${typeof paramResult}`;
        return paramResult;
    }
    //#endregion

    //#region Type Guards
    /**
     * @param {ParamResult} paramResult The ParamResult to treat
     * @returns {paramResult is User}
     */
    static isUser(paramResult) {
        if(paramResult == undefined) return false;
        return paramResult instanceof User;
    }

    /**
     * @param {ParamResult} paramResult The ParamResult to treat
     * @returns {paramResult is GuildMember}
     */
    static isMember(paramResult) {
        if(paramResult == undefined) return false;
        return paramResult instanceof GuildMember;
    }

    /**
     * @param {ParamResult} paramResult The ParamResult to treat
     * @returns {paramResult is GuildChannel}
     */
    static isChannel(paramResult) {
        if(paramResult == undefined) return false;
        return paramResult instanceof GuildChannel;
    }

    /**
     * @param {ParamResult} paramResult The ParamResult to treat
     * @returns {paramResult is Message<true>}
     */
    static isMessage(paramResult) {
        if(paramResult == undefined) return false;
        return paramResult instanceof Message;
    }

    /**
     * @param {ParamResult} paramResult The ParamResult to treat
     * @returns {paramResult is Role}
     */
    static isRole(paramResult) {
        if(paramResult == undefined) return false;
        return paramResult instanceof Role;
    }
    //#endregion

    //#region Misc
    ensureRequistified() {
        if(!this.#requestified) {
            this.#options = this.#options.in(this.#request);
            this.#requestified = true;
            return true;
        }
        return false;
    }

    /**
     * @param {String} identifier 
     * @param {Boolean} [getRestOfMessageWords=false] 
     */
    #getResultFromParamSync(identifier, getRestOfMessageWords = false) {
        if(!this.isMessageSolver(this.#args))
            throw "Se esperaban argumentos de comando de mensaje";

        const arrArgs = this.#args;

        const option = this.#options.options.get(identifier);
        if(!option.isCommandParam())
            throw "Se esperaba un identificador de parámetro de comando";


        let finalResult;
        if(Array.isArray(option._type)) {
            const results = option._type.map(pt => this.#options.fetchMessageParamSync(arrArgs, pt, getRestOfMessageWords));
            finalResult = results.find(r => r);
        } else
            finalResult = this.#options.fetchMessageParamSync(arrArgs, option._type, getRestOfMessageWords);

        return finalResult;
    }

    /**
     * @param {String} identifier 
     * @param {Boolean} [getRestOfMessageWords=false] 
     */
    async #getResultFromParam(identifier, getRestOfMessageWords = false) {
        if(!this.isMessageSolver(this.#args))
            throw "Se esperaban argumentos de comando de mensaje";

        const arrArgs = this.#args;

        const option = this.#options.options.get(identifier);
        if(!option.isCommandParam())
            throw "Se esperaba un identificador de parámetro de comando";

        if(Array.isArray(option._type)) {
            const results = await Promise.all(option._type.map(pt => this.#options.fetchMessageParam(arrArgs, pt, getRestOfMessageWords)));
            return results.find(r => r);
        } else
            return await this.#options.fetchMessageParam(arrArgs, option._type, getRestOfMessageWords);
    }
    //#endregion
}

module.exports = {
    typeHelp,
    CommandOptions,
    CommandOptionSolver,
};