/**
 * @param {Number} first 
 */
function* iotaGenerator(first) {
	let value = first;
	while(true) yield value++;
}

class Ut {
	/**@type {Generator<Number, void, unknown>}*/
	static #iota;

	/**
	 * Crea un nuevo generador Iota con el valor inicial especificado, avanza el generador y devuelve ese valor
	 * @param {Number} [value=0] El valor inicial del nuevo generador Iota
	 * @returns {Number}
	 */
	static Iota(value = 0) {
		Ut.#iota = iotaGenerator(value);
		return Ut.iota;
	}

	/**
	 * Devuelve el siguiente valor del generador Iota actual
	 * @returns {Number}
	 */
	static get iota() {
		if(Ut.#iota == null)
			return Ut.Iota();

		const value = Ut.#iota.next().value;
		return /**@type {Number}*/(value);
	}

	/**
	 * Limita el valor al rango descrito (inclusive)
	 * @param {Number} value 
	 * @param {Number} min 
	 * @param {Number} max 
	 * @returns {Number}
	 */
	static clamp(value, min, max) {
        if(min > max) {
            const temp = min;
            min = max;
            max = temp;
        }

        return Math.max(min, Math.min(value, max));
    }
}

module.exports = Ut;
