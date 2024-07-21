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
}

module.exports = Ut;
