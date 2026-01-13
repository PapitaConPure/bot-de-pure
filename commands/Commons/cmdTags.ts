/*
 * Pequeño disclaimer: no había necesidad de optimizar esto con bitfields, pero lo hice de todas formas porque quería probar usar bitfields por primera vez, sonaba divertido.
 * En efecto, resulta que fue divertido. Tenga un buen día.
 * ~~Papita
 */

const bigIntField = (n: number | bigint) => 2n ** BigInt(n);

export const CommandTag = ({
    COMMON      : bigIntField( 1),
    MOD         : bigIntField( 2),
    EMOTE       : bigIntField( 3),
    MEME        : bigIntField( 4),
    CHAOS       : bigIntField( 5),
    GAME        : bigIntField( 6),
    MAINTENANCE : bigIntField( 7),
    OUTDATED    : bigIntField( 8),
    GUIDE       : bigIntField( 9),
    PAPA        : bigIntField(10),
    SAKI        : bigIntField(11),
    MUSIC       : bigIntField(12),
}) as const;

export type CommandTagStringField = keyof typeof CommandTag;
export type CommandTagResolvable = CommandTagStringField | bigint | number;
const metaFlagValues = Object.keys(CommandTag) as ReadonlyArray<CommandTagStringField>;

/**@description Devuelve la profundidad de una tag de comando.*/
function resolveTagNumber(tag: CommandTagResolvable | CommandTagResolvable[]) {
    if(typeof tag === 'bigint')
        return tag;

    if(typeof tag === 'number')
        return BigInt(tag);

    if(typeof tag === 'string') {
        const tagFromObject = CommandTag[tag];

        if(typeof tagFromObject !== 'bigint')
            throw new TypeError(`Se recibió una cadena de etiqueta de comando cuyo valor no está dentro de los admitidos: ${tag}`);

        return tagFromObject;
    }

    if(!Array.isArray(tag))
        throw new TypeError(`Se recibió una etiqueta de comando cuyo tipo es inválido: ${tag} (${typeof tag})`);
        
    return resolveTagNumber(tag.reduce((a, b) => resolveTagNumber(a) | resolveTagNumber(b)));
}

/**@class Representa un conjunto de etiquetas de comando*/
export class CommandTags {
    #bitfield: bigint;

    /**
     * @description
     * Crea un conjunto de etiquetas de comando
     * @param bitfield Un valor binario que representa la combinación de Flags del comando
     */
    constructor(bitfield: CommandTagResolvable = 0n) {
        this.#bitfield = resolveTagNumber(bitfield);
    };

    /**
     * @description
     * Introduce Meta Flags de comando al conjunto
     * @param flags Meta Flags de comando a introducir
     */
    add(...flags: CommandTagResolvable[]) {
        this.#bitfield |= resolveTagNumber(flags);
        return this;
    };

    /**
     * @description
     * Comprueba si el conjunto contiene una Meta Flag
     * @param flag Meta Flag de comando a comprobar
     */
    has(flag: CommandTagResolvable | CommandTagResolvable[]) {
        return !!(this.#bitfield & resolveTagNumber(flag));
    };

    /**
     * @description
     * Comprueba si el conjunto contiene al menos una de las Meta Flag mencionadas
     * @param flags Meta Flags de comando a comprobar
     */
    any(...flags: (CommandTagResolvable | CommandTagResolvable[])[]) {
        return flags.some(flag => this.has(flag));
    };

    /**
     * @description
     * Comprueba si el conjunto contiene todas las Meta Flag mencionadas
     * @param flags Meta Flags de comando a comprobar
     */
    all(...flags: (CommandTagResolvable | CommandTagResolvable[])[]) {
        return flags.every(flag => this.has(flag));
    };

    get bitfield() {
        return this.#bitfield;
    };

    /**@description Valores decimales individuales de las Meta Flags existentes en el conjunto, ordenadas de mayor a menor*/
    get rawValues() {
        const values: bigint[] = [];

        let i = BigInt(2 ** this.#bitfield.toString(2).length);
        while(i > 0n) {
            const value = this.#bitfield & i;
            if(value) values.push(value);
            i = i >> 1n;
        }
        
        return values;
    };

    get keys(): CommandTagStringField[] {
        return metaFlagValues.filter(key => this.has(key));
    };

    toString() {
        return `CommandTags{${this.#bitfield}}`;
    }
};
