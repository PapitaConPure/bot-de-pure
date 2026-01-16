import { User, GuildMember, Message, GuildChannel, CommandInteractionOptionResolver, Role, Attachment, Guild, GuildBasedChannel, AutocompleteInteraction } from 'discord.js';
import { fetchUser, fetchMember, fetchChannel, fetchMessage, fetchRole, fetchSentence, regroupText, fetchGuild } from '../../func';

import Logger from '../../utils/logs';
import { getDateComponentsFromString, makeDateFromComponents, parseTimeFromNaturalLanguage, relativeDates } from '../../utils/datetime';
import { CommandArguments, CommandRequest, ComplexCommandRequest } from './typings';
const { warn } = Logger('WARN', 'CmdOpts');

export type ParamTypeStrict = { name: string; expression: string | number; };

export type BaseParamType =
	| 'NUMBER'
	| 'TEXT'
	| 'USER'
	| 'MEMBER'
	| 'ROLE'
	| 'GUILD'
	| 'CHANNEL'
	| 'MESSAGE'
	| 'EMOTE'
	| 'IMAGE'
	| 'FILE'
	| 'URL'
	| 'ID'
	| 'DATE'
	| 'TIME';

export type ParamType = BaseParamType | ParamTypeStrict;

export type ParamPoly = 'SINGLE' | 'MULTIPLE' | string[];

export type GetMethodName = keyof CommandInteractionOptionResolver & `get${string}`;

export interface ParamTypeSpecification {
	getMethod: string;
	help: string;
}

/**@satisfies {Record<BaseParamType, { getMethod: GetMethodName, help: string }>}*/
const paramTypes = ({
	NUMBER:  { getMethod: 'getNumber',     help: 'número' },
	TEXT:    { getMethod: 'getString',     help: 'texto' },
	USER:    { getMethod: 'getUser',       help: 'U{mención/texto/id}' },
	MEMBER:  { getMethod: 'getMember',     help: 'M{mención/texto/id}' },
	ROLE:    { getMethod: 'getRole',       help: 'R{mención/texto/id}' },
	GUILD:   { getMethod: 'getString',     help: 'g{texto/id}' },
	CHANNEL: { getMethod: 'getChannel',    help: 'C{enlace/texto/id}' },
	MESSAGE: { getMethod: 'getMessage',    help: 'm{enlace/texto/id}' },
	EMOTE:   { getMethod: 'getString',     help: 'emote' },
	IMAGE:   { getMethod: 'getAttachment', help: 'imagen/enlace' },
	FILE:    { getMethod: 'getAttachment', help: 'archivo/enlace' },
	URL:     { getMethod: 'getString',     help: 'enlace' },
	ID:      { getMethod: 'getInteger',    help: 'id' },
	DATE:    { getMethod: 'getString',     help: 'fecha' },
	TIME:    { getMethod: 'getString',     help: 'hora' },
}) as const;

function fetchMessageFlagText(args: string[], i): string {
	if(i >= args.length)
		return undefined;
	if(!args[i].startsWith('"'))
		return args.splice(i, 1)[0];

	let lastIndex = i;
	while(lastIndex < args.length && !args[lastIndex].endsWith('"'))
		lastIndex++;
	const text = args.splice(i, lastIndex - i + 1).join(' ').slice(1);

	if(text.length === 0 || text === '"')
		return undefined;

	return text.endsWith('"') ? text.slice(0, -1) : text;
}

export type ParamResult =
	| number
	| string
	| boolean
	| User
	| GuildMember
	| Guild
	| GuildBasedChannel
	| Message<boolean>
	| Role
	| Attachment
	| Date
	| undefined;

export type FlagCallback<TResult extends ParamResult = ParamResult> = (value: ParamResult, isSlash: boolean) => TResult;

export type CommandArgumentGetFunction<TResult extends ParamResult = ParamResult>
	= (identifier: string, required?: boolean) => TResult;

interface FeedbackOptions<TCallback extends ParamResult = ParamResult, TFallback extends ParamResult = ParamResult> {
	callback?: FlagCallback<TCallback> | TCallback;
	fallback?: TFallback;
}

interface FetchMessageFlagOptions {
	property: boolean;
	short: string[];
	long: string[];
	callback: FlagCallback;
	fallback: unknown;
}

