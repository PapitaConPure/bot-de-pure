function* iotaGenerator(first: number) {
	let value = first;
	while(true) yield value++;
}

class Ut {
	static#iota: Generator<number, void, unknown>;

	/**
	 * @description Crea un nuevo generador Iota con el valor inicial especificado, avanza el generador y devuelve ese valor
	 * @param value El valor inicial del nuevo generador Iota
	 */
	static Iota(value: number = 0): number {
		Ut.#iota = iotaGenerator(value);
		return Ut.iota;
	}

	/**
	 * Devuelve el siguiente valor del generador Iota actual
	 */
	static get iota(): number {
		if(Ut.#iota == null)
			return Ut.Iota();

		const value = Ut.#iota.next().value;
		return value as number;
	}

	/**@description Limita el valor al rango descrito (inclusive)*/
	static clamp(value: number, min: number, max: number): number {
		if(min > max) {
			const temp = min;
			min = max;
			max = temp;
		}

		return Math.max(min, Math.min(value, max));
	}
}

export default Ut;
