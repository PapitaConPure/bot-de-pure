/**
 * @typedef {'COMMON' | 'MOD' | 'EMOTE' | 'MEME' | 'CHAOS' | 'GAME' | 'MAINTENANCE' | 'OUTDATED' | 'GUIDE' | 'PAPA' | 'HOURAI'} MetaFlagValue
 * @type {Array<String>}
 */
const metaFlagValues = [
    'COMMON',
    'MOD',
    'EMOTE',
    'MEME',
    'CHAOS',
    'GAME',
    'MAINTENANCE',
    'OUTDATED',
    'GUIDE',
    'PAPA',
    'HOURAI',
];

/**
 * Devuelve la profundidad de una Meta Flag
 * @param {MetaFlagValue} flag 
 */
const metaFlagDepth = flag => 2 ** (metaFlagValues.indexOf(flag) ?? 0);

/**Representa un conjunto de Meta Flags de comando*/
class CommandMetaFlagsManager {
    /**@type {Number}*/
    bitField;

    /**
     * Crea un conjunto de Meta Flags de comando
     * @constructor
     * @param {Number?} bitField Un valor binario que representa la combinación de Flags del comando
     */
    constructor(bitField = 0) {
        this.bitField = bitField;
    };

    /**
     * Introduce Meta Flags de comando al conjunto
     * @param  {...MetaFlagValue} flags Meta Flags de comando a introducir
     */
    add(...flags) {
        flags.forEach(flag => {
            this.bitField = this.bitField | metaFlagDepth(flag);
        });
        return this;
    };

    /**
     * Comprueba si el conjunto contiene una Meta Flag
     * @param  {MetaFlagValue} flag Meta Flag de comando a comprobar
     */
    has(flag) {
        return !!(this.bitField & metaFlagDepth(flag));
    };

    /**
     * Comprueba si el conjunto contiene al menos una de las Meta Flag mencionadas
     * @param  {...MetaFlagValue} flags Meta Flags de comando a comprobar
     */
    any(...flags) {
        return flags.some(flag => this.has(flag));
    };

    /**
     * Comprueba si el conjunto contiene al menos una de las Meta Flag mencionadas
     * @param  {...MetaFlagValue} flags Meta Flags de comando a comprobar
     */
    all(...flags) {
        return flags.every(flag => this.has(flag));
    };

    /**
     * Valor decimal del conjunto de Meta Flags
     */
    get value() {
        return this.bitField;
    };

    /**Valores decimales de las Meta Flags existentes en el conjunto*/
    get rawValues() {
        return metaFlagValues.filter(value => metaFlagDepth(this.has(value)));
    };

    /**Claves de las Meta Flags existentes en el conjunto*/
    get values() {
        return metaFlagValues.filter(value => this.has(value));
    };
};

module.exports = {
    metaFlagDepth,
    CommandMetaFlagsManager,
};