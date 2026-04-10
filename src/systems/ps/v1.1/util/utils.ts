/**@param {number} first*/
function* iotaGenerator(first: number) {
	let value = first;
	while(true) yield value++;
}

type IotaFunction = { (start?: number): number; gen?: Generator<number, void, unknown>; };

/**
 * @description
 * Genera valores ascendientes cada vez que se llama.
 * Si se indica `start`, se comienza a contar otra vez desde ahí.
 */
export let iota: IotaFunction;
{
	const fn = function(start: number | null = null) {
		if((start != null) || (iota.gen == null))
			iota.gen = iotaGenerator(start || 0);

		const result = iota.gen.next().value;
		return result as number;
	};
	fn.gen = null as Generator<number, void, unknown> | null;
	iota = fn;
}

/**
 * @description
 * Limita un string a una cantidad definida de caracteres.
 * Si el string sobrepasa el máximo establecido, se reemplaza el final por un string suspensor para indicar el recorte.
 */
export function shortenText(text: string, max: number | null = 200, suspensor: string | null = '...'): string {
	if(typeof text !== 'string') throw TypeError('El texto debe ser un string');
	if(typeof max !== 'number') throw TypeError('El máximo debe ser un número');
	if(typeof suspensor !== 'string') throw TypeError('El suspensor debe ser un string');
	if(text.length < max) return text;
	return `${text.slice(0, max - suspensor.length)}${suspensor}`;
}

const shortNumberNames: Readonly<string[]> = [
	'millones', 'miles de millones', 'billones', 'miles de billones', 'trillones', 'miles de trillones', 'cuatrillones', 'miles de cuatrillones',
	'quintillones', 'miles de quintillones', 'sextillones', 'miles de sextillones', 'septillones', 'miles de septillones',
	'octillones', 'miles de octillones', 'nonillones', 'miles de nonillones', 'decillones', 'miles de decillones', 'undecillones', 'miles de undecillones',
	'duodecillones', 'miles de duodecillones', 'tredecillones', 'miles de tredecillones', 'quattuordecillones', 'miles de quattuordecillones',
	'quindecillones', 'miles de quindecillones', 'sexdecillones', 'miles de sexdecillones'
];

/**
 * @param num El número a mejorarle la visibilidad.
 * @param shorten Si acortar el número para volverlo más fácil de leer.
 * @param minDigits Cantidad mínima de dígitos para rellenar con 0s a la izquierda.
 */
export function improveNumber(num: number | string, shorten: boolean = false, minDigits: number = 1): string {
	if(typeof num === 'string')
		num = parseFloat(num);
	if(isNaN(num))
		return '0';

	/**
	 * @param {number} n
	 * @param {Intl.NumberFormatOptions} nopt
	 */
	const formatNumber = (n: number, nopt: Intl.NumberFormatOptions = {}) => n.toLocaleString('en', { maximumFractionDigits: 2, minimumIntegerDigits: minDigits, ...nopt });
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

interface LowerCaseNormalizationOptions {
	removeCarriageReturns?: boolean;
}
/**@description Pasa a minúsculas y remueve las tildes de un texto.*/
export function toLowerCaseNormalized(text: string, options: LowerCaseNormalizationOptions = {}): string {
	const { removeCarriageReturns = false } = options;

	text = text
		.replace(/[áéíóúàèìòùâêîôûäëïöüāēīōūãñçõ]/gi, char => char.normalize('NFD').replace(/[\u0300-\u036f]/, ''))
		.toLowerCase();

	if(removeCarriageReturns)
		text = text.replace(/\r/g, '');

	return text;
}

/**
 * @description Devuelve un valor aleatorio entre 0 y otro valor.
 * @param maxExclusive Máximo valor; excluído del resultado. 1 por defecto.
 * @param round Si el número debería ser redondeado hacia abajo. `true` por defecto.
 */
export function rand(maxExclusive: number, round: boolean = true): number {
	maxExclusive = +maxExclusive;
	const negativeHandler = (maxExclusive < 0) ? -1 : 1;
	maxExclusive = maxExclusive * negativeHandler;
	const value = ((Date.now() * 0.001 + maxExclusive * Math.random()) % maxExclusive) * negativeHandler;
	return round ? Math.floor(value) : value;
}

/**
 * @description Devuelve un valor aleatorio dentro de un rango entre 2 valores.
 * @param minInclusive Mínimo valor; puede ser incluído en el resultado.
 * @param maxExclusive Máximo valor; excluído del resultado.
 * @param round Si el número debería ser redondeado hacia abajo. `false` por defecto.
 */
export function randRange(minInclusive: number, maxExclusive: number, round: boolean = true): number {
	minInclusive = +minInclusive;
	maxExclusive = +maxExclusive;
	const range = maxExclusive - minInclusive;
	const value = minInclusive + ((Date.now() * 0.001 + range * Math.random()) % range);
	return round ? Math.floor(value) : value;
}

/**
 * @description Devuelve un valor acomodado al rango facilitado.
 * @param value El valor a acomodar
 * @param min El mínimo del rango
 * @param max El máximo del rango
 */
export function clamp(value: number, min: number, max: number): number {
	if(min > max) {
		const temp = min;
		min = max;
		max = temp;
	}

	return Math.max(min, Math.min(value, max));
}

/**@description Convierte un string hexadecimal a un número.*/
export function stringHexToNumber(str: string): number {
	if(typeof str !== 'string')
		throw TypeError('Se esperaba un string de hexadecimal para convertir a número');

	if(!str.length)
		return 0;

	if(str.startsWith('#'))
		str = str.slice(1);

	return parseInt(`0x${str}`);
}
