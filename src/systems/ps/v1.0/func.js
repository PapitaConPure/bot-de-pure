module.exports = {
	/**
	 * @description
	 * Limita un string a una cantidad definida de caracteres.
	 * Si el string sobrepasa el máximo establecido, se reemplaza el final por un string suspensor para indicar el recorte.
	 * @param {string} text
	 * @param {number | null} max
	 * @param {string | null} suspensor
	 * @returns {string}
	 * @ignore
	 */
	shortenText: function(text, max = 200, suspensor = '...') {
		if(typeof text !== 'string') throw TypeError('El texto debe ser un string');
		if(typeof max !== 'number') throw TypeError('El máximo debe ser un número');
		if(typeof suspensor !== 'string') throw TypeError('El suspensor debe ser un string');
		if(text.length < max) return text;
		return `${text.slice(0, max - suspensor.length)}${suspensor}`;
	},
};
