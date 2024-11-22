/**@param {number} first*/
function* iotaGenerator(first) {
	let value = first;
	while(true) yield value++;
}

/**
 * Genera valores ascendientes cada vez que se llama.
 * Si se indica `start`, se comienza a contar otra vez desde ahí
 * @type {{ (start?: number): number, gen: Generator<number, void, unknown>? }} IotaFunction
 */
let iota;
{
	/**@param {number?} [start]*/
	const fn = function(start = null) {
		if((start != null) || (iota.gen == null))
			iota.gen = iotaGenerator(start || 0);
	
		const result = iota.gen.next().value;
		return /**@type {number}*/(result);
	}
	fn.gen = /**@type {Generator<number, void, unknown> | null}*/(null);
	iota = fn;
}

/**
 * Limita un string a una cantidad definida de caracteres.
 * Si el string sobrepasa el máximo establecido, se reemplaza el final por un string suspensor para indicar el recorte
 * @param {string} text 
 * @param {number?} max
 * @param {string?} suspensor 
 * @returns {string}
 */
function shortenText(text, max = 200, suspensor = '...') {
	if(typeof text !== 'string') throw TypeError('El texto debe ser un string');
	if(typeof max !== 'number') throw TypeError('El máximo debe ser un número');
	if(typeof suspensor !== 'string') throw TypeError('El suspensor debe ser un string');
	if(text.length < max) return text;
	return `${text.slice(0, max - suspensor.length)}${suspensor}`;
}

/**@type {Readonly<Array<String>>}*/
const shortNumberNames = [
	'millones', 'miles de millones', 'billones', 'miles de billones', 'trillones', 'miles de trillones', 'cuatrillones', 'miles de cuatrillones',
	'quintillones', 'miles de quintillones', 'sextillones', 'miles de sextillones', 'septillones', 'miles de septillones',
	'octillones', 'miles de octillones', 'nonillones', 'miles de nonillones', 'decillones', 'miles de decillones', 'undecillones', 'miles de undecillones',
	'duodecillones', 'miles de duodecillones', 'tredecillones', 'miles de tredecillones', 'quattuordecillones', 'miles de quattuordecillones',
	'quindecillones', 'miles de quindecillones', 'sexdecillones', 'miles de sexdecillones'
];

/**
 * @param {number | string} num El número a mejorarle la visibilidad
 * @param {boolean} shorten Si acortar el número para volverlo más fácil de leer
 * @param {number} minDigits Cantidad mínima de dígitos para rellenar con 0s a la izquierda
 * @returns {string}
 */
function improveNumber(num, shorten = false, minDigits = 1) {
	if(typeof num === 'string')
		num = parseFloat(num);
	if(isNaN(num))
		return '0';
	
	/**
	 * @param {number} n
	 * @param {Intl.NumberFormatOptions} nopt
	 */
	const formatNumber = (n, nopt = {}) => n.toLocaleString('en', { maximumFractionDigits: 2, minimumIntegerDigits: minDigits, ...nopt });
	if((num < 1000000) || !shorten)
		return formatNumber(num);
	
	const googol = Math.pow(10, 100);
	if(num >= googol)
		return `${formatNumber(num / googol, { maximumFractionDigits: 4 })} Gúgol`;

	const jesus = shortNumberNames;
	const ni = (num < Math.pow(10, 6 + jesus.length * 3))
		? Math.floor((num.toLocaleString('fullwide', { useGrouping: false }).length - 7) / 3)
		: jesus.length - 1;
	const snum = formatNumber(num / Math.pow(1000, ni + 2), { minimumFractionDigits: 2 });
	
	return [ snum, jesus[ni] ].join(' ');
}

/**
 * @typedef {object} LowerCaseNormalizationOptions
 * @property {boolean} [removeCarriageReturns=false] Indica si remover los caracteres de retorno de carro "\r". Por defecto: `false`
 * 
 * Pasa a minúsculas y remueve las tildes de un texto
 * @param {string} text
 * @param {LowerCaseNormalizationOptions} options
 * @returns {string}
 */
function toLowerCaseNormalized(text, options = {}) {
	const { removeCarriageReturns = false } = options;
	
	text = text
		.replace(/[áéíóúàèìòùâêîôûäëïöüāēīōūãñçõ]/gi, char => char.normalize('NFD').replace(/[\u0300-\u036f]/, ''))
		.toLowerCase();
	
	if(removeCarriageReturns)
		text = text.replace(/\r/g, '');

	return text;
}

/**
 * Devuelve un valor aleatorio entre 0 y otro valor
 * @param {number} maxExclusive Máximo valor; excluído del resultado. 1 por defecto
 * @param {boolean} [round=false] Si el número debería ser redondeado hacia abajo. `true` por defecto
 * @returns {number}
 */
function rand(maxExclusive, round = true) {
	maxExclusive = +maxExclusive;
	const negativeHandler = (maxExclusive < 0) ? -1 : 1;
	maxExclusive = maxExclusive * negativeHandler;
	const value = ((Date.now() * 0.001 + maxExclusive * Math.random()) % maxExclusive) * negativeHandler;
	return round ? Math.floor(value) : value;
}

/**
 * Devuelve un valor aleatorio dentro de un rango entre 2 valores
 * @param {number} minInclusive Mínimo valor; puede ser incluído en el resultado
 * @param {number} maxExclusive Máximo valor; excluído del resultado
 * @param {boolean} [round=false] Si el número debería ser redondeado hacia abajo. `false` por defecto
 * @returns {number}
 */
function randRange(minInclusive, maxExclusive, round = true) {
	minInclusive = +minInclusive;
	maxExclusive = +maxExclusive;
	const range = maxExclusive - minInclusive;
	const value = minInclusive + ((Date.now() * 0.001 + range * Math.random()) % range);
	return round ? Math.floor(value) : value;
}

/**
 * Devuelve un valor acomodado al rango facilitado
 * @param {number} value El valor a acomodar
 * @param {number} min El mínimo del rango
 * @param {number} max El máximo del rango
 * @returns {number}
 */
function clamp(value, min, max) {
	if(min > max) {
		const temp = min;
		min = max;
		max = temp;
	}

	return Math.max(min, Math.min(value, max));
}

/**
 * Convierte un string hexadecimal en un número
 * @param {string} str 
 * @returns {number}
 */
function stringHexToNumber(str) {
	if(typeof str !== 'string')
		throw TypeError('Se esperaba un string de hexadecimal para convertir a número');

	if(!str.length)
		return 0;

	if(str.startsWith('#'))
		str = str.slice(1);

	return parseInt(`0x${str}`);
}

module.exports = {
	iota,
	toLowerCaseNormalized,
	shortenText,
	improveNumber,
	rand,
	randRange,
	clamp,
	stringHexToNumber,
};
