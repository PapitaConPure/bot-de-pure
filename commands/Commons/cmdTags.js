/**
 * Pequeño disclaimer: no había necesidad de optimizar esto con bitfields, pero lo hice de todas formas porque quería probar usar bitfields por primera vez, sonaba divertido.
 * En efecto, resulta que fue divertido. Tenga un buen día.
 * ~~Papita
 */

/**
 * @param {number | bigint} n 
 */
const bigIntField = (n) => 2n ** BigInt(n);

const CommandTag = {
    COMMON: bigIntField(1),
    MOD: bigIntField(2),
    EMOTE: bigIntField(3),
    MEME: bigIntField(4),
    CHAOS: bigIntField(5),
    GAME: bigIntField(6),
    MAINTENANCE: bigIntField(7),
    OUTDATED: bigIntField(8),
    GUIDE: bigIntField(9),
    PAPA: bigIntField(10),
    HOURAI: bigIntField(11),
};

/**
 * @typedef {keyof CommandTag} CommandTagFields
 * @typedef {CommandTagFields|bigint|number} CommandTagResolvable
 * @type {ReadonlyArray<CommandTagFields>}
 */
//@ts-ignore
const metaFlagValues = Object.keys(CommandTag);

/**
 * Devuelve la profundidad de una tag de comando
 * @param {CommandTagResolvable|Array<CommandTagResolvable>} tag 
 */
function resolveTagNumber(tag) {
    if(typeof tag === 'bigint')
        return tag;

    if(typeof tag === 'number')
        return BigInt(tag);

    if(typeof tag === 'string') {
        const tagFromObject = CommandTag[tag];
        if(typeof tagFromObject === 'bigint')
            return tagFromObject;

        throw `Se recibió una cadena de etiqueta de comando cuyo valor no está dentro de los admitidos: ${tag}`;
    }

    if(Array.isArray(tag))
        return resolveTagNumber(tag.reduce((a, b) => resolveTagNumber(a) | resolveTagNumber(b)));

    throw `Se recibió una etiqueta de comando cuyo tipo es inválido: ${tag} (${typeof tag})`;
}

/**@class Representa un conjunto de etiquetas de comando*/
class CommandTags {
    /**@type {bigint}*/
    #bitfield;

    /**
     * Crea un conjunto de etiquetas de comando
     * @constructor
     * @param {CommandTagResolvable} [bitfield=0n] Un valor binario que representa la combinación de Flags del comando
     */
    constructor(bitfield = 0n) {
        this.#bitfield = resolveTagNumber(bitfield);
    };

    /**
     * Introduce Meta Flags de comando al conjunto
     * @param  {...CommandTagResolvable} flags Meta Flags de comando a introducir
     */
    add(...flags) {
        this.#bitfield |= resolveTagNumber(flags);
        return this;
    };

    /**
     * Comprueba si el conjunto contiene una Meta Flag
     * @param {CommandTagResolvable|Array<CommandTagResolvable>} flag Meta Flag de comando a comprobar
     */
    has(flag) {
        return !!(this.#bitfield & resolveTagNumber(flag));
    };

    /**
     * Comprueba si el conjunto contiene al menos una de las Meta Flag mencionadas
     * @param  {...(CommandTagResolvable|Array<CommandTagResolvable>)} flags Meta Flags de comando a comprobar
     */
    any(...flags) {
        return flags.some(flag => this.has(flag));
    };

    /**
     * Comprueba si el conjunto contiene todas las Meta Flag mencionadas
     * @param  {...(CommandTagResolvable|Array<CommandTagResolvable>)} flags Meta Flags de comando a comprobar
     */
    all(...flags) {
        return flags.every(flag => this.has(flag));
    };

    get bitfield() {
        return this.#bitfield;
    };

    /**Valores decimales individuales de las Meta Flags existentes en el conjunto, ordenadas de mayor a menor*/
    get rawValues() {
        /**@type {Array<bigint>}*/
        const values = [];

        let i = BigInt(2 ** this.#bitfield.toString(2).length);
        while(i > 0n) {
            const value = this.#bitfield & i;
            if(value) values.push(value);
            i = i >> 1n;
        }
        
        return values;
    };

    get keys() {
        return metaFlagValues.filter(key => this.has(key));
    };

    toString() {
        return `CommandTags{${this.#bitfield}}`;
    }
};

module.exports = {
    CommandTag,
    CommandTags,
};