function fetchMessageFlag(args: string[], flag: FetchMessageFlagOptions = { property: undefined, short: [], long: [], callback: undefined, fallback: undefined }) {
	if(!args.length)
		return flag.fallback;

	let flagValue: ParamResult;
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
			for(const c of flagChars) {
				flagValue = flag.property ? fetchMessageFlagText(args, i + 1) : c;

				if(arg.length <= 2)
					return args.splice(i, 1);

				const flagToRemove = new RegExp(c, 'g')
				const temp = args.splice(i, 1); //Remover temporalmente el stack completo de flags cortas
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

/**@description Devuelve el texto de página de ayuda del tipo ingresado.*/
export const typeHelp = (type: ParamType) => isParamTypeStrict(type)
	? `${type.name}: ${type.expression}`
	: paramTypes[type].help;

/**@description Devuelve si el parámetro es "de formato no-estricto".*/
const isBaseParamType = (pt: ParamType): pt is BaseParamType => typeof pt === 'string' && paramTypes[pt] != undefined;

/**@description Devuelve si el parámetro es "de formato estricto".*/
const isParamTypeStrict = (pt: ParamType): pt is ParamTypeStrict => (typeof pt === 'object') && pt?.name != undefined && pt?.expression != undefined;

type AutocompleteFunction = (interaction: AutocompleteInteraction<'cached'>, query: string) => Promise<unknown>;

async function handleAutocomplete(fn: AutocompleteFunction, interaction: AutocompleteInteraction<'cached'>, query: string) {
	const result = await fn(interaction, query);

	if(!interaction.responded) {
		if(Array.isArray(result) && result.every(r => r.name && r.value))
			return interaction.respond(result.slice(0, 10));

		return interaction.respond([]);
	}

	return result;
}

function groupQuoted(args: string[]): string[] {
	const result = [];

	let isInsideQuotes = false;
	let groupedTemp = [];

	for(const arg of args) {
		if(arg.startsWith('"') && !isInsideQuotes) {
			isInsideQuotes = true;
			groupedTemp.push(arg.slice(1));
		} else if(arg.endsWith('"') && isInsideQuotes && !arg.endsWith('\\"')) {
			groupedTemp.push(arg.slice(0, -1));
			result.push(groupedTemp.join(' ').trim());
			groupedTemp = [];
			isInsideQuotes = false;
		} else if(isInsideQuotes)
			groupedTemp.push(arg);
		else
			result.push(arg);
	}

	if(isInsideQuotes)
		result.push(groupedTemp.join(' '));

	return result;
}

/**@description Representa una opción de comando.*/
class CommandOption {
	protected _desc: string;

	/**@description La descripción de la opción.*/
	get desc() {
		return this._desc;
	}

	/**@description Define la descripción de la opción.*/
	setDesc(description: string) {
		if(!description)
			throw new InvalidCommandOptionAttributeError('La descripción de la opción no puede ser null ni estar vacío');

		this._desc = description;
		return this;
	}

	isCommandParam(): this is CommandParam { return false; }

	isCommandFlag(): this is CommandFlag { return false; }
}

/**@description Representa un parámetro de comando.*/
export class CommandParam extends CommandOption {
	#name: string;
	#type: ParamType | ParamType[];
	#optional: boolean;
	#poly: ParamPoly;
	#polymax: number;
	#autocompleteInner: AutocompleteFunction;

	/**
	 * @param name El nombre del parámetro.
	 * @param {Exclude<ParamType | ParamType[], undefined | null>} type El tipo del parámetro.
	 */
	constructor(name: string, type: Exclude<ParamType | ParamType[], undefined | null>) {
		super();

		if(!name)
			throw new InvalidCommandOptionAttributeError('El nombre del parámetro no puede ser null ni estar vacío');

		if(!type)
			throw new InvalidCommandOptionAttributeError('El tipo del parámetro no puede ser null ni estar vacío');

		this.#name = name;
		this.#type = type;
		this.#optional = false;
		this.#poly = 'SINGLE';
		this.#polymax = 8;
	};

	/**@description Define si el parámetro es opcional.*/
	setOptional(optional: boolean) {
		this.#optional = optional;
		return this;
	}

	/**
	 * @description Define la capacidad de entradas del parámetro.
	 * @param level La capacidad del parámetro.
	 * @param max El máximo de entradas admitidas (para parámetros de tipo múltiple).
	 */
	setPoly(level: ParamPoly, max: number | null) {
		this.#poly = level;
		if(max) this.#polymax = max;
		return this;
	}

	/**@description Establece una función de autocompletado para este parámetro.*/
	setAutocomplete(autocompleteFn: AutocompleteFunction) {
		this.#autocompleteInner = autocompleteFn;
		return this;
	}

	isCommandParam(): this is CommandParam {
		return true;
	}

	autocomplete: AutocompleteFunction = (interaction, query) => {
		return handleAutocomplete(this.#autocompleteInner, interaction, query);
	}

	/**@description Nombre del parámetro.*/
	get name() {
		return this.#name;
	}

	/**@description Tipo aceptado del parámetro.*/
	get type() {
		return this.#type;
	}

	/**@description Indica si el parámetro es opcional.*/
	get optional() {
		return this.#optional;
	}

	/**@description El tipo de poliparametrización del parámetro.*/
	get poly() {
		return this.#poly;
	}

	/**@description La cantidad de parámetros máxima del parámetro poliparametrizado.*/
	get polymax() {
		return this.#polymax;
	}

	/**@description Texto del tipo aceptado del parámetro.*/
	get typeDisplay() {
		const typeString = [
			Array.isArray(this.#type)
				? this.#type.map(t => typeHelp(t)).join(',')
				: typeHelp(this.#type)
		];

		if(this.#poly === 'MULTIPLE')
			typeString.push(`[múltiple/${this.#polymax}]`);
		else if(Array.isArray(this.#poly))
			typeString.push(`[${this.#poly.length}]`);

		return typeString.join(' ');
	}

	/**@description Texto de ayuda del parámetro.*/
	get display(): string {
		const identifier = [this.#name];

		if(this.#optional) identifier.push('?');
		if(this.#poly === 'MULTIPLE') identifier.push('(...)');
		else if(Array.isArray(this.#poly)) identifier.push(`(${this.#poly.join(',')})`);

		return `\`<${identifier.join('')}>\` _(${this.typeDisplay})_ ${this.desc}`;
	}

	get hasAutocomplete() {
		return this.#autocompleteInner != null;
	}
}

/**@class Representa una bandera de comando.*/
export class CommandFlag extends CommandOption {
	protected _short: string[];
	protected _long: string[];
	protected _expressive: boolean;
	protected _type: ParamType | undefined;

	constructor() {
		super();
		this._expressive = false;
		this._type = undefined;
	}

	/**@description Define los identificadores cortos de la bandera.*/
	setShort(identifiers: string | string[]) {
		this._short = [...identifiers];
		return this;
	};

	/**@description Define los identificadores largos de la bandera*/
	setLong(identifiers: string | string[]) {
		this._long = Array.isArray(identifiers) ? identifiers : [identifiers];
		return this;
	};

	isExpressive(): this is CommandFlagExpressive {
		return this._expressive;
	}

	isCommandFlag(): this is CommandFlag {
		return true;
	}

	/**@description Los identificadores cortos de la bandera.*/
	get short() {
		return this._short;
	}

	/**@description Los identificadores largos de la bandera.*/
	get long() {
		return this._long;
	}

	get actualType() {
		return this._type;
	}

	/**@description Tipo de bandera como un string.*/
	get type(): string | undefined {
		if(this._type == undefined) return '';
		if(isParamTypeStrict(this._type)) return 'ParamTypeStrict';
		return this._type;
	}

	/**@description String de ayuda de la bandera.*/
	get display(): string {
		const { _short: short, _long: long, desc } = this;
		const flagString = [];
		if(Array.isArray(short) && short.length) flagString.push(`\`-${short[0]}\``);
		if(Array.isArray(long) && long.length)   flagString.push(`\`--${long[0]}\``);
		return `${flagString.join(' o ')} ${desc}`;
	};

	/**@description Estructura de objeto de los identificadores de la bandera.*/
	get structure(): { property: boolean; short: string[]; long: string[]; } {
		return { property: this.isExpressive(), short: this._short, long: this._long };
	}

	/**@description Identificador de la bandera.*/
	get identifier() {
		return this._long.length
			? (Array.isArray(this._long) ? this._long[0] : this._long)
			: this._short[0];
	}
}

/**@class Representa una bandera expresiva de comando.*/
export class CommandFlagExpressive extends CommandFlag {
	#name: string;
	#autocompleteInner: AutocompleteFunction;

	/**
	 * @constructor
	 * @param {string} name El nombre de entrada de la bandera
	 * @param {Exclude<ParamType, undefined | null>} type El tipo de entrada de la bandera
	 */
	constructor(name: string, type: Exclude<ParamType, undefined | null>) {
		super();

		if(!name)
			throw new InvalidCommandOptionAttributeError('El nombre del parámetro no puede ser null ni estar vacío');

		if(!type)
			throw new InvalidCommandOptionAttributeError('El tipo del parámetro no puede ser null ni estar vacío');

		this.#name = name;
		this._type = type;
		this._expressive = true;
	};

	/**
	 * @description Define el nombre de entrada de la bandera.
	 * @param n El tipo de la bandera.
	 */
	setName(n: string) {
		this.#name = n;
		return this;
	};

	/**@description Establece una función de autocompletado para este parámetro.*/
	setAutocomplete(autocompleteFn: AutocompleteFunction) {
		this.#autocompleteInner = autocompleteFn;
		return this;
	}

	autocomplete: AutocompleteFunction = (interaction, query) => {
		return handleAutocomplete(this.#autocompleteInner, interaction, query);
	}

	/**@description El nombre del parámetro de la bandera.*/
	get name() {
		return this.#name;
	}

	/**@description El tipo del parámetro de la bandera.*/
	get typeDisplay(): string {
		return typeHelp(this._type);
	};

	/**@description Texto de ayuda de la bandera.*/
	get display(): string {
		const { short, long, name, typeDisplay, desc } = this;
		const flagString = [];
		if(Array.isArray(short) && short.length) flagString.push(`\`-${short[0]} <${name}>\``);
		if(Array.isArray(long) && long.length)  flagString.push(`\`--${long[0]} <${name}>\``);
		return `${flagString.join(' o ')} _(${typeDisplay})_ ${desc}`;
	}

	get hasAutocomplete() {
		return this.#autocompleteInner != null;
	}
};

export type RegroupMethod = 'NONE' | 'SEPARATOR' | 'MENTIONABLES-WITH-SEP' | 'DOUBLE-QUOTES';

export interface PolyParamParsingOptions<TFallback extends ParamResult | null = undefined> {
	regroupMethod?: RegroupMethod;
	messageSep?: string;
	fallback?: TFallback;
	failedPayload?: string[];
}

/**@class Representa un administrador de opciones de comando.*/
export class CommandOptions {
	/**@description Opciones del administrador.*/
	options: Map<string, CommandOption>;
	/**@description Parámetros del administrador.*/
	params: Map<string, CommandParam>;
	/**@description Banderas del administrador.*/
	flags: Map<string, CommandFlag | CommandFlagExpressive>;
	/**@description Propiedades por defecto*/
	#defaults: { polymax: number };
	/**@description Contexto de Request.*/
	#request: CommandRequest | null;

	/**@param {CommandRequest?} request El contexto de Request actual. Esto solo se ingresa dentro de una ejecución.*/
	constructor(request: CommandRequest | null = null) {
		this.options = new Map();
		this.params = new Map();
		this.flags = new Map();
		this.#defaults = {
			polymax: 5
		};
		this.#request = request;
	};

	/**
	 * @description Añade un parámetro al administrador.
	 * @param {string} name El nombre del parámetro.
	 * @param {Exclude<ParamType | ParamType[], undefined | null>} type El tipo de parámetro.
	 * @param {string} desc La descripción del parámetro.
	 * @param {{ poly?: ParamPoly, polymax?: Number, optional?: Boolean }} optionModifiers Los modificadores del parámetro.
	 */
	addParam(name: string, type: Exclude<ParamType | ParamType[], undefined | null>, desc: string, optionModifiers: { poly?: ParamPoly; polymax?: number; optional?: boolean; } = { poly: undefined, polymax: undefined, optional: undefined } ) {
		if(optionModifiers && typeof optionModifiers !== 'object')
			throw new TypeError('Modificadores de parámetro inválidos');

		const { poly, polymax, optional } = optionModifiers ?? {};
		if(poly && !Array.isArray(poly) && !['SINGLE', 'MULTIPLE',].includes(poly))
			throw new TypeError('Multiplicidad de parámetro inválida');

		const commandParam = new CommandParam(name, type)
			.setDesc(desc)
			.setPoly(poly || 'SINGLE', polymax || this.#defaults.polymax)
			.setOptional(optional || false);
		this.options.set(commandParam.name, commandParam);
		this.params.set(commandParam.name, commandParam);
		return this;
	};

	/**
	 * @description Añade una bandera al administrador.
	 * @param short El/los identificadores cortos.
	 * @param long El/los identificadores largos.
	 * @param desc La descripción de la bandera.
	 * @param expression La propiedad que modifica la bandera, si es expresiva.
	 */
	addFlag(short: string | string[], long: string | string[], desc: string, expression?: { name?: string; type?: Exclude<ParamType, undefined | null>; }) {
		const commandFlag = (expression)
			? new CommandFlagExpressive(expression.name, expression.type)
			: new CommandFlag();
		commandFlag
			.setShort(short)
			.setLong(long)
			.setDesc(desc);
		const flagIdentifier = commandFlag.identifier;
		this.options.set(flagIdentifier, commandFlag);
		this.flags.set(flagIdentifier, commandFlag);
		return this;
	};

	/**@description Añade opciones al administrador.*/
	addOptions(...options: CommandOption[]) {
		for(const option of options) {
			let identifier;

			if(option.isCommandParam()) {
				identifier = option.name;
				this.params.set(identifier, option);
			} else if(option.isCommandFlag()) {
				identifier = option.identifier;
				this.flags.set(identifier, option);
			}

			this.options.set(identifier, option);
		};

		return this;
	}

	/**
	 * @description
	 * Crea una copia del administrador de opciones bajo el contexto de ejecución actual.
	 * Se usa al querer fetchear un miembro, usuario u otro tipo de dato que requiera el contexto de ejecución. De lo contrario, no debería usarse.
	 */
	in(request: CommandRequest): CommandOptions {
		const newCOM = new CommandOptions(request);

		newCOM.options = this.options;
		newCOM.params = this.params;
		newCOM.flags = this.flags;

		return newCOM;
	};

	/**@description String de ayuda de las opciones de comando del administrador.*/
	get display(): string {
		return [
			...[...this.params.values()].map(p => `* ${p.display}`),
			...[...this.flags.values()].map(f => `* ${f.display}`)
		].join('\n');
	};

	/**@description String de ayuda de las opciones de comando del administrador.*/
	get callSyntax(): string {
		const params: CommandParam[] = [...this.params.values()];
		return params.map(p => {
			const paramExpressions = [ p.name ];
			if(Array.isArray(p.poly)) paramExpressions.push(` (${p.poly.join(',')})`);
			else if(p.poly === 'MULTIPLE') paramExpressions.push(' (...)');
			if(p.optional) paramExpressions.push('?');
			return `<${paramExpressions.join('')}>`;
		}).join(' ');
	};

	static readonly #fetchDependantTypes = new Set([
		'MESSAGE',
		'GUILD',
	] as ReadonlyArray<BaseParamType>);

	static readonly #requestDependantTypes = new Set([
		'USER',
		'MEMBER',
		'MESSAGE',
		'CHANNEL',
		'ROLE',
	] as ReadonlyArray<BaseParamType>);

	static get fetchDependantTypes() {
		return this.#fetchDependantTypes;
	}

	static get requestDependantTypes() {
		return this.#requestDependantTypes;
	}

	/**
	 * @description Remueve y devuelve la siguiente entrada o devuelve todas las entradas en caso de que {@linkcode whole} sea verdadero.
	 * @param args El conjunto de entradas.
	 * @param type El tipo de entrada buscado.
	 * @param whole Indica si devolver todas las entradas o no.
	 */
	async fetchMessageParam(args: string[], type: ParamType, whole: boolean = false): Promise<ParamResult> {
		if(isBaseParamType(type) && !CommandOptions.fetchDependantTypes.has(type))
			return this.fetchMessageParamSync(args, type, whole);

		if(!this.#request)
			throw ReferenceError('Se requiere un contexto para realizar este fetch. Usa <CommandOptions>.in(request)');

		const argsPrototype = this.getArgsPrototype(args, whole);
		if(!argsPrototype) return;

		switch(type) {
		case 'USER':
			warn('USER ya no es un parámetro asíncrono. Se recomienda usar fetchMessageParamSync para este tipo de comandos');
			return fetchUser(argsPrototype, this.#request);
		case 'MEMBER':
			warn('MEMBER ya no es un parámetro asíncrono. Se recomienda usar fetchMessageParamSync para este tipo de comandos');
			return fetchMember(argsPrototype, this.#request);
		case 'MESSAGE':
			return fetchMessage(argsPrototype, this.#request);
		case 'GUILD':
			return fetchGuild(argsPrototype);
		}
	}

	/**
	 * @description Remueve y devuelve la siguiente entrada o devuelve todas las entradas en caso de que {@linkcode whole} sea verdadero.
	 * @param args El conjunto de entradas.
	 * @param type El tipo de entrada buscado.
	 * @param whole Indica si devolver todas las entradas o no.
	 */
	fetchMessageParamSync(args: string[], type: ParamType, whole: boolean = false): ParamResult {
		if(isBaseParamType(type) && CommandOptions.requestDependantTypes.has(type) && !this.#request)
			throw ReferenceError('Se requiere un contexto para realizar este fetch. Usa <CommandOptions>.in(request)');

		const argsPrototype = this.getArgsPrototype(args, whole);
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
		case 'GUILD':
			throw 'Los parámetros de servidor solo pueden ser manejados mediante promesas';
		case 'CHANNEL':
			return fetchChannel(argsPrototype, this.#request.guild);
		case 'IMAGE':
			return argsPrototype;
		case 'NUMBER': {
			if(argsPrototype == undefined)
				return;

			const correctedNumber = argsPrototype
				.replace(/,/g, '.')
				.replace(/_+/g, '')
				.replace(/^([\d.]+) .*/, '$1');

			return +correctedNumber;
		}
		default:
			return argsPrototype;
		}
	}

	getArgsPrototype(args: string[], whole: boolean) {
		return (whole ? args.join(' ') : fetchSentence(args, 0)) || undefined;
	}

	/**
	 * @description
	 * Si es un comando Slash, devuelve el valor del parámetro ingresado.
	 * Si es un comando de mensaje, remueve y devuelve la siguente entrada o devuelve todas las entradas en caso de que {@linkcode whole} sea verdadero.
	 * Si no se recibe ningún parámetro, se devuelve undefined.
	 * @param input El conjunto de entradas.
	 * @param slashIdentifier El identificador del parámetro para comandos Slash.
	 * @param whole Indica si devolver todas las entradas en caso de un comando de mensaje. Por defecto: false.
	 * @deprecated Esta función está deprecada. Usa {@linkcode CommandOptionSolver.getString}, {@linkcode CommandOptionSolver.getNumber}, etc. en su lugar.
	 */
	async fetchParam(input: CommandInteractionOptionResolver | Omit<CommandInteractionOptionResolver<'cached'>, 'getMessage' | 'getFocused'> | string[], slashIdentifier: string, whole: boolean = false): Promise<ParamResult> {
		const param: CommandParam = this.params.get(slashIdentifier);

		if(!param)
			throw ReferenceError(`No se pudo encontrar un parámetro con el identificador: ${slashIdentifier}`);

		if(param.poly !== 'SINGLE')
			throw TypeError(`No se puede devolver un solo valor con un poliparámetro: ${slashIdentifier}`);

		if(Array.isArray(input)) {
			if(Array.isArray(param.type)) {
				const results = await Promise.all(param.type.map(pt => this.fetchMessageParam(input, pt, whole)));
				return results.find(r => r);
			} else
				return this.fetchMessageParam(input, param.type, whole);
		}

		let getMethodName: GetMethodName = 'getString';

		if(Array.isArray(param.type)) {
			let result: ParamResult;

			for(const pt of param.type) {
				if(!isParamTypeStrict(pt))
					getMethodName = paramTypes[pt].getMethod;

				try {
					result = input[getMethodName](slashIdentifier, !param.optional);
				} catch {
					result = undefined;
				}

				if(result !== undefined) break;
			};

			return result;
		} else {
			if(!isParamTypeStrict(param.type))
				getMethodName = paramTypes[param.type].getMethod;

			return input[getMethodName](slashIdentifier, !param.optional);
		}
	};

	/**
	 * @description
	 * Devuelve un arreglo de todas las entradas recibidas.
	 * Si no se recibe ninguna entrada, se devuelve fallback.
	 * @param input El resolvedor de opciones de interacción.
	 * @param identifier El identificador del parámetro.
	 * @param callbackFn Una función de SlashCommandBuilder para leer un valor.
	 * @param fallback Un valor por defecto si no se recibe ninguna entrada.
	 * @returns Un arreglo con las entradas procesadas por callbackFn, o alternativamente, un valor devuelto por fallback.
	 */
	fetchParamPoly<TResult extends ParamResult, TFallback extends ParamResult | null | undefined>(
		input: CommandInteractionOptionResolver | Omit<CommandInteractionOptionResolver<'cached'>, 'getMessage' | 'getFocused'>,
		identifier: string, callbackFn: CommandArgumentGetFunction<TResult>,
		fallback: (() => TFallback) | TFallback | null | undefined = undefined
	): (TResult | TFallback)[] {
		const option: CommandParam = this.params.get(identifier);
		if(!option)
			throw new ReferenceError(`No se pudo encontrar un Poly-parámetro con el identificador: ${identifier}`);

		const singlename = identifier.replace(/[Ss]$/, '');
		let params: string[];
		if(option && option.poly)
			switch(option.poly) {
			case 'MULTIPLE':
				params = new Array(option.polymax)
					.fill(null)
					.map((_, i) => `${singlename}_${i + 1}`)
					.filter(param => param);
				break;
			case 'SINGLE':
				params = [ identifier ];
				break;
			default:
				params = option.poly.map(polyname => `${singlename}_${polyname}`);
				if(!Array.isArray(params))
					throw TypeError('Se esperaba un arreglo como Poly-parámetro');
				break;
			}

		const results = params
			.map((opt, i) => callbackFn.call(input, opt, !i && !option.optional))
			.filter(param => param);

		if(!params.length)
			return [ typeof fallback === 'function' ? fallback() : fallback ];

		return results;
	};

	/**
	 * @description
	 * Devuelve un valor o función basado en si se ingresó la flag buscada o no.
	 * Si no se recibe ninguna entrada, se devuelve fallback.
	 * Si callback no está definido, se devuelve el valor encontrado.
	 * @param input Los datos de entrada.
	 * @param identifier El identificador de la flag.
	 * @param output Define la respuestas en cada caso.
	 * @returns El valor de retorno de callback si la flag fue respondida, o en cambio, el de fallback.
	 */
	fetchFlag<T extends ParamResult = ParamResult, 	N extends ParamResult = ParamResult>(input: CommandInteractionOptionResolver | Omit<CommandInteractionOptionResolver<'cached'>, 'getMessage' | 'getFocused'> | string[], identifier: string, output: FeedbackOptions<T, N> = { callback: undefined, fallback: undefined }): T | N {
		const flag = this.flags.get(identifier);

		if(!flag)
			throw new ReferenceError(`No se pudo encontrar una Flag con el identificador: ${identifier}`);

		if(Array.isArray(input))
			// @ts-expect-error Te juro que se puede, solo no me acuerdo por qué
			return fetchMessageFlag(input, {
				property: flag.isExpressive(),
				...this.flags.get(identifier).structure,
				...output
			});

		let getMethod: GetMethodName = 'getBoolean';

		if(flag.isExpressive()) {
			if(isParamTypeStrict(flag.actualType))
				getMethod = 'getString';
			else
				getMethod = paramTypes[flag.actualType]?.getMethod ?? 'getString';
		}

		const flagValue = (input[getMethod] as ((name: string) => T))(identifier);

		if(flagValue == undefined)
			return output.fallback;

		if(output.callback == undefined)
			return flagValue;

		return typeof output.callback === 'function' ? output.callback(flagValue, true) : output.callback;
	};

	toJSON() {
		return JSON.parse(JSON.stringify({
			options: Object.fromEntries(this.options.entries()),
			params: Object.fromEntries(this.params.entries()),
			flags: Object.fromEntries(this.flags.entries()),
			defaults: this.#defaults,
		}));
	}
};

/**@class Representa un resolvedor de opciones de comando, sea este un comando de mensaje o un comandoSlash.*/
export class CommandOptionSolver<TArgs extends CommandArguments = CommandArguments> {
	#request: ComplexCommandRequest;
	#requestified: boolean;
	#args: TArgs;
	#rawArgs: string | null;
	#options: CommandOptions;
	#isSlash: boolean = false;
	#nextAttachmentIndex: number = 0;

	/**
	 * @description
	 * Crea un nuevo {@linkcode CommandOptionSolver} basado en el `request` indicado.
	 * El tipo de argumentos es lo que ultimadamente decide el comportamiento particular de esta instancia.
	 */
	constructor(request: ComplexCommandRequest, args: TArgs, options: CommandOptions, rawArgs: string = null) {
		this.#request = request;
		this.#requestified = false;
		this.#args = args;
		this.#rawArgs = rawArgs;
		this.#options = options;
		this.#isSlash = args instanceof CommandInteractionOptionResolver;
	}

	/**Devuelve los argumentos sin utilizar de este {@linkcode CommandOptionSolver} en texto.*/
	get remainder() {
		if(this.isMessageSolver(this.#args))
			return this.#args.join(' ');

		return `${this.#args}`;
	}

	/**Devuelve los argumentos de este {@linkcode CommandOptionSolver}, ya sean un array de strings o un {@linkcode CommandInteractionOptionResolver}.*/
	get args() {
		return this.#args;
	}

	/**
	 * Devuelve los argumentos de este {@linkcode CommandOptionSolver} como texto plano sin modificar del mensaje original.
	 *
	 * Si el comando es Slash, devuelve `null`.
	 */
	get rawArgs() {
		return this.#rawArgs;
	}

	/**
	 * Devuelve la cantidad de entradas de este {@linkcode CommandOptionSolver} si el mismo opera sobre un comando de mensaje.
	 *
	 * Si el comando es Slash, devuelve `-1`.
	 */
	get count() {
		return this.isMessageSolver(this.#args) ? this.#args.length : -1;
	}

	/**Verifica si este {@linkcode CommandOptionSolver} opera sobre un comando de mensaje y el mismo no tiene entradas.*/
	get empty() {
		return this.isMessageSolver(this.#args) && this.#args.length === 0;
	}

	/**
	 * @description Crea un iterador no destructivo de los argumentos de este {@linkcode CommandOptionSolver<String[]>}.
	 * @throws {Error} Al usarse con un {@linkcode CommandOptionSolver<CommandInteractionOptionResolver>}.
	 */
	get iterator(): IterableIterator<string> {
		if(!this.isMessageSolver(this.#args))
			throw new Error('No se puede extraer un "siguiente parámetro" de un Comando Slash');

		const args = this.#args.slice();
		return {
			[Symbol.iterator]() {
				return this;
			},
			next() {
				return (args.length)
					? ({ value: args.shift(), done: false })
					: ({ value: undefined,   done: true });
			},
		};
	}

	/**
	 * @description Arranca y devuelve la siguiente entrada de este {@linkcode CommandOptionSolver<String[]>}.
	 * @throws {Error} Al usarse con un {@linkcode CommandOptionSolver<CommandInteractionOptionResolver>}.
	 */
	next(): string {
		if(!this.isMessageSolver(this.#args))
			throw new Error('No se puede extraer un "siguiente parámetro" de un Comando Slash');

		return this.#args.shift();
	}

	/**
	 * @description Verifica si existe una siguiente entrada en este {@linkcode CommandOptionSolver<String[]>}.
	 * @throws {Error} Al usarse con un {@linkcode CommandOptionSolver<CommandInteractionOptionResolver>}.
	 */
	hasNext(): boolean {
		if(!this.isMessageSolver(this.#args))
			throw new Error('No se puede extraer un "siguiente parámetro" de un Comando Slash');

		return this.#args.length > 0;
	}

	//#region What is "this"
	/**@description Indica si esto es un {@linkcode CommandOptionSolver<string[]>}.*/
	isMessageSolver(args?: CommandArguments): args is string[] {
		return !this.#isSlash;
	}

	/**@description Indica si esto es un {@linkcode CommandOptionSolver<CommandInteractionOptionResolver>}.*/
	isInteractionSolver(args?: CommandArguments): args is CommandInteractionOptionResolver {
		return this.#isSlash;
	}
	//#endregion

	//#region Getters
	/**
	 * @description Devuelve un String sin comprobar su tipo. Esto solo debe hacerse con comandos de mensaje.
	 * @param identifier El identificador del {@linkcode CommandParam}.
	 * @param getRestOfMessageWord Cuando se trata de un comando de mensaje, si considerar cada palabra desde la cabecera como parte del valor del parámetro. Por defecto: `false`.
	 */
	getStringUnchecked(identifier: string, getRestOfMessageWords: boolean = false): string | undefined {
		if(this.isInteractionSolver(this.#args))
			throw 'Esta característica solo está permitida con comandos de mensaje';

		const result = this.#getResultFromParamSync(identifier, getRestOfMessageWords);
		return `${result}`;
	}

	/**
	 * @param identifier El identificador del {@linkcode CommandParam}.
	 * @param getRestOfMessageWords Cuando se trata de un comando de mensaje, si considerar cada palabra desde la cabecera como parte del valor del parámetro. Por defecto: `false`.
	 */
	getString(identifier: string, getRestOfMessageWords: boolean = false): string | undefined {
		if(this.isInteractionSolver(this.#args))
			return this.#args.getString(identifier);

		const result = this.#getResultFromParamSync(identifier, getRestOfMessageWords);
		return CommandOptionSolver.asString(result);
	}

	/**@param identifier El identificador del {@linkcode CommandParam}.*/
	getNumber(identifier: string, defaultValue: number | null = null): number | undefined {
		if(this.isInteractionSolver(this.#args))
			return this.#args.getNumber(identifier) ?? defaultValue;

		const result = this.#getResultFromParamSync(identifier, false) ?? defaultValue;
		return CommandOptionSolver.asNumber(result);
	}

	/**
	 * @param identifier El identificador del {@linkcode CommandParam}.
	 * @param getRestOfMessageWords Cuando se trata de un comando de mensaje, si considerar cada palabra desde la cabecera como parte del valor del parámetro. Por defecto: `false`.
	 */
	getUser(identifier: string, getRestOfMessageWords: boolean = false): User | undefined {
		if(this.isInteractionSolver(this.#args))
			return this.#args.getUser(identifier);

		this.ensureRequistified();

		const result = this.#getResultFromParamSync(identifier, getRestOfMessageWords);
		return CommandOptionSolver.asUser(result);
	}

	/**
	 * @param identifier El identificador del {@linkcode CommandParam}.
	 * @param getRestOfMessageWords Cuando se trata de un comando de mensaje, si considerar cada palabra desde la cabecera como parte del valor del parámetro. Por defecto: `false`.
	 */
	getMember(identifier: string, getRestOfMessageWords: boolean = false): GuildMember | undefined {
		if(this.isInteractionSolver(this.#args)) {
			const member = this.#args.getMember(identifier);
			const valid = member instanceof GuildMember;

			if(!valid) return;

			return member;
		}

		this.ensureRequistified();

		const result = this.#getResultFromParamSync(identifier, getRestOfMessageWords);
		return CommandOptionSolver.asMember(result);
	}

	/**
	 * @param identifier El identificador del {@linkcode CommandParam}.
	 * @param getRestOfMessageWords Cuando se trata de un comando de mensaje, si considerar cada palabra desde la cabecera como parte del valor del parámetro. Por defecto: `false`.
	 */
	async getGuild(identifier: string, getRestOfMessageWords: boolean = false): Promise<Guild | undefined> {
		if(this.isInteractionSolver(this.#args))
			return fetchGuild(this.#args.getString(identifier));

		const result = await this.#getResultFromParam(identifier, getRestOfMessageWords);
		return CommandOptionSolver.asGuild(result);
	}

	/**
	 * @param identifier El identificador del {@linkcode CommandParam}.
	 * @param getRestOfMessageWords Cuando se trata de un comando de mensaje, si considerar cada palabra desde la cabecera como parte del valor del parámetro. Por defecto: `false`.
	 */
	getChannel(identifier: string, getRestOfMessageWords: boolean = false): GuildBasedChannel | undefined {
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

	/**@param identifier El identificador del {@linkcode CommandParam}.*/
	getAttachment(identifier: string): Attachment | undefined {
		if(this.isInteractionSolver(this.#args)) {
			const attachment = this.#args.getAttachment(identifier);

			if(!CommandOptionSolver.isAttachment(attachment))
				return;

			return attachment;
		}

		this.ensureRequistified();

		const result = this.#request.attachments.at(this.#nextAttachmentIndex++);
		if(!result) return;
		return result;
	}

	/**
	 * @param identifier El identificador del {@linkcode CommandParam}.
	 * @param getRestOfMessageWords Cuando se trata de un comando de mensaje, si considerar cada palabra desde la cabecera como parte del valor del parámetro. Por defecto: `false`.
	 */
	async getMessage(identifier: string, getRestOfMessageWords: boolean = false): Promise<Message<true> | undefined> {
		this.ensureRequistified();

		if(this.isInteractionSolver(this.#args)) {
			const message = await fetchMessage(this.#args.getString(identifier), this.#request);

			if(!message?.inGuild())
				return undefined;

			return CommandOptionSolver.asMessage(message);
		}

		const result = await this.#getResultFromParam(identifier, getRestOfMessageWords);
		return CommandOptionSolver.asMessage(result);
	}

	/**
	 * @param identifier El identificador del {@linkcode CommandParam}.
	 * @param getRestOfMessageWords Cuando se trata de un comando de mensaje, si considerar cada palabra desde la cabecera como parte del valor del parámetro. Por defecto: `false`.
	 */
	getRole(identifier: string, getRestOfMessageWords: boolean = false): Role | undefined {
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

	/**@description Obtiene componentes de fecha de los argumentos de mensaje.*/
	#getDateComponentsFromMessage() {
		if(this.isMessageSolver(this.#args) === false)
			throw 'Se esperaban argumentos de comando de mensaje';

		if(!this.#args.length)
			return;

		const firstArg = this.#args[0];
		const rawDateStr = fetchSentence(this.#args, 0);
		const seps = [ '/', '.', '-' ];
		const dateComponents = rawDateStr.split(/[/.-]/).map(d => +(d.trim()));

		if(dateComponents.some(d => isNaN(d))) return;

		if(seps.some(s => rawDateStr.startsWith(s)))
			return;

		if(firstArg.startsWith('"')) {
			if(seps.some(s => rawDateStr.endsWith(s)))
				return;
		} else {
			if(seps.some(s => rawDateStr.endsWith(s)) && dateComponents.length >= 3)
				return;

			const done = false;
			while(!done && this.#args.length && dateComponents.length < 3) {
				const arg = this.#args[0];

				if(seps.includes(arg)) {
					this.#args.unshift();

					if(isNaN(+this.#args[0]))
						return;

					dateComponents.push(this.#args.unshift());
				} else if(seps.some(s => arg.includes(s))) {
					const subArgs = arg
						.split(/[/.-]/)
						.map(a => +a)
						.filter(a => !isNaN(a));

					if(!subArgs.length || (dateComponents.length + subArgs.length) > 3)
						return;

					dateComponents.push(...subArgs);
				}
			}
		}

		if(dateComponents.some(d => d < 1)) return;

		return dateComponents;
	}

	/**
	 * @description Obtiene componentes de fecha de una opción de comando Slash.
	 * @param {string} identifier El identificador del {@linkcode CommandParam}.
	 */
	#getDateComponentsFromInteraction(identifier: string) {
		if(this.isInteractionSolver(this.#args) === false)
			throw 'Se esperaban argumentos de comando Slash';

		const dateStr = this.#args.getString(identifier);
		return getDateComponentsFromString(dateStr);
	}

	#getRelativeDateCompatibleMessageArgs() {
		if(this.isMessageSolver(this.#args) === false)
			throw 'Se esperaban argumentos de comando de mensaje';

		const relativeDateKeys = new Set(Object.keys(relativeDates).flatMap(k => k.split(' ')));
		return this.#args.slice(0, 2).filter(a => relativeDateKeys.has(a)).join(' ');
	}

	/**
	 * Obtiene un objeto {@link Date} cuyo valor equivale la fecha localizada especificada, sin componentes horarios en UTC.
	 * @param {string} identifier El identificador del {@linkcode CommandParam}.
	 * @param {import('../../i18n').LocaleKey} locale La clave del idioma en el cual interpretar la fecha.
	 * @param {string} tzCode El código de zona horaria en el que se espera la fecha a interpretar.
	 */
	getDate(identifier: string, locale: import('../../i18n').LocaleKey, tzCode: string = 'Etc/UTC') {
		const str = this.isInteractionSolver(this.#args)
			? this.#args.getString(identifier)
			: this.#getRelativeDateCompatibleMessageArgs();

		for(const relativeDate of Object.values(relativeDates))
			if(relativeDate.match.has(str))
				return relativeDate.getValue(tzCode);

		const dateComponents = this.isInteractionSolver(this.#args)
			? this.#getDateComponentsFromInteraction(identifier)
			: this.#getDateComponentsFromMessage();

		if(dateComponents == undefined) return;

		const [ a, b, c ] = dateComponents;
		return makeDateFromComponents(a, b, c, locale, tzCode);
	}

	/**@description Obtiene un texto de hora en lenguaje natural a partir de los argumentos de mensaje.*/
	#getTimeStringFromMessage() {
		if(this.isMessageSolver(this.#args) === false)
			throw 'Se esperaban argumentos de comando de mensaje';

		if(!this.#args.length)
			return;

		const firstArg = this.#args[0].toLowerCase();
		const rawTimeStr = fetchSentence(this.#args, 0);

		if(firstArg.startsWith('"'))
			return rawTimeStr;

		let timeStr = rawTimeStr;

		type __TimeStrMatchHandler = (x: string) => void;
		const emptyHandler: __TimeStrMatchHandler = () => undefined;
		const directAppendHandler: __TimeStrMatchHandler = (x) => { timeStr += x; };

		const availableMatches: { [K: string]: ({ pattern: RegExp; limit: number; handler: __TimeStrMatchHandler; add?: typeof K[]; subtr?: typeof K[]; }); } = {
			spaces:    { pattern: /^\s+$/,         limit: 100, handler: emptyHandler,        },
			numbers:   { pattern: /^([0-9]+)$/,    limit: 2,   handler: directAppendHandler, },
			decimals:  { pattern: /^\d+$/,         limit: 1,   handler: directAppendHandler, subtr: [ 'numbers', 'dots' ] },
			colons:    { pattern: /^:$/,           limit: 2,   handler: directAppendHandler, },
			dots:      { pattern: /^\.$/,          limit: 1,   handler: directAppendHandler, add: [ 'numbers' ], subtr: [ 'decimals' ] },
			ampm:      { pattern: /^(am|pm)$/,     limit: 1,   handler: directAppendHandler, },
			gozengogo: { pattern: /^(午前|午後)$/, limit: 1,   handler: directAppendHandler, },
			ji:        { pattern: /^時$/,          limit: 1,   handler: directAppendHandler, },
			fun:       { pattern: /^分$/,          limit: 1,   handler: directAppendHandler, },
			byo:       { pattern: /^秒$/,          limit: 1,   handler: directAppendHandler, },
			han:       { pattern: /^半$/,          limit: 1,   handler: directAppendHandler, },
		};

		let arg  = '';
		while(this.hasNext()) {
			arg = this.next();

			let foundAvailableMatch = false;
			for(const [ id, availableMatch ] of Object.entries(availableMatches)) {
				const match = availableMatch.pattern.exec(arg);

				if(!match)
					continue;

				availableMatch.handler(match[0]);

				availableMatch.add?.forEach(id => {
					const m = availableMatches[id];
					if(m) m.limit++;
				});
				availableMatch.subtr?.forEach(id => {
					const m = availableMatches[id];
					if(m) m.limit--;
					if(m.limit <= 0)
						delete availableMatches[id];
				});

				availableMatch.limit--;
				if(availableMatch.limit <= 0)
					delete availableMatches[id];

				foundAvailableMatch = true;
				break;
			}

			console.log(foundAvailableMatch, arg);
			if(!foundAvailableMatch)
				return;
		}

		return timeStr;
	}

	/**
	 * Obtiene un texto de hora en lenguaje natural a partir de una opción de comando Slash
	 * @param {string} identifier El identificador del {@linkcode CommandParam}
	 */
	#getTimeStringFromInteraction(identifier: string) {
		if(this.isInteractionSolver(this.#args) === false)
			throw 'Se esperaban argumentos de comando de mensaje';

		const timeStr = this.#args.getString(identifier);
		return timeStr;
	}

	/**
	 * Obtiene un objeto {@link Date} cuyo valor equivale la hora especificada en milisegundos desde 0 absoluto, usando UTC
	 * @param identifier El identificador del {@linkcode CommandParam}
	 * @param z El huso horario con el cual corregir la fecha UTC+0 obtenida, en minutos
	 */
	getTime(identifier: string, z: number = 0) {
		const timeStr = this.isInteractionSolver(this.#args)
			? this.#getTimeStringFromInteraction(identifier)
			: this.#getTimeStringFromMessage();

		if(!timeStr) return;

		return parseTimeFromNaturalLanguage(timeStr, z);
	}

	/**
	 * Obtiene de forma asíncrona valores de usuario a partir del poli-parámetro bajo el `identifier` indicado y devuelve un array de resultado.
	 * * Si se obtienen valores de usuario para el poli-parámetro, se devuelve un array cuyos valores son de tipo {@linkcode ParamResult}, correspondientes a los valores de usuario.
	 * * Si no se obtiene ningún valor para el poli-parámetro y {@linkcode TFallback} no es `null` ni `undefined`, se devuelve un array cuyo único valor es `fallback`.
	 * * Si no se obtiene ningún valor para el poli-parámetro y {@linkcode TFallback} es `null` o `undefined`, se devuelve un array vacía.
	 * @param identifier El identificador del poli-parámetro que representa a cada {@linkcode CommandParam} asociado.
	 */
	async parsePolyParam<TFallback extends ParamResult | null>(
		identifier: string,
		parseOptions: PolyParamParsingOptions<TFallback> = {}
	): Promise<(ParamResult | TFallback)[]> {
		const { regroupMethod = 'SEPARATOR', messageSep = ',', fallback = undefined, failedPayload = undefined } = parseOptions;
		const option = this.#expectParam(identifier);

		if(this.isMessageSolver(this.#args)) {
			if(!Array.isArray(option.type) && !isParamTypeStrict(option.type) && paramTypes[option.type]?.getMethod === 'getAttachment') {
				this.ensureRequistified();
				return [ ...this.#request.attachments.values() ];
			}

			const mentionableType = option.type;
			const arrArgs = this.#regroupMessageArgs(this.#args, regroupMethod, { mentionableType, messageSep });
			if(!arrArgs.length)
				return this.#makePolyParamFallbackResult(fallback);

			const polymax = Array.isArray(option.poly) ? option.poly.length : option.polymax;
			const results = [];
			let i = 0;
			let arrArg;
			while(arrArgs.length && (arrArg = arrArgs[i], i++) < polymax) {
				let result;

				if(Array.isArray(option.type)) {
					const results = await Promise.all(option.type.map(pt => this.#options.fetchMessageParam(arrArgs, pt, false)));
					result = results.find(r => r);
				} else
					result = await this.#options.fetchMessageParam(arrArgs, option.type, false);

				if(result != null)
					results.push(result);
				else
					failedPayload?.push(arrArg);
			}

			return results;
		}

		const method = (Array.isArray(option.type) || isParamTypeStrict(option.type))
			? this.#args.getString
			: (this.#args[paramTypes[option.type].getMethod]);

		return this.#options
			.fetchParamPoly(this.#args, identifier, method, fallback)
			.filter(input => input != null);
	}

	/**
	 * Obtiene de forma síncrona valores de usuario a partir del poli-parámetro bajo el `identifier` indicado y devuelve un array de resultado
	 * * Si se obtienen valores de usuario para el poli-parámetro, se devuelve un array cuyos valores son de tipo {@linkcode ParamResult}, correspondientes a los valores de usuario
	 * * Si no se obtiene ningún valor para el poli-parámetro y {@linkcode TFallback} no es `null` ni `undefined`, se devuelve un array cuyo único valor es `fallback`
	 * * Si no se obtiene ningún valor para el poli-parámetro y {@linkcode TFallback} es `null` o `undefined`, se devuelve un array vacía
	 * @param identifier El identificador del poli-parámetro que representa a cada {@linkcode CommandParam} asociado
	 */
	parsePolyParamSync<TFallback extends ParamResult | null = undefined>(identifier: string, parseOptions: PolyParamParsingOptions<TFallback> = {}): Array<ParamResult | TFallback> {
		const { regroupMethod = 'SEPARATOR', messageSep = ',', fallback = undefined, failedPayload = undefined } = parseOptions;
		const option = this.#expectParam(identifier);

		if(this.isMessageSolver(this.#args)) {
			if(!Array.isArray(option.type) && !isParamTypeStrict(option.type) && paramTypes[option.type]?.getMethod === 'getAttachment') {
				this.ensureRequistified();
				return [ ...this.#request.attachments.values() ];
			}

			const mentionableType = option.type;
			const arrArgs = this.#regroupMessageArgs(this.#args, regroupMethod, { mentionableType, messageSep });
			if(!arrArgs.length)
				return this.#makePolyParamFallbackResult(fallback);

			const polymax = Array.isArray(option.poly) ? option.poly.length : option.polymax;
			const results = [];
			let i = 0;
			let arrArg: string;
			while(arrArgs.length && (arrArg = arrArgs[i], i++) < polymax) {
				let result;

				if(Array.isArray(option.type)) {
					const results = option.type.map(pt => this.#options.fetchMessageParamSync(arrArgs, pt, false));
					result = results.find(r => r);
				} else
					result = this.#options.fetchMessageParamSync(arrArgs, option.type, false);

				if(result != null)
					results.push(result);
				else
					failedPayload?.push(arrArg);
			}

			return results;
		}

		const method = (Array.isArray(option.type) || isParamTypeStrict(option.type))
			? this.#args.getString as CommandArgumentGetFunction<string>
			: (this.#args[paramTypes[option.type].getMethod as GetMethodName] as CommandArgumentGetFunction);

		return this.#options
			.fetchParamPoly(this.#args, identifier, method, fallback)
			.filter(input => input != null);
	}

	#makePolyParamFallbackResult<TFallback = undefined>(fallback: TFallback): Array<TFallback> {
		return fallback != undefined
			? [ (typeof fallback === 'function') ? fallback() : fallback ]
			: [];
	}

	#regroupMessageArgs(args: string[], regroupMethod: RegroupMethod, options: { mentionableType?: ParamType | Array<ParamType>; messageSep?: string; } = {}) {
		const { mentionableType: type = 'USER', messageSep: sep = ',' } = options;

		switch(regroupMethod) {
		case 'MENTIONABLES-WITH-SEP':
			if(type === 'USER' || type === 'MEMBER') {
				this.ensureRequistified();
				const userMentionRegex = /(<@[0-9]{16,}>)/g;
				args = args.map(a => a.replaceAll(userMentionRegex, `${sep} $&${sep}`));
			} else if(type === 'ROLE') {
				this.ensureRequistified();
				const roleMentionRegex = /(<@&[0-9]{16,}>)/g;
				args = args.map(a => a.replaceAll(roleMentionRegex, `${sep} $&${sep}`));
			} else if(type === 'CHANNEL') {
				this.ensureRequistified();
				const channelMentionRegex = /(<#[0-9]{16,}>)/g;
				args = args.map(a => a.replaceAll(channelMentionRegex, `${sep} $&${sep}`));
			}

		// eslint-disable-next-line no-fallthrough
		case 'SEPARATOR':
			return regroupText(args, sep);

		case 'DOUBLE-QUOTES':
			return groupQuoted(args);

		default:
			return args;
		}
	}

	/**@description Devuelve `true` si se ingresó la bandera especificada, o `false` de lo contrario.*/
	hasFlag(identifier: string) {
		if(this.isInteractionSolver(this.#args))
			return this.#args.getBoolean(identifier) ?? false;

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

	/**Devuelve el valor ingresado como un string si se ingresó la bandera especificada. De lo contrario, se devuelve `fallback` o `undefined`.*/
	parseFlagExpr(identifier: string, fallback: string = undefined) {
		return CommandOptionSolver.asString(this.#options.fetchFlag(
			this.#args,
			identifier,
			{
				callback: x => x,
				fallback,
			},
		));
	}

	/**
	 * @description
	 * Devuelve {@linkcode TResult} si se ingresó la bandera especificada, o {@linkcode TFallback} de lo contrario.
	 */
	flagIf<TResult extends ParamResult, TFallback extends ParamResult = undefined>(identifier: string, positiveResult: TResult, negativeResult: TFallback = undefined): TResult | TFallback {
		return this.#options.fetchFlag(
			this.#args,
			identifier,
			{
				callback: positiveResult,
				fallback: negativeResult,
			},
		);
	}

	/**@description Devuelve el valor ingresado como un string si se ingresó la bandera especificada, o `undefined` de lo contrario.*/
	flagExprIf(identifier: string): ReturnType<FlagCallback<string>> | undefined;

	/**@description Devuelve un valor de tipo {@linkcode TResult} si se ingresó la bandera especificada, o {@linkcode TFallback} de lo contrario.*/
	flagExprIf<TResult extends ParamResult, TFallback extends ParamResult = undefined>(identifier: string, callback: FlagCallback<TResult>, fallback?: TFallback): ReturnType<FlagCallback<TResult>> | TFallback;

	flagExprIf<TResult extends ParamResult, TFallback extends ParamResult = undefined>(
		identifier: string,
		callback: FlagCallback<TResult> = undefined,
		fallback: TFallback = undefined
	): ReturnType<FlagCallback<TResult>> | TFallback {
		callback ??= (x: TResult) => x;

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
	static asBoolean(paramResult: ParamResult): boolean | undefined {
		if(paramResult == undefined) return;
		if(typeof paramResult !== 'boolean')
			throw `Se esperaba el tipo de parámetro: Boolean, pero se recibió: ${typeof paramResult}`;
		return paramResult;
	}

	static asBooleans(paramResults: ParamResult[]) {
		return paramResults.map(r => CommandOptionSolver.asBoolean(r));
	}

	static asString(paramResult: ParamResult): string | undefined {
		if(paramResult == undefined) return;
		if(typeof paramResult !== 'string')
			throw `Se esperaba el tipo de parámetro: String, pero se recibió: ${typeof paramResult}`;
		return paramResult;
	}

	static asStrings(paramResults: ParamResult[]) {
		return paramResults.map(r => CommandOptionSolver.asString(r));
	}

	static asNumber(paramResult: ParamResult): number | undefined {
		if(paramResult == undefined) return;
		if(typeof paramResult !== 'number')
			throw `Se esperaba el tipo de parámetro: Number, pero se recibió: ${typeof paramResult}`;
		return paramResult;
	}

	static asNumbers(paramResults: ParamResult[]) {
		return paramResults.map(r => CommandOptionSolver.asNumber(r));
	}

	static asUser(paramResult: ParamResult): User | undefined {
		if(paramResult == undefined) return;
		if(!CommandOptionSolver.isUser(paramResult))
			throw `Se esperaba el tipo de parámetro: User, pero se recibió: ${typeof paramResult}`;
		return paramResult;
	}

	static asUsers(paramResults: ParamResult[]) {
		return paramResults.map(r => CommandOptionSolver.asUser(r));
	}

	static asMember(paramResult: ParamResult): GuildMember | undefined {
		if(paramResult == undefined) return;
		if(!CommandOptionSolver.isMember(paramResult))
			throw `Se esperaba el tipo de parámetro: GuildMember, pero se recibió: ${typeof paramResult}`;
		return paramResult;
	}

	static asMembers(paramResults: ParamResult[]) {
		return paramResults.map(r => CommandOptionSolver.asMember(r));
	}

	static asChannel(paramResult: ParamResult): GuildBasedChannel | undefined {
		if(paramResult == undefined) return;
		if(!CommandOptionSolver.isChannel(paramResult))
			throw `Se esperaba el tipo de parámetro: Channel, pero se recibió: ${typeof paramResult}`;
		return paramResult;
	}

	static asChannels(paramResults: ParamResult[]) {
		return paramResults.map(r => CommandOptionSolver.asChannel(r));
	}

	static asGuild(paramResult: ParamResult): Guild | undefined {
		if(paramResult == undefined) return;
		if(!CommandOptionSolver.isGuild(paramResult))
			throw `Se esperaba el tipo de parámetro: Guild, pero se recibió: ${typeof paramResult}`;
		return paramResult;
	}

	static asGuilds(paramResults: ParamResult[]) {
		return paramResults.map(r => CommandOptionSolver.asGuild(r));
	}

	static asAttachment(paramResult: ParamResult): Attachment | undefined {
		if(paramResult == undefined) return;
		if(!CommandOptionSolver.isAttachment(paramResult))
			throw `Se esperaba el tipo de parámetro: Attachment, pero se recibió: ${typeof paramResult}`;
		return paramResult;
	}

	static asAttachments(paramResults: ParamResult[]) {
		return paramResults.map(r => CommandOptionSolver.asAttachment(r));
	}

	static asMessage(paramResult: ParamResult): Message<true> | undefined {
		if(paramResult == undefined) return;
		if(!CommandOptionSolver.isMessage(paramResult))
			throw `Se esperaba el tipo de parámetro: Message<true>, pero se recibió: ${typeof paramResult}`;
		return paramResult;
	}

	static asMessages(paramResults: ParamResult[]) {
		return paramResults.map(r => CommandOptionSolver.asMessage(r));
	}

	static asRole(paramResult: ParamResult): Role | undefined {
		if(paramResult == undefined) return;
		if(!CommandOptionSolver.isRole(paramResult))
			throw `Se esperaba el tipo de parámetro: Role, pero se recibió: ${typeof paramResult}`;
		return paramResult;
	}

	static asRoles(paramResults: ParamResult[]) {
		return paramResults.map(r => CommandOptionSolver.asRole(r));
	}

	static asDate(paramResult: ParamResult): Date | undefined {
		if(paramResult == undefined) return;
		if(!CommandOptionSolver.isDate(paramResult))
			throw `Se esperaba el tipo de parámetro: Date, pero se recibió: ${typeof paramResult}`;
		return paramResult;
	}

	static asDates(paramResults: ParamResult[]) {
		return paramResults.map(r => CommandOptionSolver.asDate(r));
	}
	//#endregion

	//#region Type Guards
	static isUser(paramResult: ParamResult): paramResult is User {
		if(paramResult == undefined) return false;
		return paramResult instanceof User;
	}

	static isMember(paramResult: ParamResult): paramResult is GuildMember {
		if(paramResult == undefined) return false;
		return paramResult instanceof GuildMember;
	}

	static isChannel(paramResult: ParamResult): paramResult is GuildBasedChannel {
		if(paramResult == undefined) return false;
		return paramResult instanceof GuildChannel;
	}

	static isGuild(paramResult: ParamResult): paramResult is Guild {
		if(paramResult == undefined) return false;
		return paramResult instanceof Guild;
	}

	static isAttachment(paramResult: ParamResult): paramResult is Attachment {
		if(paramResult == undefined) return false;
		return paramResult instanceof Attachment;
	}

	static isMessage(paramResult: ParamResult): paramResult is Message<true> {
		if(paramResult == undefined) return false;
		return paramResult instanceof Message;
	}

	static isRole(paramResult: ParamResult): paramResult is Role {
		if(paramResult == undefined) return false;
		return paramResult instanceof Role;
	}

	static isDate(paramResult: ParamResult): paramResult is Date {
		if(paramResult == undefined) return false;
		return paramResult instanceof Date;
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

	#expectParam(identifier: string) {
		const option = this.#options.options.get(identifier);

		if(!option)
			throw `No se encontró una opción bajo el identificador: ${identifier}`;

		if(!option.isCommandParam())
			throw 'Se esperaba un identificador de parámetro de comando';

		return option;
	}

	#getResultFromParamSync(identifier: string, getRestOfMessageWords: boolean = false): ParamResult {
		if(!this.isMessageSolver(this.#args))
			throw 'Se esperaban argumentos de comando de mensaje';

		const arrArgs = this.#args;

		const option = this.#options.options.get(identifier);
		if(!option.isCommandParam())
			throw 'Se esperaba un identificador de parámetro de comando';

		let finalResult: ParamResult;
		if(Array.isArray(option.type)) {
			const results = option.type.map(pt => this.#options.fetchMessageParamSync(arrArgs, pt, getRestOfMessageWords));
			finalResult = results.find(r => r);
		} else
			finalResult = this.#options.fetchMessageParamSync(arrArgs, option.type, getRestOfMessageWords);

		return finalResult;
	}

	async #getResultFromParam(identifier: string, getRestOfMessageWords: boolean = false): Promise<ParamResult> {
		if(!this.isMessageSolver(this.#args))
			throw 'Se esperaban argumentos de comando de mensaje';

		const arrArgs = this.#args;

		const option = this.#options.options.get(identifier);
		if(!option.isCommandParam())
			throw 'Se esperaba un identificador de parámetro de comando';

		if(Array.isArray(option.type)) {
			const results = await Promise.all(option.type.map(pt => this.#options.fetchMessageParam(arrArgs, pt, getRestOfMessageWords)));
			return results.find(r => r);
		} else
			return this.#options.fetchMessageParam(arrArgs, option.type, getRestOfMessageWords);
	}

	toJSON() {
		return JSON.parse(JSON.stringify({
			isSlash: this.#isSlash,
			requestified: this.#requestified,
			args: this.#args,
			options: this.#options,
			nextAttachmentIndex: this.#nextAttachmentIndex,
		}));
	}
	//#endregion
}

export class InvalidCommandOptionAttributeError extends Error {
	constructor(message: string = null) {
		super(message);
		this.name = 'InvalidOptionAttributeError';
	}
}
